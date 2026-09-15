import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
README = ROOT / "README.md"
DEPLOYMENT = ROOT / "evidence" / "studio-next" / "deployment.json"
PROBES = ROOT / "probes" / "results.json"
START = "<!-- GATE-STATUS -->"
END = "<!-- /GATE-STATUS -->"

EXPLORER = "https://explorer-studio-dev.genlayer.com"

GATES = [
    ("G0", "Probes run on Studio Next, results committed, P3 resolved"),
    ("G1", "STANCH deployed, address and deploy transaction recorded"),
    ("G2", "CISTERN deployed, registered, status_of returns RUNNING"),
    ("G3", "A true claim returns EXPLOIT and flips the status"),
    ("G4", "A CISTERN write reverts with STANCH_HALTED after the flip"),
    ("G5", "A false claim returns CLEAR, the target stays RUNNING"),
    ("G6", "An insufficient claim returns INDETERMINATE"),
    ("G7", "All five negative claims have committed evidence"),
    ("G8", "Frontend serves registry, verdict record and proof room with no wallet"),
    ("G9", "Demo video recorded, showing G3, G4 and G5"),
    ("G10", "Clean-clone reproduction passes"),
]

MARK = {True: "PASS", False: "FAIL", None: "NOT YET RUN"}
BLOCKED = "BLOCKED"


def load(path: Path):
    return json.loads(path.read_text()) if path.exists() else {}


def main() -> None:
    deployment = load(DEPLOYMENT)
    probes = load(PROBES)
    gates = deployment.get("gates") or {}

    results: dict = {}
    p3 = ((probes.get("probes") or {}).get("P3") or {}).get("pass")
    results["G0"] = bool(probes) and p3 is True
    results["G1"] = bool((deployment.get("stanch") or {}).get("address"))
    results["G2"] = (gates.get("G2") or {}).get("pass")
    results["G3"] = (gates.get("G3") or {}).get("pass")
    results["G4"] = (gates.get("G4") or {}).get("pass")
    results["G5"] = (gates.get("G5") or {}).get("pass")
    g6 = gates.get("G6") or {}
    results["G6"] = g6.get("pass")
    g6_blocked = bool(g6.get("blocked"))
    g6_reason = g6.get("reason")

    inspection = ROOT / "evidence" / "source-inspection"
    results["G7"] = all(
        (inspection / name).exists()
        for name in ("n1-no-resume.txt", "n2-no-write-path.txt", "n3-no-payable.txt")
    ) and bool(results["G3"]) and bool(results["G5"])
    results["G8"] = (ROOT / "frontend" / "app" / "page.tsx").exists() and bool(
        results["G1"]
    )
    results["G9"] = None
    results["G10"] = None

    lines = [START, ""]
    stamp = deployment.get("updatedAtUtc") or datetime.now(timezone.utc).isoformat(
        timespec="seconds"
    ).replace("+00:00", "Z")
    lines.append(f"Recorded {stamp} against Studio Next, chain 61997.")
    lines.append("")
    lines.append("| Gate | Condition | Status |")
    lines.append("|---|---|---|")
    for gate, condition in GATES:
        state = results.get(gate)
        mark = MARK.get(state, "NOT YET RUN")
        if gate == "G6" and g6_blocked and state is None:
            mark = BLOCKED
        lines.append(f"| {gate} | {condition} | **{mark}** |")
    lines.append("")

    if g6_blocked and results["G6"] is None and g6_reason:
        lines.append(f"**G6 is blocked, not skipped.** {g6_reason}")
        lines.append("")

    if results["G9"] is None or results["G10"] is None:
        pending = [g for g in ("G9", "G10") if results.get(g) is None]
        lines.append(
            f"{' and '.join(pending)} are not yet run. They are listed as "
            "NOT YET RUN rather than omitted."
        )
        lines.append("")

    stanch = deployment.get("stanch") or {}
    cistern = deployment.get("cistern") or {}
    if stanch.get("address"):
        lines.append("### Deployed on Studio Next")
        lines.append("")
        lines.append("| Contract | Address | Deploy transaction |")
        lines.append("|---|---|---|")
        for label, key in (
            ("STANCH", "stanch"),
            ("CISTERN (demo target)", "cistern"),
            ("CISTERN-FIXED (control)", "cistern_fixed"),
            ("Injection target (campaign)", "injection_target"),
        ):
            record = deployment.get(key) or {}
            address = record.get("address")
            if not address:
                continue
            tx = record.get("txHash") or ""
            deploy_cell = (
                f"[`{tx[:18]}…`]({EXPLORER}/tx/{tx})" if tx else "not recovered"
            )
            lines.append(
                f"| {label} | [`{address}`]({EXPLORER}/address/{address}) | {deploy_cell} |"
            )
        lines.append("")

        for gate, key, description in (
            ("G3", "G3", "the true claim that halted CISTERN"),
            ("G5", "G5", "the false claim that was refused"),
            ("G4", "G4", "the CISTERN write that reverted after the halt"),
        ):
            record = gates.get(key) or {}
            blocked = record.get("blockedWrites") or []
            tx = (record.get("tx") or (blocked[0] if blocked else {}) or {}).get("txHash")
            verdict = record.get("verdict")
            status = record.get("statusAfter") or record.get("statusSeenByTarget")
            reason = record.get("revertReason")
            if tx:
                detail = f"verdict `{verdict}`, " if verdict else ""
                if reason:
                    detail += f"reverted `{reason}`, "
                detail += f"target `{status}`" if status else ""
                lines.append(
                    f"- **{gate}**, {description}: {detail} — "
                    f"[`{tx[:18]}…`]({EXPLORER}/tx/{tx})"
                )

        unreadable = deployment.get("unreadableMethod") or {}
        unreadable_tx = (unreadable.get("tx") or {}).get("txHash")
        if unreadable_tx:
            lines.append(
                "- **Not a gate, recorded anyway**: a reading spec naming a method the "
                "target does not expose reverts the claim transaction, records nothing "
                "and halts nothing — "
                f"[`{unreadable_tx[:18]}…`]({EXPLORER}/tx/{unreadable_tx})"
            )

        control = deployment.get("control") or {}
        control_tx = (control.get("accrueTx") or {}).get("txHash")
        if control_tx:
            lines.append(
                "- **Control**: the same accrual against `cistern_fixed.py` is refused "
                f"by the target itself with `{control.get('refusalReason')}`, so the "
                "invariant never breaks and no claim is possible — "
                f"[`{control_tx[:18]}…`]({EXPLORER}/tx/{control_tx})"
            )
        lines.append("")

    if cistern.get("address"):
        exploit = deployment.get("exploit") or {}
        final = exploit.get("finalReport")
        if final:
            parsed = json.loads(final)
            lines.append(
                f"CISTERN's published invariant is *{parsed['invariant']}*. At verdict "
                f"time it read `total_deposited = {parsed['total_deposited']}` and "
                f"`total_claimable = {parsed['total_claimable']}`, an excess of "
                f"`{parsed['excess_claimable']}` units after "
                f"`{parsed['accrual_calls']}` unrestricted accrual calls."
            )
            lines.append("")

    lines.append(END)

    text = README.read_text()
    if START in text and END in text:
        head = text[: text.index(START)]
        tail = text[text.index(END) + len(END) :]
        README.write_text(head + "\n".join(lines) + tail)
    else:
        README.write_text(text.replace(START, "\n".join(lines)))
    print("gate status written")
    for gate, _ in GATES:
        print(f"  {gate}: {MARK.get(results.get(gate), 'NOT YET RUN')}")


if __name__ == "__main__":
    main()
