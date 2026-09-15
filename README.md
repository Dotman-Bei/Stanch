# STANCH

> **STANCH is a halt authority that has no write access to anything it halts.**

It publishes a verdict. The target reads that verdict and stops itself.

GenLayer Agent Tank Hackathon · Track **Autonomous Protocols** · Network
**Studio Next**, chain `61997`.

---

## Stage disclaimer, before anything good is shown

This is a hackathon build on a test network with valueless tokens. **It is not an
audit and not a production safety system.** No mainnet deployment exists.

**STANCH is opt-in and pull-based. It cannot halt a contract that was not written
to read it.** That is a real limitation, and it is here above the fold rather
than in a footnote. A target that ignores the verdict is simply not protected.

STANCH can only halt on a condition **visible in the target's public view surface
at verdict time.** It cannot read historical state or transaction traces, and it
cannot halt an exploit that has already completed and left no trace. Halting
after the fact does nothing anyway; the track wording is *active* exploit.

---

## Gate status

<!-- GATE-STATUS -->

Recorded 2026-09-15T16:55:06Z against Studio Next, chain 61997.

| Gate | Condition | Status |
|---|---|---|
| G0 | Probes run on Studio Next, results committed, P3 resolved | **PASS** |
| G1 | STANCH deployed, address and deploy transaction recorded | **PASS** |
| G2 | CISTERN deployed, registered, status_of returns RUNNING | **PASS** |
| G3 | A true claim returns EXPLOIT and flips the status | **PASS** |
| G4 | A CISTERN write reverts with STANCH_HALTED after the flip | **PASS** |
| G5 | A false claim returns CLEAR, the target stays RUNNING | **PASS** |
| G6 | An insufficient claim returns INDETERMINATE | **PASS** |
| G7 | All five negative claims have committed evidence | **PASS** |
| G8 | Frontend serves registry, verdict record and proof room with no wallet | **PASS** |
| G9 | Demo video recorded, showing G3, G4 and G5 | **NOT YET RUN** |
| G10 | Clean-clone reproduction passes | **NOT YET RUN** |

G9 and G10 are not yet run. They are listed as NOT YET RUN rather than omitted.

### Deployed on Studio Next

