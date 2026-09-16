import json
import sys
from datetime import datetime, timezone
from pathlib import Path

from tools.deploy import call, deploy, read, write_evidence
from tools.run_gates import load_state, save_state
from tools.studio_next import client, explorer_address

ROOT = Path(__file__).resolve().parent.parent


def now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def main() -> None:
    count = int(sys.argv[1]) if len(sys.argv) > 1 else 4
    gl = client()
    state = load_state()
    stanch = state["stanch"]["address"]

    made = state.get("sandboxes") or []
    existing = {row["key"] for row in made}

    for index in range(1, count + 1):
        key = f"sandbox-{index}"
        if key in existing:
            print(key, "already exists, skipping")
            continue

        target = deploy(gl, ROOT / "contracts" / "cistern.py", args=[stanch, key])
        call(gl, stanch, "register", [key, target["address"]])
        call(gl, target["address"], "deposit", [1000])
        call(gl, target["address"], "accrue_yield", [])

        report = json.loads(read(gl, target["address"], "vault_report"))
        status = read(gl, stanch, "status_of", [key])
        broken = int(report["total_claimable"]) > int(report["total_deposited"])

        row = {
            "key": key,
            "address": target["address"],
            "explorer": explorer_address(target["address"]),
            "deployTx": target["txHash"],
            "status": status,
            "vaultReport": report,
            "invariantBroken": broken,
            "preparedAtUtc": now(),
        }
        made.append(row)
        state["sandboxes"] = made
        save_state(state)
        print(
            f"{key}: {status} | deposited={report['total_deposited']} "
            f"claimable={report['total_claimable']} broken={broken}"
        )

    write_evidence("sandboxes.json", {"preparedAtUtc": now(), "sandboxes": made})
    print("\nready:", sum(1 for r in made if r["status"] == "RUNNING"), "halt-able targets")


if __name__ == "__main__":
    main()
