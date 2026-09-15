# DECISIONS

Every entry records what was believed, what was observed, and what changed as a
result. Observations are pasted, not summarised. Where this file contradicts
`STANCH_PRD.md`, this file is the evidence and the PRD has been corrected in
place, per PRD §0.2.

Network for every observation below: **Studio Next**, chain `61997`, RPC
`https://studio-next.genlayer.com/api`.

---

## D-001 — The Python toolchain in the PRD does not address Studio Next

**Believed.** PRD §8 pins `genlayer-js@2.0.0-rc.1` and `@genlayer/transaction-kit@0.1.0-rc.2`
for the frontend and names `gltest` for the contract tests, without pinning a
Python SDK.

**Observed.**

- There is no `gltest` distribution on PyPI. The GenLayer Testing Suite ships as
  `genlayer-test`, which installs the `gltest` console script.
- `genlayer-test==0.29.2`, the highest non-prerelease, pins `genlayer-py<0.17.0`.
  `genlayer-py` at that range has no chain entry for chain `61997` and builds its
  `addTransaction` call with the pre-fee positional ABI. Deploying through it
  produced an EVM receipt with `status: 0`, `gasUsed: 0`, and a replay that reads:

  ```
  eth_call failed (code=-32001): Contract 0xb7278a61aa25c888815afc32ad3cc52ff24fe575 not found
  ```

- `genlayer-py==0.19.0rc2` carries `studio_devnet` (id `61997`), an
  `is_studio_chain` code path and the fee-aware `addTransaction`. Its matching
  test-suite release is `genlayer-test==0.30.0rc2`, which pins
  `genlayer-py>=0.19.0rc2,<0.20.0`.

**Decided.** Pin `genlayer-py==0.19.0rc2` and `genlayer-test==0.30.0rc2`. Both are
prereleases and both are pinned exactly, per PRD §8. `requirements.txt` records
the pair.

**Consequence.** `genlayer_py.chains.studio_devnet` points at
`https://studio-dev.genlayer.com/api`. Studio Next is the same chain id on a
different host, so `tools/studio_next.py` copies the chain and overrides the RPC
URL rather than inventing a chain definition.

---

## D-002 — Transactions on Studio Next are refused without a fee distribution

**Believed.** Nothing in the PRD mentions transaction fees.

**Observed.** A deploy built without one reverts at the EVM layer:

```
Transaction reverted: EVM tx 0x600c389bbed1a11f15f7ae91e8acb9d1bce04e905ada21a43f684bf821cdfa15
to consensus contract 0xb7278A61aa25c888815aFC32Ad3cC52fF24fE575 was reverted.
FeesDistributionMissing
```

`gl.get_current_fee_policy()` on Studio Next returns:

```json
{"enabled": true, "genPerTimeUnit": 1, "storageUnitPrice": 250000000,
 "receiptGasPrice": 250000000, "executionBudgetFloor": 76548000000000,
 "timeUnitOverlayBps": 1500}
```

`gl.estimate_transaction_fees()` resolves a `feeValue` of `100000000000010352`
wei, about `0.1 GEN` per transaction.

**Decided.** Every write in `tools/` passes `fees=gl.estimate_transaction_fees()`.
Accounts are funded through `sim_fundAccount`, which Studio Next exposes.

---

## D-003 — The SDK surface in the PRD is not the surface the chain runs

**Believed.** PRD §10 and the probe sources were written against
`from genlayer import *`, `gl.Contract`, `gl.get_contract_at(addr).view()`,
`gl.deploy_contract`, bare `u256`, `TreeMap`, `DynArray` and `on="accepted"`.

**Observed.** The runner was introspected directly on Studio Next by deploying a
module that raises with the contents of `dir(gl)` and reading the traceback back
out of `gen_getContractSchemaForCode`. `tools/introspect.py` reproduces this. The
real surface:

| PRD symbol | Actual symbol on Studio Next |
|---|---|
| `from genlayer import *` | `import genlayer as gl` |
| `gl.Contract` | `gl.contract.Contract` |
| `gl.get_contract_at(addr)` | `gl.contract.get_at(addr)` |
| `gl.deploy_contract(...)` | `gl.contract.deploy(...)` |
| `gl.evm.contract_interface` | `gl.contract.interface` |
| `TreeMap` / `DynArray` | `gl.storage.TreeMap` / `gl.storage.DynArray` |
| `u256` | `gl.u256` |
| `on="accepted"` | `on="decided"` |

