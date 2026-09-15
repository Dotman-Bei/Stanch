# STANCH Feasibility Probe

**Run this before writing any STANCH code. It is gate G0.**

Target: **Studio Next**, chain ID `61997`, RPC `https://studio-next.genlayer.com/api`, explorer `https://explorer-studio-dev.genlayer.com/`.

The probe answers five questions. One of them, **P3**, decides whether STANCH is buildable at all. Run P3 first. If it fails, stop and read `STANCH_PRD.md` §17, K1, before doing anything else.

---

## Before you start

**Verify the `Depends` line.** Both probe contracts open with:

```
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
```

That hash came from a bug report filed against chain 4221, not against Studio Next. If Studio Next rejects it, take the `Depends` line from the `v2-dev` branch of `genlayerlabs/genlayer-project-boilerplate` and record the substitution as D-002 in `DECISIONS.md`. Do not guess a hash and do not delete the line.

**Record everything, including passes.** A probe that passes is evidence too, and `P2` passing changes what you write in the README even though it changes nothing in the architecture.

---

## P3 — contract-to-contract synchronous view

**The question.** Can one Intelligent Contract read another synchronously through `gl.get_contract_at(addr).view()`, inside a write transaction and inside a view?

**Why it decides everything.** CISTERN's guard clause is exactly this call. If it does not work, STANCH cannot be enforced by the target, and the only alternatives reintroduce a trusted off-chain operator, which is the thing the product exists to remove.

**What is already known.** Upstream issue `genlayerlabs/genvm-manager#20` reports that synchronous operations are healthy on chain 4221 while every asynchronous emitted message is silently dropped. But the synchronous reads it exercised were EOA-to-contract. Contract-to-contract synchronous view is not covered by that report in either direction.

### Steps

1. Deploy `probe_target.py` from your EOA with `label = "p3"`. Record the address.
2. Deploy `probe_governor.py` from your EOA. Record the address.
3. **P3b first**, because it costs nothing: call the governor's `p3_sync_view_in_view(target_address)` as a read. No transaction, no gas.
   - Returns `RUNNING` → the read path works.
   - RPC error → capture the full error text verbatim.
4. **P3a**: send `p3_sync_view_in_write(target_address)` as a transaction.
5. Read the governor's `state()`.
   - `p3_write_result` is `READ_OK word=RUNNING` → **P3 passes. Build STANCH.**
   - `p3_write_result` is empty → **open the transaction receipt.** A revert means the call is unsupported inside a write context. A missing transaction means something else went wrong; retry before concluding.

### Branch

| Result | Action |
|---|---|
| P3a and P3b both pass | Promote `P3-SYNC-CROSS-CONTRACT-VIEW` in `claims.json` to `SUPPORTED`, evidence class `studio_next_observation`. Proceed to R1. |
| P3b passes, P3a reverts | The guard clause cannot live in a write path. Narrow the claim to what is true and reconsider the enforcement point before building. Do not proceed to R1. |
| Both fail | K1. STANCH as specified is falsified on Studio Next. Do not substitute an off-chain relayer. Fall back to the single-contract build in K1 and say publicly that cross-contract enforcement was blocked upstream. |

---

## P2 — asynchronous emitted write

**The question.** Does `gl.get_contract_at(addr).emit(on=...).method()` reach the callee on Studio Next?

**What is already known.** On chain 4221 the parent transaction reaches FINALIZED with the message correctly formed and recorded, and the callee is never called. `on="accepted"` and `on="finalized"` behave identically.

### Steps

1. Note the target's `async_calls` before you start. It should be `0`.
2. Send `p2_async_call(target_address, "p2 probe")` from the governor.
3. Confirm the transaction finalized. **This proves nothing yet.**
4. Read the target's `state()`.
   - `async_calls` is `1` and `last_caller` is the governor address → P2 passes.
   - `async_calls` is still `0` → the message was recorded and never consumed. Wait 30 minutes and read again before recording a failure; the original report confirmed the callee was still untouched after 30 minutes.

### Branch