| Contract | Address | Deploy transaction |
|---|---|---|
| STANCH | [`0xe3C5B525a413797F86a2742C9C5d1502045EBC24`](https://explorer-studio-dev.genlayer.com/address/0xe3C5B525a413797F86a2742C9C5d1502045EBC24) | [`0x10627da65e676666…`](https://explorer-studio-dev.genlayer.com/tx/0x10627da65e67666679ec7888ac971f73740eb70599b902212f22bf7ea31f5935) |
| CISTERN (demo target) | [`0x288aA7651e3260fA13B09bD86c7430FD52585f30`](https://explorer-studio-dev.genlayer.com/address/0x288aA7651e3260fA13B09bD86c7430FD52585f30) | [`0x44e1f34b7c384b6c…`](https://explorer-studio-dev.genlayer.com/tx/0x44e1f34b7c384b6c677e9da014428a2434ce382da8bcd977ea2a8aff7408ef2c) |
| CISTERN-FIXED (control) | [`0xCac4C9B43FC343b1D5003Bd400299e12b7db271b`](https://explorer-studio-dev.genlayer.com/address/0xCac4C9B43FC343b1D5003Bd400299e12b7db271b) | [`0x6e49958cd3e42f77…`](https://explorer-studio-dev.genlayer.com/tx/0x6e49958cd3e42f77f386f9b7bb415bb889e06535b0cc6be46e6a1b55f872a6a8) |
| Injection target (campaign) | [`0x84E5C85E5C7a44Ed3f3c950C39953A5d70257C60`](https://explorer-studio-dev.genlayer.com/address/0x84E5C85E5C7a44Ed3f3c950C39953A5d70257C60) | [`0x49fc1c69932c6da8…`](https://explorer-studio-dev.genlayer.com/tx/0x49fc1c69932c6da8090a1a7e5700561c7c8e7dc3a8c0ccd1739fbbf5fa21e327) |

- **G3**, the true claim that halted CISTERN: verdict `EXPLOIT`, target `HALTED` — [`0x2ef44c08e33b2960…`](https://explorer-studio-dev.genlayer.com/tx/0x2ef44c08e33b296020eadd50e29ef7ab722efe9fd048d49a5b997416d47f9241)
- **G5**, the false claim that was refused: verdict `CLEAR`, target `RUNNING` — [`0x872ca9b94fc91702…`](https://explorer-studio-dev.genlayer.com/tx/0x872ca9b94fc91702e30e23b1434c7943475fb8bb6c87108d1b95d34b1704de53)
- **G4**, the CISTERN write that reverted after the halt: reverted `STANCH_HALTED`, target `HALTED` — [`0x4b0e920d932e772b…`](https://explorer-studio-dev.genlayer.com/tx/0x4b0e920d932e772b0bddde893bf42fbc8d8f299ff7b1f0e27c370b50f31af8ed)
- **Not a gate, recorded anyway**: a reading spec naming a method the target does not expose reverts the claim transaction, records nothing and halts nothing — [`0x44c44bd9c195ae1b…`](https://explorer-studio-dev.genlayer.com/tx/0x44c44bd9c195ae1b0a2d8820e66b37d79dd09017099789306283c3dddb1cb1f6)
- **Control**: the same accrual against `cistern_fixed.py` is refused by the target itself with `NO_UNBACKED_HEADROOM`, so the invariant never breaks and no claim is possible — [`0xb6813ae03383f5c9…`](https://explorer-studio-dev.genlayer.com/tx/0xb6813ae03383f5c91602bbc67a695e09dc487c5a6074e2d01b561a0d9ec062f4)

<!-- /GATE-STATUS -->

---

## The claim

Every protocol with a pause guardian trusts a key that can pause, unpause, change
parameters and sometimes move funds, and trusts that key to be awake at 3am and
honest about why it pulled the lever.

STANCH replaces that key with a contract holding exactly one power: publish a
verdict that a registered target is compromised.

| Power a normal guardian holds | What STANCH holds |
|---|---|
| Pause | Publish a `HALTED` verdict |
| Unpause | Nothing. Halt is one-way. |
| Upgrade the target | Nothing |
| Change target parameters | Nothing |
| Move or hold funds | Nothing. STANCH never takes custody of value. |
| Decide privately, on any reason or none | A verdict re-derived by validators from the target's own public state, against a standard fixed in locked code |

**STANCH never calls CISTERN. CISTERN reads STANCH.** That inversion is the
product.

```
  claimant                STANCH (chain 61997)                 CISTERN (target)
     │                            │                                   │
     │ submit_claim(key, ─────────▶ 1. read the target's public       │
     │   reading_spec, pattern)   │    view surface, synchronously ───┤ (sync view)
     │                            │                                   │
     │                            │ 2. prompt_non_comparative:        │
     │                            │    validators independently       │
     │                            │    classify that pinned reading   │
     │                            │      EXPLOIT / CLEAR / INDETERMINATE
     │                            │                                   │
     │                            │ 3. on EXPLOIT: status_of(key)     │
     │                            │    flips RUNNING → HALTED         │
     │                            │    (irreversible)                 │
     │                            │                                   │
     │                            ◀─── 4. every write method reads ───┤
     │                            │      status_of() synchronously    │
     │                            │      and refuses if HALTED        │
```

---

## Five minutes, as a reviewer

| Time | What to do | What it establishes |
|---|---|---|
| 0:00–0:45 | Read the stage disclaimer and the gate status above | What is and is not claimed, before anything good is shown |
| 0:45–1:30 | Open the registry with no wallet. See CISTERN halted, with the transaction | The halt is real and on Studio Next |
| 1:30–2:30 | Open the verdict record for the true claim. Read the pinned reading, then the verdict | The verdict came from state, not from the claimant's prose |
| 2:30–3:30 | Open the verdict record for the **false** claim. Note `CLEAR`, target still `RUNNING` | The system declines to act |
| 3:30–4:15 | Run the greps in §1 of `REPRODUCE.md` against `contracts/stanch.py` | No write path to any target exists |
| 4:15–5:00 | Open `evidence/claims.json` and read the `limitations` on any claim | What the evidence does not reach |

The fastest check is the grep. It takes under a minute and it carries the
headline:

```bash
grep -nE '\.emit\(|emit_transfer|contract\.deploy|contract\.interface' contracts/stanch.py
# expect: no output
```

---

## The negative claims

These five are the product. Each names the evidence that would falsify it, and
each row in `evidence/claims.json` carries its own limitations.

| ID | Claim |
|---|---|
| **N1** | STANCH cannot resume a halted target. No method sets a status back to `RUNNING`, and no code path writes `RUNNING` after registration. |
| **N2** | STANCH has no write path to any target. `.emit(`, `emit_transfer`, `contract.deploy` and `contract.interface` appear nowhere in `contracts/stanch.py`. |
| **N3** | STANCH never takes custody of value. No `payable` method exists and it never reads `gl.message.value`. |
| **N4** | A claim whose pinned reading does not support the pattern returns `CLEAR` and does not halt the target. |
| **N5** | The classification standard cannot be changed by anyone, including the deployer. STANCH deploys with an empty upgraders list and four locked slots. |

**N4 is the one that makes the other four believable**, because it requires
demoing the system declining to act. Gate G5 is not optional here.

**N5 is `PARTIAL`, not `SUPPORTED`.** The upgraders list is observed empty on
Studio Next, read from inside the VM through `gl.storage.Root.get()`. The second
half — an upgrade attempt that is refused — could not be measured, because
neither `genlayer-py 0.19.0rc2` nor `genlayer-js 2.0.0-rc.1` exposes a code
upgrade path for Intelligent Contracts, so there is no transaction to be refused.
An immutability claim with half its evidence missing is worse than no
immutability claim.

---

## The adversarial campaign

Three attacks, each run on Studio Next, each recorded whether it succeeded or not.
Full payloads and transactions in `evidence/studio-next/campaign.json`.

| Attack | Expected | Observed | Succeeded |
|---|---|---|---|
| **Persuasive false claim.** Prose argues forcefully for an active drain; the pinned reading shows a healthy invariant. | `CLEAR` | `CLEAR`, target `RUNNING` | no |
| **Injection in the reading.** The target's own view surface returns text instructing the classifier to answer `EXPLOIT`. | `CLEAR` or `INDETERMINATE`, never `EXPLOIT` | `INDETERMINATE`, target `RUNNING` | no |
| **Registration squat.** A second party binds a key of their choosing to someone else's contract. | Refused, or harmless | **Accepted and haltable, and harmless** | no |

**The squat result needs stating precisely, because the headline is misleading.**
Anyone can register a new key pointing at anyone's contract, and anyone can then
halt *that key*. We did exactly that. The victim was unaffected:

```
squatted key      HALTED
victim's own key  RUNNING
victim reads      RUNNING          (it reads the key it was constructed with)
victim writes     still accepted
```

Rebinding an *already-bound* key is refused outright. So the registry is not a
claim of ownership and must not be read as one — a key in it says only that
someone bound that name to that address. Harmlessness rests entirely on the target
hard-coding its own key at construction. A target that let its key be changed
after deployment, or read one supplied by a caller, would be squattable in a way
this observation does not cover. That is in the ledger as a limitation, not here
as a footnote.

---

## The outage, and what it cost

Late in the build, Studio Next stopped deciding non-deterministic transactions.
Nine consecutive `submit_claim` transactions stalled in `processing` with zero
validator votes committed, while deterministic writes against the same contracts,
from the same account, in the same minutes, decided normally. The chain was up;
the path that calls a model was not moving.

G6 was recorded as **BLOCKED** for that period — not failed, because nothing had
been measured.

**It resolved, and the way it resolved is worth reading.** A probe transaction
sent during the outage was neither resubmitted nor abandoned. It finalized on its
own once the network recovered, and it carried the corrected G6 reading spec. Its
verdict is `INDETERMINATE`, with the target still `RUNNING` — so the re-probe *is*
the gate. See `DECISIONS.md` D-010 and its two addenda.

**Nothing about the outage is deleted now that it passed.** For an emergency-halt
product this is the most important limitation in the build, and it is not a bug in
STANCH: if the chain will not process the verdict transaction, the halt does not
happen. A guardian that waits on consensus is unavailable exactly when consensus
is, and removing the guardian's powers does nothing about it. It is a standing
caveat in `evidence/claims.json`.

---

## What we found on the chain, and published

The §11 feasibility gate ran before a line of contract code was written. Full
output in `probes/results.json`, reasoning in `DECISIONS.md`.

| Probe | Question | Result |
|---|---|---|
| **P3** | contract-to-contract synchronous `view()`, in a view and in a write | **PASS** — the architecture is buildable |
| **P2** | `emit(on=...).method()` reaches the callee | **PASS** |
| **P1** | `gl.contract.deploy` from inside a contract yields a reachable contract | **PASS** (reachable after ~20s) |
| **P4** | `emit_transfer` moves value out | **FAIL** |
| **P5** | upgraders empty, upgrade refused | **PARTIAL** |

**P4 is worth a reviewer's attention.** Value paid into a contract arrives. Value
paid out does not move, while the contract's own log records the payout as done:

```
"P4 TOOK 1000000000000000000",
"P4 PAID 0x11DD…Eb45 500000000000000000"
```

The balance after that call, and again ninety seconds later, is unchanged. This
narrows upstream issue `genlayerlabs/genvm-manager#20`, which reported *every*
asynchronous message dropped on chain 4221: on Studio Next internal calls and
contract-initiated deploys execute, and only the value transfer does not.

It is also why STANCH takes no custody. A bond would be stranded.

**P2 passing is recorded as a decision, not a convenience.** The push model works
on this chain. We chose the pull model anyway, because it is what produces N2.
A halt authority holding no write path is only meaningful if a write path was
available and declined.

---

## Corrections we had to make

The PRD was written from documentation. The chain disagreed with it in four
places, and each correction is recorded with its raw evidence in `DECISIONS.md`.

| # | What the PRD assumed | What the chain does |
|---|---|---|
| D-003 | `from genlayer import *`, `gl.get_contract_at`, `gl.deploy_contract`, bare `u256` | `import genlayer as gl`, `gl.contract.get_at`, `gl.contract.deploy`, `gl.u256` |
| D-004 | the `Depends` hash was the only header risk | GenVM parses **every** leading comment line as a runner directive; a line of prose under the `Depends` line makes the contract fail to load with `invalid_contract runner malformed` |
| D-007 | pin the reading under `gl.eq_principle.strict_eq` | a cross-contract read inside an equivalence block aborts the transaction; the sandbox each validator spawns has no chain-call capability |
| D-008 | the classifier decides all three outcomes | whether a reading was gathered at all is deterministic, and is now decided in code before any model runs |

D-007 and D-008 were each caught by a gate that failed, and by one that passed
for the wrong reason. Both are written up rather than quietly fixed.

---

## What is model-decided, and what is not

Exactly one thing is put to a language model: **given a complete reading of real
values, does it show the asserted condition holding now.** That is the judgment
that cannot be written as a deterministic predicate in advance — because if it
could, the protocol would already be blocking it.

Everything around it is deterministic and re-executed by every validator:

- reading the target's view surface
- whether the reading spec parsed
- whether every value was gathered
- whether the key is registered
- the status flip itself

A reading that could not be gathered is recorded `INDETERMINATE` in code, with no
model consulted. `INDETERMINATE` is never collapsed into `CLEAR`.

---

## Tests

**24 pass against Studio Next.** Nothing is mocked and nothing is local — every
test deploys and transacts on chain. Transcript in `evidence/tests/transcript.txt`.

```
tests/test_guard_clause.py ....... 4 passed
tests/test_injection.py .......... 1 passed
tests/test_no_resume.py .......... 7 passed
tests/test_registry.py ........... 5 passed
tests/test_verdict_pipeline.py ... 7 passed
                                  24 passed in 13m43s
```

The suite is mostly negative and adversarial by design. The most important one is
`test_persuasive_prose_over_a_healthy_reading_does_not_halt`: it asserts the
verdict follows the reading and not the description.

Each module deploys its own targets and derives its registration keys from its own
name, so a halt in one test can never become a precondition in another. That was
not true of the first version, and it cost seven false failures — see
`DECISIONS.md` D-011.

The source-inspection tests need no network and finish in hundredths of a second:

```bash
.venv/bin/python -m pytest tests/test_no_resume.py \
  -k "source or named or written or only_status or accounted" -q
```

---

## Repository

```
contracts/
  stanch.py              the halt authority. no value, no upgraders, no write path.
  cistern.py             demo target with a deliberate, observable accounting defect
  cistern_fixed.py       the same target with the defect removed (control)
  injection_target.py    a target whose view surface returns instructions (campaign)
probes/                  the §11 gate. run first, results committed, then build.
evidence/
  claims.json            the ledger: status, evidence class, limitations per claim
  studio-next/           one file per observed transaction
  source-inspection/     grep output backing the negative claims
frontend/                Next.js app: registry, claim, verdict record, proof room
tests/                   mostly negative and adversarial
tools/                   probe, gate and evidence runners
DECISIONS.md             every correction, with the raw output that forced it
REPRODUCE.md             every command, in the order to run them
```

---

## The evidence ledger

`evidence/claims.json` is the source of truth and is self-describing: it carries
its own `statusDefinitions` and `evidenceClassDefinitions` so a reviewer never has
to guess what a label means.

Two independent axes. **Status** is how much of a claim the evidence supports:
`SUPPORTED`, `PARTIAL`, `UNMEASURED`, `NOT_CLAIMED`. **Evidence class** is what
kind of observation produced it: `studio_next_observation`, `consensus_receipt`,
`local_test`, `source_inspection`, `synthetic_fixture`, `publisher_claim`.

Three rules, non-negotiable:

1. `limitations[]` is usually longer than the claim. That ratio is the discipline.
2. The claim sentence carries its own boundary. The negation is inside the claim,
   not in a footnote a reader can skip.
3. Partial evidence is described in the row and never raises its status.

---

## Non-goals, and why

- **No bond or slashing in GEN.** Probe P4 shows value paid into a contract on
  Studio Next cannot be paid out. Anything escrowed would be stranded. Claim spam
  is addressed by the record being public and append-only, not by economics.
- **No automatic recovery.** Halt is one-way by design. Resuming a protocol after
  an exploit is a decision with more context than a contract has.
- **No protection of contracts that do not read STANCH.** Pull-based and opt-in.
- **No historical or trace-based detection.**
- **No mainnet.** Studio Next only.
- **No multi-target atomic halt, no severity levels, no appeals process.** All are
  breadth, and the build window was under 48 hours.

---

## Answers to the organizers' self-check

| Their question | Answer |
|---|---|
| Does my app actually call a real GenLayer contract? | Yes. Deployed on Studio Next, chain 61997; addresses and transactions in the gate status above and in `evidence/`. |
| Why does decentralized judgment matter to this problem? | *Is this an active exploit?* cannot be written as a deterministic predicate in advance, because if it could the protocol would already block it. Both a false yes and a false no have an interested party: the attacker benefits from a false no, a griefer or competitor from a false yes. |
| Does the contract maintain meaningful state, and does its validator check the meaningful outcome? | State is the registry, the append-only claim records and the halt status. Validators classify a pinned reading of the target's own state, not the prose of the claim. |
| Does the repository build and work? | `REPRODUCE.md`, gate G10. |
| What have I built beyond the starter or boilerplate? | Two contracts plus a control and an adversarial target, a verdict pipeline, an adversarial campaign, a claim ledger, and a documented probe of chain behaviour that corrected an upstream report. The boilerplate supplies the wallet plumbing only. |
| Can someone use the frontend and follow clear instructions to verify the result? | The registry, verdict records and proof room read with no wallet. `REPRODUCE.md` §5. |
