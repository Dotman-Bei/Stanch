import json
import sys
from datetime import datetime, timezone
from pathlib import Path

from tools.deploy import call, read, write_evidence
from tools.studio_next import client, explorer_address

ROOT = Path(__file__).resolve().parent.parent
STATE = ROOT / "evidence" / "studio-next" / "deployment.json"


def now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def main() -> None:
    stanch = sys.argv[1]
    gl = client()
    observed = {
        "observedAtUtc": now(),
        "note": (
            "Read directly from Studio Next at the time above. Every field here is a "
            "live read of deployed state, not a replay of an earlier run's log."
        ),
        "stanch": {"address": stanch, "addressExplorer": explorer_address(stanch)},
    }

    registry = json.loads(read(gl, stanch, "registry"))
    observed["registry"] = registry
    observed["rootReport"] = json.loads(read(gl, stanch, "root_report"))
    observed["standardLength"] = len(str(read(gl, stanch, "standard")))
    observed["unregisteredKeyReads"] = read(gl, stanch, "status_of", ["never-registered"])

    count = int(read(gl, stanch, "claim_count"))
    claims = [json.loads(read(gl, stanch, "claim_at", [i])) for i in range(count)]
    observed["claimCount"] = count
    observed["claims"] = claims

    by_verdict = {}
    for claim in claims:
        by_verdict.setdefault(claim["verdict"], []).append(claim["index"])
    observed["claimsByVerdict"] = by_verdict

    targets = {row["key"]: row for row in registry["targets"]}
    observed["targets"] = targets

    demo = targets.get("cistern-demo")
    if demo:
        observed["cistern"] = {
            "address": demo["target"],
            "statusInStanch": demo["status"],
            "statusAsCisternReadsIt": read(gl, demo["target"], "stanch_status"),
            "vaultReport": json.loads(read(gl, demo["target"], "vault_report")),
        }
        if demo["status"] == "HALTED":
            attempt = call(gl, demo["target"], "deposit", [1])
            observed["cistern"]["writeAttemptAfterHalt"] = attempt
            observed["cistern"]["writeReverted"] = (
                attempt["executionResult"] != "FINISHED_WITH_RETURN"
            )

    control = targets.get("cistern-fixed-control")
    if control:
        observed["cisternFixed"] = {
            "address": control["target"],
            "statusInStanch": control["status"],
            "vaultReport": json.loads(read(gl, control["target"], "vault_report")),
        }

    write_evidence("observed-deployment.json", observed)
    print(json.dumps({k: v for k, v in observed.items() if k != "claims"}, indent=2)[:2000])
    print("\nclaims:")
    for claim in claims:
        print(f"  #{claim['index']} {claim['verdict']:14} {claim['key']:24} {claim['note']!r}")


if __name__ == "__main__":
    main()