| Result | Action |
|---|---|
| Passes | **Do not switch to the push model.** Record in `DECISIONS.md` that the pull model was chosen deliberately, because it is what produces negative claim N2. A reviewer must see it was a decision and not a workaround. |
| Fails | Publish it. Add a Studio Next reproduction to upstream issue #20 with your transaction hashes, link it from the README, and record the maintainer's response including silence. This is a submission asset, not a setback. |

---

## P1 — contract-initiated deployment

**The question.** Does `gl.deploy_contract` from inside a contract produce a contract that actually exists?

Not needed by STANCH v1. Run it because it is two calls and it establishes whether the async message path is broken generally or only for writes.

### Steps

1. `set_child_code(<the full source text of probe_target.py>)` on the governor.
2. `p1_spawn("p1", "1")`.
3. Read the governor's `state()` and take `p1_spawned_address`.
4. **Read `state()` at that address.** An address being returned is not the test. Reachability is.
   - State returns → P1 passes.
   - `contract not found at address ...` → P1 fails, matching the upstream report.

---

## P4 — value out

**The question.** Does `emit_transfer` move value out of a contract?

STANCH assumes this fails and takes no custody of value. Run it to confirm the assumption is load-bearing rather than superstitious.

### Steps

1. Record the governor's and a recipient EOA's balances.
2. Send value to the governor through `p4_take()`.
3. Confirm the governor's balance increased. Paying **in** was reported healthy.
4. Call `p4_pay_out(recipient, <part of it>)`.
5. Read both balances again.
   - Both unchanged while the governor's log records `P4 PAID` → the dangerous asymmetry is present on Studio Next. Anything escrowed would be stranded while the contract's own bookkeeping records the payout as done.

### Branch

| Result | Action |
|---|---|
| Fails | Nothing changes. `BOND-SLASHING` stays `NOT_CLAIMED` and §16 now cites your own observation rather than someone else's issue. |
| Passes | Bonds become possible. **Still do not add them.** They are breadth, the window is under 48 hours, and no-custody is itself a claim. Record the option in `DECISIONS.md` as rejected-for-scope. |

---

## P5 — upgraders and the freeze

**The question.** After a plain deployment with no upgrader configured, is the upgraders list empty, and does an upgrade attempt fail?

**What is already known from documentation.** Upgradability is built around the Root Slot, which stores an upgraders list. At the start of a write transaction GenVM reads that list; a sender in it can modify any slot, including code. After `__init__` completes the runtime automatically calls `root.lock_default()`, which locks the root slot, the code slot, the locked_slots slot and the upgraders slot. A contract with locked slots and no upgraders cannot be upgraded, and this is irreversible.

**This is documentation, not observation.** Negative claim N5 rests on it entirely, so it must be observed.

### Steps

1. Read the upgraders list on the deployed `probe_target`. **The accessor is not confirmed by this document.** Check `gen_getContractState`, then the installed `genlayer` package source. Record which accessor worked, in `DECISIONS.md`. Do not report a result from an API call you invented.
2. Attempt an upgrade: write a trivial `probe_target_v2.py` and call the upgrade path against the deployed address from your EOA.
3. Expect refusal.

### Branch

| Result | Action |
|---|---|
| Empty list, upgrade refused | N5 holds. Promote it once STANCH itself is deployed and the same two observations are repeated against STANCH's address, not the probe's. |
| List is populated, or the upgrade succeeds | **N5 is falsified as written.** Find the actual freeze path and narrow N5 to what is true, immediately, before it reaches the README. A false immutability claim is worse than no immutability claim. |

---

## Recording results

Copy `results.template.json` to `results.json` and fill it in by hand from observed output. Paste real transaction hashes and real error text. Do not summarise an error; paste it.

Then update `evidence/claims.json`:

- `P3-SYNC-CROSS-CONTRACT-VIEW` and `P2-ASYNC-EMIT-EXECUTION` get their status and evidence class
- `revision.baseCommit` gets the commit you probed at
- `updatedAtUtc` gets the real time

Commit as `evidence(probe): record studio next feasibility gate`.

**If a probe fails, the failure is committed with the same care as a pass.** The point of running this before building is that a falsified premise costs you two hours now instead of thirty later.
