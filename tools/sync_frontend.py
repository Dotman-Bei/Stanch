import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TARGET = ROOT / "frontend" / "lib" / "stanch"


def main() -> None:
    TARGET.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(ROOT / "evidence" / "claims.json", TARGET / "claims.json")

    probes = json.loads((ROOT / "probes" / "results.json").read_text())
    slim = {
        "network": probes.get("network"),
        "runner": probes.get("runner"),
        "finishedAtUtc": probes.get("finishedAtUtc"),
        "probes": {
            key: {"question": value.get("question"), "pass": value.get("pass")}
            for key, value in (probes.get("probes") or {}).items()
        },
    }
    slim["probes"].setdefault("P3", {})["question"] = (
        "contract-to-contract synchronous view, in a view and in a write"
    )
    (TARGET / "probes.json").write_text(json.dumps(slim, indent=2) + "\n")

    deployment = ROOT / "evidence" / "studio-next" / "deployment.json"
    if deployment.exists():
        record = json.loads(deployment.read_text())
        record["status"] = "LIVE" if record.get("stanch", {}).get("address") else "UNDEPLOYED"
        (TARGET / "deployment.json").write_text(json.dumps(record, indent=2) + "\n")

    print("synced ->", TARGET)


if __name__ == "__main__":
    main()
