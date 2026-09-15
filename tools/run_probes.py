import json
import time
from datetime import datetime, timezone
from pathlib import Path

from tools.deploy import call, deploy, read, write_evidence
from tools.studio_next import RPC_URL, balance, client, explorer_address, fund

ROOT = Path(__file__).resolve().parent.parent
RESULTS = ROOT / "probes" / "results.json"

RUNNER = "py-genlayer:5jycge4q8k23462jtb0b9fyey1s9qz928sz2nbrd9mg4sxqg2qng"


def safe_state(gl, address: str) -> dict:
    try:
        return json.loads(read(gl, address, "state"))
    except Exception as exc:
        return {"error": str(exc)[:600]}


def now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def main() -> None:
    gl = client()
    deployer = gl.local_account.address
    if balance(gl, deployer) < 10 * 10**18:
        fund(gl, deployer, 500 * 10**18)

    out = {
        "schemaVersion": "stanch.probes/1",
        "network": {"name": "Studio Next", "chainId": 61997, "rpc": RPC_URL},
        "runner": RUNNER,
        "deployer": deployer,
        "startedAtUtc": now(),
        "probes": {},
        "deployments": {},
    }

    target = deploy(gl, ROOT / "probes" / "probe_target.py", args=["p3"])
    out["deployments"]["probe_target"] = target
    print("probe_target:", target["address"], target["executionResult"])

    governor = deploy(gl, ROOT / "probes" / "probe_governor.py")
    out["deployments"]["probe_governor"] = governor
    print("probe_governor:", governor["address"], governor["executionResult"])

    t_addr = target["address"]
    g_addr = governor["address"]

    # ---- P3b: sync cross-contract view, inside a view. No gas, run first.
    p3b = {"question": "gl.contract.get_at(addr).view().m() inside a view"}
    try:
        p3b["returned"] = read(gl, g_addr, "p3_sync_view_in_view", [t_addr])
        p3b["pass"] = p3b["returned"] == "RUNNING"
    except Exception as exc:
        p3b["error"] = str(exc)[:2000]
        p3b["pass"] = False
    print("P3b:", p3b)

    # ---- P3a: the same read inside a write transaction. CISTERN's guard clause.
    p3a = {"question": "gl.contract.get_at(addr).view().m() inside a write"}
    try:
        p3a["tx"] = call(gl, g_addr, "p3_sync_view_in_write", [t_addr])
        state = safe_state(gl, g_addr)
        p3a["governorState"] = state
        p3a["pass"] = state.get("p3_write_result") == "READ_OK word=RUNNING"
    except Exception as exc:
        p3a["error"] = str(exc)[:2000]
        p3a["pass"] = False
    print("P3a:", p3a.get("pass"), p3a.get("governorState", {}).get("p3_write_result"))

    out["probes"]["P3"] = {
        "id": "P3",
        "loadBearing": True,
        "P3b_view": p3b,
        "P3a_write": p3a,
        "pass": bool(p3b.get("pass") and p3a.get("pass")),
    }

    # ---- P2: asynchronous emitted write.
    p2 = {"question": "gl.contract.get_at(addr).emit(on=...).method() reaches the callee"}
    before = safe_state(gl, t_addr)
    p2["targetBefore"] = before
    try:
        p2["tx"] = call(gl, g_addr, "p2_async_call", [t_addr, "p2 probe"])
    except Exception as exc:
        p2["error"] = str(exc)[:2000]
    time.sleep(45)
    after = safe_state(gl, t_addr)
    p2["targetAfter"] = after
    p2["waitedSeconds"] = 45
    p2["pass"] = int(after.get("async_calls", "0") or 0) > int(before.get("async_calls", "0") or 0)
    out["probes"]["P2"] = p2
    print("P2:", p2["pass"], before.get("async_calls"), "->", after.get("async_calls"))

    # ---- P1: contract-initiated deployment.
    p1 = {"question": "gl.contract.deploy from inside a contract yields a reachable contract"}
    try:
        child_source = (ROOT / "probes" / "probe_target.py").read_text()
        p1["setCodeTx"] = call(gl, g_addr, "set_child_code", [child_source])
        p1["spawnTx"] = call(gl, g_addr, "p1_spawn", ["p1", "7"])
        state = safe_state(gl, g_addr)
        spawned = state.get("p1_spawned_address", "")
        p1["spawnedAddress"] = spawned
        if spawned and spawned != "None":
            attempts = []
            for attempt in range(10):
                try:
                    p1["spawnedState"] = read(gl, spawned, "state")
                    p1["pass"] = True
                    p1["reachableAfterSeconds"] = attempt * 20
                    break
                except Exception as exc:
                    attempts.append({"afterSeconds": attempt * 20, "error": str(exc)[:200]})
                    p1["pass"] = False
                    time.sleep(20)
            p1["reachabilityAttempts"] = attempts
        else:
            p1["pass"] = False
    except Exception as exc:
        p1["error"] = str(exc)[:2000]
        p1["pass"] = False
    out["probes"]["P1"] = p1
    print("P1:", p1.get("pass"), p1.get("spawnedAddress"))

    # ---- P4: value out.
    p4 = {"question": "emit_transfer moves value out of a contract"}
    try:
        p4["governorBalanceBefore"] = str(balance(gl, g_addr))
        p4["recipientBalanceBefore"] = str(balance(gl, deployer))
        p4["takeTx"] = call(gl, g_addr, "p4_take", [], value=10**18)
        p4["governorBalanceAfterTake"] = str(balance(gl, g_addr))
        p4["payInWorked"] = int(p4["governorBalanceAfterTake"]) > int(p4["governorBalanceBefore"])
        p4["payOutTx"] = call(gl, g_addr, "p4_pay_out", [deployer, str(5 * 10**17)])
        p4["governorBalanceAfterPay"] = str(balance(gl, g_addr))
        p4["recipientBalanceAfter"] = str(balance(gl, deployer))
        time.sleep(90)
        p4["governorBalanceAfter90s"] = str(balance(gl, g_addr))
        p4["recipientBalanceAfter90s"] = str(balance(gl, deployer))
        p4["governorLog"] = json.loads(read(gl, g_addr, "state")).get("log")
        p4["pass"] = int(p4["governorBalanceAfter90s"]) < int(p4["governorBalanceAfterTake"])
        p4["bookkeepingRecordedPayout"] = any(
            str(line).startswith("P4 PAID") for line in (p4.get("governorLog") or [])
        )
    except Exception as exc:
        p4["error"] = str(exc)[:2000]
        p4["pass"] = False
    out["probes"]["P4"] = p4
    print("P4:", p4.get("pass"))

    # ---- P5: upgraders list and freeze.
    p5 = {
        "question": "upgraders list is empty after a plain deploy and upgrade is refused",
        "rpcAccessorsTried": {},
    }
    for method in (
        "gen_getContractState",
        "sim_getContractState",
        "gen_getUpgraders",
        "gen_dbg_getContractState",
    ):
        try:
            gl.provider.make_request(method, [t_addr])
            p5["rpcAccessorsTried"][method] = "OK"
        except Exception as exc:
            p5["rpcAccessorsTried"][method] = str(exc)[:200]
    p5["accessorUsed"] = "in-VM gl.storage.Root.get(), exposed as Stanch.root_report()"
    p5["accessorNote"] = (
        "No JSON-RPC method on Studio Next returns the root slot. The upgraders "
        "list is read from inside the VM instead, which is a stronger observation "
        "than an RPC accessor because it is the same storage GenVM itself reads "
        "at the start of a write transaction."
    )
    stanch_probe = deploy(gl, ROOT / "contracts" / "stanch.py")
    p5["stanchProbeDeploy"] = stanch_probe
    p5["rootReport"] = read(gl, stanch_probe["address"], "root_report")
    parsed_root = json.loads(p5["rootReport"])
    p5["upgradersEmpty"] = int(parsed_root.get("upgraders_count", -1)) == 0
    p5["lockedSlotsCount"] = parsed_root.get("locked_slots_count")
    p5["upgradeAttempt"] = "NOT_ATTEMPTED"
    p5["upgradeAttemptReason"] = (
        "Neither genlayer-py 0.19.0rc2 nor genlayer-js 2.0.0-rc.1 exposes a code "
        "upgrade path for Intelligent Contracts, so no upgrade transaction could "
        "be constructed to be refused. The second half of N5 is therefore "
        "unmeasured and N5 stays PARTIAL."
    )
    p5["pass"] = None
    out["probes"]["P5"] = p5
    print("P5: upgraders empty =", p5["upgradersEmpty"], "| locked slots =", p5["lockedSlotsCount"])

    out["finishedAtUtc"] = now()
    out["explorer"] = {
        "probe_target": explorer_address(t_addr),
        "probe_governor": explorer_address(g_addr),
    }
    RESULTS.write_text(json.dumps(out, indent=2, default=str) + "\n")
    write_evidence("probe-run.json", out)
    print("\nwritten:", RESULTS)


if __name__ == "__main__":
    main()
