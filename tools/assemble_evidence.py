import base64
import json
from datetime import datetime, timezone
from pathlib import Path

from tools.studio_next import explorer_address, explorer_tx

ROOT = Path(__file__).resolve().parent.parent
STUDIO = ROOT / "evidence" / "studio-next"

STANCH = "0xe3C5B525a413797F86a2742C9C5d1502045EBC24"
CISTERN = "0x288aA7651e3260fA13B09bD86c7430FD52585f30"
FIXED = "0xCac4C9B43FC343b1D5003Bd400299e12b7db271b"
INJECTION = "0x84E5C85E5C7a44Ed3f3c950C39953A5d70257C60"


def now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def readable(calldata: str) -> str:
    if not calldata:
        return ""
    try:
        return base64.b64decode(calldata).decode("utf-8", "replace")
    except Exception:
        return ""


def decode_payload(payload):
    if not isinstance(payload, str):
        return payload
    try:
        raw = base64.b64decode(payload, validate=True)
    except Exception:
        return payload
    text = raw.decode("utf-8", "replace").lstrip("\x00\x01\x02")
    return text if text.isprintable() and text.strip() else payload


def record(tx: dict) -> dict:
    return {
        "txHash": tx["txHash"],
        "explorer": tx["explorer"],
        "executionResult": tx["executionResult"],
        "consensusResult": tx["consensusResult"],
        "lifecycle": tx["lifecycle"],
        "leaderStatus": tx.get("leaderStatus"),
        "leaderPayload": decode_payload(tx.get("leaderPayload")),
        "validatorVotes": tx.get("validatorVotes"),
        "decodedCalldata": readable(tx.get("calldata") or ""),
    }


