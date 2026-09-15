import json
from datetime import datetime, timezone
from pathlib import Path
from subprocess import run

ROOT = Path(__file__).resolve().parent.parent
LEDGER = ROOT / "evidence" / "claims.json"
STUDIO = ROOT / "evidence" / "studio-next"
INSPECTION = ROOT / "evidence" / "source-inspection"
PROBES = ROOT / "probes" / "results.json"


def now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def load(path: Path):
    return json.loads(path.read_text()) if path.exists() else {}


def exists(*names: str) -> bool:
    return all((ROOT / name).exists() for name in names)


def main() -> None:
    ledger = json.loads(LEDGER.read_text())
    probes = load(PROBES)
    deployment = load(STUDIO / "deployment.json")
    gates = deployment.get("gates") or {}
    probe_results = probes.get("probes") or {}

    def gate_passed(gate: str) -> bool:
        return bool((gates.get(gate) or {}).get("pass"))

    def probe_passed(probe: str) -> bool:
        return (probe_results.get(probe) or {}).get("pass") is True

    rows = {row["id"]: row for row in ledger["claims"]}

    def promote(claim_id, status, classes, evidence=None, observed=True, claim=None):
        row = rows.get(claim_id)
        if row is None:
            return
        if evidence is not None:
            row["evidence"] = evidence
        missing = [path for path in row.get("evidence", []) if not exists(path)]
        if missing and status != "NOT_CLAIMED":
            row["status"] = "UNMEASURED"
            row["evidenceClasses"] = []
            row["observedAtUtc"] = None
            row.setdefault("limitations", []).append(
                f"Evidence file(s) not present at ledger update time: {', '.join(missing)}."
            )
            return
        row["status"] = status
        row["evidenceClasses"] = classes
        row["observedAtUtc"] = now() if observed else None
        if claim:
            row["claim"] = claim

    # ---- probes
    if probe_passed("P3"):
        promote(
            "P3-SYNC-CROSS-CONTRACT-VIEW",
            "SUPPORTED",
            ["studio_next_observation"],
            ["probes/results.json"],
        )
    if "P2" in probe_results:
        promote(
            "P2-ASYNC-EMIT-EXECUTION",
            "SUPPORTED",
            ["studio_next_observation"],
            ["probes/results.json"],
            claim=(
                "On Studio Next an asynchronous message emitted by an Intelligent "
                "Contract through gl.contract.get_at(addr).emit() does reach the "
                "callee, once the transaction carries a fee allocation for that "
                "message; the callee's counter went from 0 to 1 and recorded the "
                "emitting contract as its caller. This row records that observation "
                "and does not assert that STANCH depends on the behaviour either way."
                if probe_passed("P2")
                else rows["P2-ASYNC-EMIT-EXECUTION"]["claim"]
            ),
        )

    # ---- negative claims resting on source only
    promote("N2-NO-WRITE-PATH", "SUPPORTED", ["source_inspection"],
            ["evidence/source-inspection/n2-no-write-path.txt"])
    promote("N1-NO-RESUME", "PARTIAL", ["source_inspection"],
            ["evidence/source-inspection/n1-no-resume.txt"])
    promote("N3-NO-VALUE-CUSTODY", "PARTIAL", ["source_inspection"],
            ["evidence/source-inspection/n3-no-payable.txt"])

    # ---- claims resting on gates
    if gate_passed("G5"):
        promote("N4-FALSE-CLAIM-REFUSED", "SUPPORTED",
                ["consensus_receipt", "studio_next_observation"],
                ["evidence/studio-next/g5-false-claim.json"])
    if gate_passed("G3"):
        promote("G3-TRUE-HALT-ON-CONSENSUS", "SUPPORTED",
                ["consensus_receipt", "studio_next_observation"],
                ["evidence/studio-next/g3-true-halt.json"])
    if gate_passed("G4"):
        promote("G4-TARGET-SELF-ENFORCES", "SUPPORTED",
                ["studio_next_observation"],
                ["evidence/studio-next/g4-halted-revert.json"])
    if gate_passed("G6"):
        promote("G6-INDETERMINATE-DISTINCT", "PARTIAL",
                ["studio_next_observation", "publisher_claim"],
                ["evidence/studio-next/g6-indeterminate.json"])

    if "P5" in probe_results:
        promote("N5-STANDARD-IMMUTABLE", "PARTIAL", ["studio_next_observation"],
                ["probes/results.json"])

    ledger["updatedAtUtc"] = now()
    commit = run(["git", "rev-parse", "HEAD"], cwd=ROOT, capture_output=True, text=True)
    ledger["revision"]["baseCommit"] = commit.stdout.strip() or "UNSET"

    LEDGER.write_text(json.dumps(ledger, indent=2) + "\n")
    print("ledger updated:", LEDGER)
    for row in ledger["claims"]:
        print(f"  {row['status']:12} {row['id']}")


if __name__ == "__main__":
    main()
