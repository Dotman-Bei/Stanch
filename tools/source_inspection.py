import subprocess
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "evidence" / "source-inspection"

CHECKS = [
    (
        "n1-no-resume.txt",
        "N1 — no method restores RUNNING after construction",
        [
            ("grep -nE 'def (resume|unhalt|set_status|set_standard|withdraw)' contracts/stanch.py", "expect: no output"),
            ("grep -n 'RUNNING' contracts/stanch.py", "expect: the constant, the register assignment, and comparisons only"),
            ("grep -nE 'self\\.status\\[[^]]*\\] = ' contracts/stanch.py", "expect: exactly two lines, one RUNNING in register and one HALTED in submit_claim"),
        ],
    ),
    (
        "n2-no-write-path.txt",
        "N2 — no write path to any target",
        [
            ("grep -nE '\\.emit\\(|emit_transfer|contract\\.deploy|contract\\.interface' contracts/stanch.py", "expect: no output"),
            ("grep -n 'gl.contract.get_at' contracts/stanch.py", "expect: .view() only, never .emit"),
        ],
    ),
    (
        "n3-no-payable.txt",
        "N3 — no payable method and no value custody",
        [
            ("grep -n 'payable' contracts/stanch.py", "expect: no output"),
            ("grep -n 'gl.message.value' contracts/stanch.py", "expect: no output"),
        ],
    ),
]


def run(command: str) -> tuple[int, str]:
    result = subprocess.run(
        command, shell=True, cwd=ROOT, capture_output=True, text=True
    )
    return result.returncode, (result.stdout + result.stderr)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    commit = run("git rev-parse HEAD")[1].strip()

    for filename, title, checks in CHECKS:
        lines = [title, f"observed: {stamp}", f"commit:   {commit}", ""]
        for command, expectation in checks:
            code, output = run(command)
            lines.append(f"$ {command}")
            lines.append(f"# {expectation}")
            lines.append(output.rstrip() if output.strip() else "(no output)")
            lines.append(f"# exit status {code}")
            lines.append("")
        (OUT / filename).write_text("\n".join(lines))
        print("wrote", OUT / filename)


if __name__ == "__main__":
    main()