Confirmed present and unchanged: `gl.eq_principle.strict_eq`,
`gl.eq_principle.prompt_non_comparative`, `gl.eq_principle.prompt_comparative`,
`gl.vm.UserError`, `gl.public.view`, `gl.public.write`, `gl.public.write.payable`,
`gl.message.sender_address`, `gl.storage.copy_to_memory`.

The proxy returned by `gl.contract.get_at` exposes exactly
`address`, `balance`, `emit`, `emit_transfer`, `view`.

**Also observed, and it simplifies CISTERN.** `gl.message.contract_address`
exists. PRD §10 says: *"CISTERN does not need to know its own address, which
avoids depending on a self-address accessor this document cannot confirm exists.
If the probe confirms one, record it in DECISIONS.md and simplify."* It is
confirmed. A contract reads its own balance as
`gl.contract.get_at(gl.message.contract_address).balance`, which is how negative
claim N3 is observed from inside the contract rather than only from outside.

**Decided.** The PRD's §10 snippet is wrong and is corrected in place. No symbol
is used anywhere in `contracts/` that was not observed in this introspection.

---

## D-004 — A prose comment under the `Depends` line makes a contract unloadable

**Believed.** PROBE.md assumed the only risk in the header was the hash itself.

**Observed.** Two facts, in order.

First, the hash. Both candidate hashes fail on Studio Next:

| Hash | Source | Result |
|---|---|---|
| `1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6` | upstream issue #20, chain 4221 | `invalid_contract runner malformed` |
| `9b8kjyda2ycxyq4ea6g4yfpnydxhd52gqba5rb8dw7krkh5mn9p0` | `contracts/football_bets.py`, v2-dev boilerplate | `invalid_contract runner malformed` |

`py-genlayer:latest` loads, and the GenVM log records what it resolved to:

```
"message": "resolving :test/:latest runner", "runner_id": "py-genlayer", "tag": "latest"
"message": "runner load", "runner": "py-genlayer:5jycge4q8k23462jtb0b9fyey1s9qz928sz2nbrd9mg4sxqg2qng"
```

That resolved hash was then confirmed to deploy successfully on its own, so it is
pinned rather than left as a floating tag, per PRD §8.

Second, and this one cost more time than the hash did. With the correct hash in
place, `probes/probe_target.py` *still* failed with `invalid_contract runner
malformed`, while a minimal contract carrying the identical header succeeded.
Bisecting the file line by line isolated it:

```
0 OK  '(none)'
1 OK  '#'
2 ERR '# PROBE TARGET — adapted from genlayerlabs/genvm-manager issue #20.'
```

GenVM treats the **contiguous block of leading comment lines** as its runner
header and requires every line in that block to parse as a JSON directive. A bare
`#` is skipped; a line of prose is a malformed directive and kills the whole
contract. A single blank line terminates the header block, after which ordinary
comments are fine.

**Decided.** Every contract and probe in this repository puts one blank line
directly beneath its `Depends` line. The failure mode is worth stating plainly
because the error text names the runner and says nothing about comments.

---

## D-005 — The frontend follows the Base Club brutalist system, not a calm dark one

**Believed.** PRD §21 specified a dark, calm surface with one accent, and forbade
green anywhere near a verdict on the grounds that green reads as an all-clear.

**Changed.** §21 was deleted from the PRD by its author, who directed that the
frontend use the Base Club / SocialFi brutalist system in `docs/brand/frontend.txt`
and that the verdict-colour rule no longer applies. §28 carried a dangling
bullet, *"No green renders next to any verdict"*, which referred only to the
deleted section; it has been removed under the PRD's own correction clause. The
adjacent §28 requirement that `INDETERMINATE` and `UNKNOWN` render as outcomes
distinct from a pass and a fail is independent of colour and still holds.

**Decided.** The interface is built to `docs/brand/frontend.txt` v2.5.0: electric
blue `#0038FF` ground, volt lime `#CCFF00` accent, deep abyss `#001A99`
extrusion, pure black outlines with hard offset shadows, frost-glass cards,
Arial Black display type over Inter and JetBrains Mono.

Verdict states are separated by **shape and weight** rather than by hue, so the
three-way distinction survives in a two-colour system:

