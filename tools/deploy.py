import json
import time
from pathlib import Path
from typing import Optional

from tools.studio_next import client, explorer_address, explorer_tx

ROOT = Path(__file__).resolve().parent.parent

WAIT_INTERVAL = 10
WAIT_RETRIES = 90
WAIT_UNTIL = "decided"
_FEE_CACHE: dict = {}


def retry(action, attempts: int = 6, delay: int = 10, label: str = ""):
    last = None
    for attempt in range(attempts):
        try:
            return action()
        except Exception as exc:
            last = exc
            text = str(exc)
            transient = any(
                marker in text
                for marker in ("502", "Bad gateway", "timed out", "Connection", "not supported on this chain")
            )
            if not transient or attempt == attempts - 1:
                raise
            print(f"   retry {label or 'rpc'} after {text[:90]}")
            time.sleep(delay * (attempt + 1))
    raise last


def deploy(gl, source: Path, args: Optional[list] = None) -> dict:
    fees = generic_fees(gl)
    tx = retry(
        lambda: gl.deploy_contract(code=source.read_bytes(), args=args or [], fees=fees),
        label="deploy",
    )
    receipt = retry(
        lambda: gl.wait_for_transaction_receipt(
            transaction_hash=tx,
            wait_until=WAIT_UNTIL,
            retries=WAIT_RETRIES,
            interval=WAIT_INTERVAL,
        ),
        label="deploy receipt",
    )
    return summarize(receipt, tx)


def call(
    gl,
    address: str,
    method: str,
    args: Optional[list] = None,
    value: int = 0,
    wait_retries: Optional[int] = None,
    stall_attempts: int = 1,
) -> dict:
    fees = estimate_fees_for(gl, address, method, args, value)
    retries = wait_retries or WAIT_RETRIES
    last_hash = None
    for attempt in range(stall_attempts):
        tx = retry(
            lambda: gl.write_contract(
                address=address,
                function_name=method,
                args=args or [],
                value=value,
                fees=fees,
            ),
            label=f"write {method}",
        )
        last_hash = tx
        try:
            receipt = retry(
                lambda: gl.wait_for_transaction_receipt(
                    transaction_hash=tx,
                    wait_until=WAIT_UNTIL,
                    retries=retries,
                    interval=WAIT_INTERVAL,
                ),
                attempts=2,
                label=f"receipt {method}",
            )
            return summarize(receipt, tx)
        except Exception as exc:
            state = stalled_state(gl, tx)
            print(
                f"   {method} did not decide within "
                f"{retries * WAIT_INTERVAL}s (state {state});"
                f" attempt {attempt + 1} of {stall_attempts}"
            )
            if attempt == stall_attempts - 1:
                return {
                    "txHash": tx,
                    "explorer": explorer_tx(tx),
                    "lifecycle": state,
                    "executionResult": "DID_NOT_DECIDE",
                    "stallError": str(exc)[:400],
                }
    return {"txHash": last_hash, "executionResult": "DID_NOT_DECIDE"}


def stalled_state(gl, tx_hash: str):
    try:
        return (gl.get_transaction(tx_hash) or {}).get("lifecycle")
    except Exception:
        return None


def generic_fees(gl) -> dict:
    if "generic" not in _FEE_CACHE:
        _FEE_CACHE["generic"] = retry(
            lambda: gl.estimate_transaction_fees(), label="fee estimate"
        )
    return _FEE_CACHE["generic"]


MESSAGE_EMITTING = ("p1_spawn", "p2_async_call", "p4_pay_out")


def estimate_fees_for(gl, address: str, method: str, args: Optional[list], value: int) -> dict:
    if method not in MESSAGE_EMITTING and value == 0:
        return generic_fees(gl)
    try:
        return retry(
            lambda: gl.estimate_transaction_fees_for_write(
                address=address, function_name=method, args=args or [], value=value
            ),
            label=f"fee estimate {method}",
        )
    except Exception:
        return retry(lambda: gl.estimate_transaction_fees(), label="fee estimate fallback")


def read(gl, address: str, method: str, args: Optional[list] = None):
    return retry(
        lambda: gl.read_contract(address=address, function_name=method, args=args or []),
        attempts=4,
        delay=6,
        label=f"read {method}",
    )


def summarize(receipt: dict, tx_hash: str) -> dict:
    consensus = receipt.get("consensus_data") or {}
    leader = (consensus.get("leader_receipt") or [{}])[0]
    return {
        "txHash": tx_hash,
        "explorer": explorer_tx(tx_hash),
        "lifecycle": receipt.get("lifecycle"),
        "executionResult": receipt.get("txExecutionResultName"),
        "consensusResult": receipt.get("result_name"),
        "address": receipt.get("to_address"),
        "addressExplorer": explorer_address(receipt.get("to_address") or ""),
        "leaderStatus": (leader.get("result") or {}).get("status"),
        "leaderPayload": (leader.get("result") or {}).get("payload"),
        "votes": consensus.get("votes"),
        "eqOutputs": leader.get("eq_outputs"),
    }


def write_evidence(name: str, payload: dict) -> Path:
    path = ROOT / "evidence" / "studio-next" / name
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, default=str) + "\n")
    return path