def main() -> None:
    txs = json.loads((STUDIO / "transactions.json").read_text())
    observed = json.loads((STUDIO / "observed-deployment.json").read_text())

    def rows(address: str) -> list:
        return txs[address]["transactions"]

    def find(address, predicate):
        for tx in rows(address):
            if predicate(tx, readable(tx.get("calldata") or "")):
                return tx
        return None

    stanch_deploy = find(STANCH, lambda tx, _: tx["isDeploy"])
    cistern_deploy = find(CISTERN, lambda tx, _: tx["isDeploy"])
    fixed_deploy = find(FIXED, lambda tx, _: tx["isDeploy"])
    injection_deploy = find(INJECTION, lambda tx, _: tx["isDeploy"])

    def registration_for(key: str, target: str | None = None):
        """Find the register transaction that actually bound this key.

        Three things have to hold, and the third was learned the hard way. The
        adversarial campaign attempted to rebind `squat-victim-own-key` to a
        different address; that attempt was correctly refused, but it is still a
        register call naming that key, and matching on the key alone returned it.
        Reporting a refused transaction as the one that bound a key would be
        simply false, so the match also requires the transaction to have
        succeeded and to name the address the key currently points at.
        """
        for tx in rows(STANCH):
            calldata = readable(tx.get("calldata") or "")
            if "register" not in calldata or "submit_claim" in calldata:
                continue
            if key not in calldata:
                continue
            if tx.get("executionResult") != "FINISHED_WITH_RETURN":
                continue
            if target and target[2:].lower() not in calldata.lower():
                continue
            return tx
        return None

    reg_demo = registration_for("cistern-demo")
    reg_fixed = registration_for("cistern-fixed-control")
    reg_injection = registration_for("injection-target")

    claim_true = find(
        STANCH,
        lambda tx, c: "submit_claim" in c and "vault_report" in c
        and tx["executionResult"] == "FINISHED_WITH_RETURN",
    )
    claim_false = find(
        STANCH,
        lambda tx, c: "submit_claim" in c and "total_deposited_units" in c
        and tx["executionResult"] == "FINISHED_WITH_RETURN",
    )
    claim_unreadable = find(
        STANCH,
        lambda tx, c: "submit_claim" in c and "oracle_price_feed_history" in c,
    )
    claim_insufficient = find(
        STANCH,
        lambda tx, c: "submit_claim" in c and "published_invariant" in c
        and "total_deposited_units" not in c
        and tx["executionResult"] == "FINISHED_WITH_RETURN",
    )

    cistern_deposit = find(
        CISTERN,
        lambda tx, c: "deposit" in c and tx["executionResult"] == "FINISHED_WITH_RETURN",
    )
    cistern_accrue = find(CISTERN, lambda tx, c: "accrue_yield" in c)
    cistern_blocked = [
        tx for tx in rows(CISTERN)
        if "deposit" in readable(tx.get("calldata") or "")
        and tx["executionResult"] != "FINISHED_WITH_RETURN"
    ]
    fixed_refused = find(FIXED, lambda tx, c: "accrue_yield" in c)

    claims = {claim["index"]: claim for claim in observed["claims"]}

    def claim_where(key: str, methods: list, verdict: str):
        """Select a claim by what it actually read, never by verdict ordering.

        The claim list grows: the adversarial campaign appends further EXPLOIT
        and INDETERMINATE verdicts against other keys. Picking "the first
        EXPLOIT" would silently start resolving to a different claim.
        """
        for claim in observed["claims"]:
            if claim["key"] != key or claim["verdict"] != verdict:
                continue
            reading = json.loads(claim["pinnedReading"] or "{}")
            if reading.get("methods") == methods:
                return claim["index"]
        return None

    true_index = claim_where("cistern-demo", ["vault_report"], "EXPLOIT")
    false_index = claim_where(
        "cistern-demo",
        ["total_deposited_units", "total_claimable_units", "published_invariant"],
        "CLEAR",
    )
    indeterminate_index = claim_where(
        "cistern-fixed-control", ["published_invariant"], "INDETERMINATE"
    )

    # Every key in the live registry, not a hardcoded three. The sandbox and
    # campaign keys were registered by later tooling, and without this their
    # "bound by" column renders "not recorded" even though the transaction is on
    # chain and recoverable.
    registrations = {}
    for row in observed["registry"]["targets"]:
        key = row["key"]
        tx = registration_for(key, row["target"])
        registrations[key] = {
            "target": row["target"],
            "statusNow": row["status"],
            "tx": record(tx) if tx else None,
        }

    deployment = {
        "network": {"name": "Studio Next", "chainId": 61997},
        "assembledAtUtc": now(),
        "note": (
            "Addresses and transaction hashes recovered from Studio Next through "
            "sim_getTransactionsForAddress, and contract state read live. Nothing "
            "here is replayed from a local log."
        ),
        "stanch": {**record(stanch_deploy), "address": STANCH,
                   "addressExplorer": explorer_address(STANCH)},
        "cistern": {**record(cistern_deploy), "address": CISTERN,
                    "addressExplorer": explorer_address(CISTERN)},
        "cistern_fixed": {**record(fixed_deploy), "address": FIXED,
                          "addressExplorer": explorer_address(FIXED)},
        "injection_target": {
            **(record(injection_deploy) if injection_deploy else {}),
            "address": INJECTION,
            "addressExplorer": explorer_address(INJECTION),
        },
        "registrations": registrations,
        "gates": {},
    }

    gates = deployment["gates"]

    gates["G2"] = {
        "gate": "G2",
        "statusOf": observed["targets"]["cistern-demo"]["status"],
        "statusAtRegistration": "RUNNING",
        "unregisteredKeyReads": observed["unregisteredKeyReads"],
        "registrationTx": record(reg_demo),
        "observedAtUtc": observed["observedAtUtc"],
        "pass": observed["unregisteredKeyReads"] == "UNKNOWN",
    }

    if claim_false and false_index is not None:
        gates["G5"] = {
            "gate": "G5",
            "intent": "prose asserts an active drain; the pinned reading shows a healthy invariant",
            "tx": record(claim_false),
            "claim": json.dumps(claims[false_index]),
            "verdict": claims[false_index]["verdict"],
            "pattern": claims[false_index]["pattern"],
            "pinnedReading": claims[false_index]["pinnedReading"],
            "statusAfter": claims[false_index]["statusAfter"],
            "observedAtUtc": observed["observedAtUtc"],
            "pass": claims[false_index]["verdict"] == "CLEAR"
            and claims[false_index]["statusAfter"] == "RUNNING",
        }

    if claim_true and true_index is not None:
        gates["G3"] = {
            "gate": "G3",
            "tx": record(claim_true),
            "claim": json.dumps(claims[true_index]),
            "verdict": claims[true_index]["verdict"],
            "pattern": claims[true_index]["pattern"],
            "pinnedReading": claims[true_index]["pinnedReading"],
            "statusAfter": claims[true_index]["statusAfter"],
            "statusNow": observed["targets"]["cistern-demo"]["status"],
            "exploitTx": record(cistern_accrue) if cistern_accrue else None,
            "seedTx": record(cistern_deposit) if cistern_deposit else None,
            "observedAtUtc": observed["observedAtUtc"],
            "pass": claims[true_index]["verdict"] == "EXPLOIT"
            and observed["targets"]["cistern-demo"]["status"] == "HALTED",
        }

    gates["G4"] = {
        "gate": "G4",
        "statusSeenByTarget": observed["cistern"]["statusAsCisternReadsIt"],
        "blockedWrites": [record(tx) for tx in cistern_blocked],
        "revertReason": observed["cistern"]["writeAttemptAfterHalt"].get("leaderPayload"),
        "vaultReportAfter": json.dumps(observed["cistern"]["vaultReport"]),
        "observedAtUtc": observed["observedAtUtc"],
        "pass": observed["cistern"]["statusAsCisternReadsIt"] == "HALTED"
        and observed["cistern"]["writeReverted"] is True,
    }

    if claim_insufficient and indeterminate_index is not None:
        claim = claims[indeterminate_index]
        gates["G6"] = {
            "gate": "G6",
            "intent": (
                "the reading is gathered successfully but contains no value that "
                "could decide the asserted condition either way"
            ),
            "tx": record(claim_insufficient),
            "claim": json.dumps(claim),
            "verdict": claim["verdict"],
            "pattern": claim["pattern"],
            "pinnedReading": claim["pinnedReading"],
            "statusAfter": claim["statusAfter"],
            "statusNow": observed["targets"][claim["key"]]["status"],
            "decidedByClassifier": claim["note"] == "",
            "note": (
                "The note is empty, so this INDETERMINATE came from the classifier "
                "under the standard, not from the deterministic _reading_defect "
                "guard. The reading was gathered cleanly: published_invariant "
                "returned the invariant sentence and nothing failed. It simply "
                "contains no number that could settle whether the invariant holds."
            ),
            "history": (
                "This gate was blocked for part of the build by the Studio Next "
                "outage in DECISIONS.md D-010. The transaction recorded here was "
                "submitted during that outage, sat in processing for over 500 "
                "seconds, and finalized once the network recovered. See the D-010 "
                "addendum."
            ),
            "observedAtUtc": observed["observedAtUtc"],
            "pass": claim["verdict"] == "INDETERMINATE"
            and observed["targets"][claim["key"]]["status"] == "RUNNING",
        }
    else:
        gates["G6"] = {
            "gate": "G6",
            "pass": None,
            "blocked": True,
            "reason": "No INDETERMINATE claim is recorded on chain. See DECISIONS.md D-010.",
            "observedAtUtc": now(),
        }

    unreadable = {
        "intent": "reading spec names a method the target does not expose",
        "tx": record(claim_unreadable) if claim_unreadable else None,
        "claimCountNow": observed["claimCount"],
        "statusAfter": observed["targets"]["cistern-demo"]["status"],
        "reverted": claim_unreadable["executionResult"] != "FINISHED_WITH_RETURN"
        if claim_unreadable else None,
        "note": (
            "The claim transaction reverts with exit_code 1 rather than producing a "
            "verdict: calling a method the callee does not expose aborts the GenVM run. "
            "Nothing is recorded and nothing is halted."
        ),
        "observedAtUtc": observed["observedAtUtc"],
    }

    control = {
        "target": FIXED,
        "key": "cistern-fixed-control",
        "accrueTx": record(fixed_refused) if fixed_refused else None,
        "refused": fixed_refused["executionResult"] != "FINISHED_WITH_RETURN"
        if fixed_refused else None,
        "refusalReason": decode_payload(fixed_refused.get("leaderPayload"))
        if fixed_refused else None,
        "vaultReport": json.dumps(observed["cisternFixed"]["vaultReport"]),
        "statusAfter": observed["cisternFixed"]["statusInStanch"],
        "observedAtUtc": observed["observedAtUtc"],
    }

    deployment["control"] = control
    deployment["unreadableMethod"] = unreadable
    deployment["updatedAtUtc"] = now()

    (STUDIO / "deployment.json").write_text(json.dumps(deployment, indent=2) + "\n")
    for name, payload in (
        ("g2-registered-running.json", gates["G2"]),
        ("g3-true-halt.json", gates.get("G3")),
        ("g4-halted-revert.json", gates["G4"]),
        ("g5-false-claim.json", gates.get("G5")),
        ("g6-indeterminate.json", gates["G6"]),
        ("unreadable-method-reverts.json", unreadable),
        ("control-fixed-target.json", control),
    ):
        if payload is not None:
            (STUDIO / name).write_text(json.dumps(payload, indent=2) + "\n")

    print("assembled. gates:", {k: v.get("pass") for k, v in gates.items()})
    print("control refused:", control["refused"], control["refusalReason"])
    print("unreadable reverted:", unreadable["reverted"])


if __name__ == "__main__":
    main()