| State | Treatment |
|---|---|
| `HALTED` / `EXPLOIT` | solid black pill, volt lime type, hard shadow. The loudest object on the page. |
| `RUNNING` / `CLEAR` | solid white pill, black type, thin black edge. |
| `INDETERMINATE` / `UNKNOWN` | frost glass, dashed edge, no fill. Reads as neither. |

Monospace with `tabular-nums` is kept for every address, hash and count, because
that was a legibility rule rather than a colour rule.

## D-006 — The §11 gate resolved: P3 passes, and the upstream defect only half reproduces

**Run.** `tools/run_probes.py` against Studio Next. Raw output in `probes/results.json`.

| Probe | Question | Result |
|---|---|---|
| **P3** | contract-to-contract synchronous `view()`, in a view and in a write | **PASS** |
| **P2** | `emit(on=...).method()` reaches the callee | **PASS** |
| **P1** | `gl.contract.deploy` from inside a contract yields a reachable contract | **PASS** |
| **P4** | `emit_transfer` moves value out | **FAIL** |
| **P5** | upgraders empty, upgrade refused | **PARTIAL** |

**P3, the load-bearing one, passes.** `p3_sync_view_in_view` returned `RUNNING`
with no transaction, and `p3_sync_view_in_write` wrote
`READ_OK word=RUNNING` from inside a write transaction. The architecture in §10
is buildable as specified. R1 is unblocked.

**Two probes had to be re-run before their results were honest.** Both first
runs produced false failures caused by this repository, not by the chain:

1. P1, P2 and P4 all failed initially with `fee no_matching_allocation # internal`.
   That is a fee error: every message a contract emits needs its own allocation in
   the transaction's fee distribution. `tools/deploy.py` now derives fees per call
   through `estimate_transaction_fees_for_write`, which simulates the concrete call
   on Studio and returns the allocations. Recording that first run as an upstream
   defect would have been wrong.
2. P1 then failed a second time because the probe read the spawned contract
   immediately. The deploy message is emitted `on="finalized"`; polling shows it
   becomes reachable after about 20 seconds. `reachabilityAttempts` in
   `results.json` records the one failed read and the delay.

**P2 passes, so §11's branch applies:** *"Do not switch to the push model. Record
that the pull model was chosen even though push works."* It is recorded here. The
pull architecture is a deliberate choice, not a workaround. It is what produces
negative claim N2: STANCH holding no write path is only meaningful because a
write path was available and declined.

**P4 fails, and it is the dangerous asymmetry from issue #20, on Studio Next.**
Value paid in arrived: the governor's balance went `0` → `1000000000000000000`.
`p4_pay_out` then finished with `FINISHED_WITH_RETURN`, and the contract's own log
records the payout:

```
"P4 TOOK 1000000000000000000",
"P4 PAID 0x11DDE75553F54aE146B9e1FECf319da7b819Eb45 500000000000000000"
```

The governor's balance after that call, and again ninety seconds later, is
`1000000000000000000`. Unchanged. Anything escrowed in a contract on Studio Next is
stranded while the contract's bookkeeping records it as paid out.

This narrows the upstream report rather than confirming it. On chain 4221 every
asynchronous message was reported as dropped. On Studio Next, internal calls and
contract-initiated deploys execute; only the value transfer does not. §16's
no-custody non-goal now rests on our own observation instead of someone else's
issue.

**P5 is partial and stays partial.** No JSON-RPC method on Studio Next returns the
root slot: `gen_getContractState`, `sim_getContractState`, `gen_getUpgraders` and
`gen_dbg_getContractState` all return `Method not found`. The upgraders list is
read from inside the VM instead, through `gl.storage.Root.get()`, exposed as
`Stanch.root_report()`. A freshly deployed STANCH reports:

```json
{"code_slot": "0", "locked_slots_count": 4, "permissions": "0",
 "upgraders": [], "upgraders_count": 0}
```

Empty upgraders, four locked slots, matching the documented `lock_default()`.

The second half of N5 could not be measured. Neither `genlayer-py 0.19.0rc2` nor
`genlayer-js 2.0.0-rc.1` exposes a code-upgrade path for Intelligent Contracts, so
there is no upgrade transaction to be refused. **N5 is therefore `PARTIAL`, not
`SUPPORTED`,** and its limitations say so. An immutability claim with half its
evidence missing is worse than no immutability claim.
