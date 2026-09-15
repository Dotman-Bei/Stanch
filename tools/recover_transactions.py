import json
import sys
from pathlib import Path

from tools.deploy import summarize
from tools.studio_next import client, explorer_address, explorer_tx

ROOT = Path(__file__).resolve().parent.parent


def transactions_for(gl, address: str) -> list:
    response = gl.provider.make_request("sim_getTransactionsForAddress", [address])
    return response.get("result") or []


def describe(tx: dict) -> dict:
    data = tx.get("data") or {}
    raw_calldata = data.get("calldata") if isinstance(data, dict) else None
    if isinstance(raw_calldata, dict):
        calldata = raw_calldata.get("readable")
    else:
        calldata = raw_calldata if isinstance(raw_calldata, str) else None
    consensus = tx.get("consensus_data") or {}
    receipts = consensus.get("leader_receipt") or [{}]
    leader = receipts[0] if isinstance(receipts, list) and receipts else {}
    leader = leader if isinstance(leader, dict) else {}
    raw_result = leader.get("result")
    leader_result = raw_result if isinstance(raw_result, dict) else {"payload": raw_result}
    return {
        "txHash": tx.get("hash"),
        "explorer": explorer_tx(tx.get("hash", "")),
        "from": tx.get("from_address"),
        "to": tx.get("to_address"),
        "calldata": calldata,
        "executionResult": tx.get("txExecutionResultName"),
        "consensusResult": tx.get("result_name"),
        "lifecycle": tx.get("lifecycle"),
        "isDeploy": bool(data.get("contract_code")) if isinstance(data, dict) else False,
        "leaderStatus": leader_result.get("status"),
        "leaderPayload": leader_result.get("payload"),
        "validatorVotes": consensus.get("votes"),
    }


def main() -> None:
    gl = client()
    addresses = sys.argv[1:]
    out = {}
    for address in addresses:
        rows = [describe(tx) for tx in transactions_for(gl, address)]
        out[address] = {"explorer": explorer_address(address), "transactions": rows}
        print(f"\n=== {address} ({len(rows)} transactions) ===")
        for row in rows:
            label = "DEPLOY" if row["isDeploy"] else str(row["calldata"] or "")[:70]
            print(f"  {row['txHash'][:20]}… {str(row['executionResult']):22} {label}")
    path = ROOT / "evidence" / "studio-next" / "transactions.json"
    path.write_text(json.dumps(out, indent=2, default=str) + "\n")
    print("\nwritten:", path)


if __name__ == "__main__":
    main()
