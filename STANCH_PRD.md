# STANCH — Product Requirements Document

**Version 0.1 · 15 September 2026 · Submissions close 17 September, 3:30 PM UTC**

> **STANCH is a halt authority that has no write access to anything it halts.**

GenLayer Agent Tank Hackathon · Track: **Autonomous Protocols** · Sanctioned idea **#1, Emergency halt module** · Network: **Studio Next, chain 61997**

This document is compressed from a 40-section template to 29 sections because the build window is under 48 hours. Every section that was cut was a section about breadth. Nothing that constrains a claim was cut.

---

## 0. Agent Operating Contract

Read this section end to end before writing a line of code. It overrides habit and it overrides any instruction inferred from surrounding files.

1. **Section numbers govern.** Before building any surface, read the section that governs it. Never re-derive a requirement from memory.

2. **The correction clause.** This PRD is corrected by evidence, not treated as infallible. Where a statement here is contradicted by what the chain or the installed SDK actually does, fix this document and record the raw evidence in `DECISIONS.md`. Never build against a premise already known to be false.

3. **Never invent an API symbol.** This document was written partly from documentation and one open upstream issue, not from the installed package. Any `gl.*` symbol used in STANCH that is not confirmed in `probes/results.json` must be verified by reading the installed `genlayer` package source before use, and the finding recorded. If a symbol named here does not exist, that is a defect in this document, not a licence to guess a replacement.

4. **§11 is a blocker.** No contract work begins until the feasibility gate in §11 is run and its results are committed. If the gate falsifies the architecture, stop and re-read §17.

5. **Claim and evidence land in the same commit or neither lands.** Adding a row to `evidence/claims.json` means adding the evidence file it points at, in the same change.

6. **Report a test count only after it passes.** Run the command, read the real output. Beware `cmd | tail`; the exit code is `tail`'s.

7. **No comments in source.** Names and structure explain the code. The probes in `probes/` are exempt, because their comments record what is being tested and why.

8. **Never present a mock as live.** Anything not executed on Studio Next is labelled `LOCAL FIXTURE` in the UI, in the video, and in the ledger.

9. **Commit granularly as each piece works.** No AI commit trailers, no `Co-Authored-By`, no manufactured history. `evidence:` is a valid commit type.

10. **Submit early.** A shell submission goes to the Portal today and is improved in place. The organizers state explicitly that entries can be edited until close and that early submission buys time to work through an "Action needed" note.

---

## 1. Product Summary

**Name.** STANCH. To stanch is to stop a flow. The demo target it protects is CISTERN, a vault.

**One sentence.** STANCH is a contract that halts other contracts when anyone proves an active exploit, and it holds no key, no upgrader slot, and no write permission on anything it can halt.

**Core claim.** *The halt authority has no write access to anything it halts. It publishes a verdict. The target enforces that verdict on itself.*

**Judge-compressed narrative.** Every protocol with a pause guardian trusts a key that can pause, unpause, change parameters and sometimes move funds, and trusts that key to be awake at 3am and honest about why it pulled the lever. STANCH replaces that key with a contract holding exactly one power: publish a verdict that a registered target is compromised. It cannot resume. It cannot upgrade. It cannot hold value. It halts only on a claim that validators independently re-derive from the target's own public state.

---

## 2. Why This Can Win

1. **It passes the organizers' hardest self-check question.** "Why does decentralized judgment matter to this problem?" *Is this an active exploit?* is the rare predicate that cannot be written deterministically in advance, because if it could, the protocol would already be blocking it. A deterministic guard is a bug fix. A judgment is what is left over.

2. **It is two-sided adversarial.** The attacker benefits from a false "no". A griefer or a competitor benefits from a false "yes". Most hackathon entries ask an LLM to judge a claim nobody has an interest in faking, which makes multi-validator consensus theatre bolted onto an API call. This one has a real party on both sides of a wrong answer.

3. **The headline is a negative claim.** Positive claims can be faked by one lucky run. "The halt authority cannot write to what it halts" is checkable by a stranger with `grep` in under a minute.

4. **No live project exists in this track yet.** The organizers say the first team here sets the reference. A reference implementation is judged on whether it is defensible, not on whether it is flashy.

5. **The architecture is a consequence of a real upstream defect, and we publish both.** See §11 and §24.

---

## 3. Problem

A protocol under active exploit has minutes. The pause mechanism it relies on has three failure modes, and they are all authority failures rather than code failures:

| Failure | What it actually is |
|---|---|
| The guardian is asleep | The authority is bound to a human's availability |
| The guardian is compromised | The pause key usually also upgrades, tunes and sometimes withdraws |
| The guardian declines | The party who can halt is often the party who loses money if it halts |

The standard fix is a multisig, which reduces the second failure and makes the first two worse. The other standard fix is a governance vote, which is measured in days.

---

## 4. Product Thesis

The task is one bit: this target is compromised, stop it. The authority granted to perform that task is a bundle of unrelated powers held by a person. Shrink the authority to the exact shape of the task, structurally, and then prove the boundary held.

Concretely:

| Power a normal guardian holds | What STANCH holds |
|---|---|
| Pause | Publish a HALTED verdict |
| Unpause | Nothing. Halt is one-way. |
| Upgrade the target | Nothing |
| Change target parameters | Nothing |
| Move or hold funds | Nothing. STANCH never takes custody of value. |
| Decide privately, on any reason or none | A verdict re-derived by validators from the target's own public state, against a standard fixed in locked code |

---

## 5. Dominant Mechanism

```
  claimant                STANCH (chain 61997)                 CISTERN (target)
     │                            │                                   │
     │ submit_claim(target, ──────▶ 1. strict_eq read of the          │
     │   reading, pattern)        │    target's public view surface ──┤ (sync view)
     │                            │                                   │
     │                            │ 2. prompt_non_comparative:        │
     │                            │    validators independently       │
     │                            │    classify that reading          │
     │                            │      EXPLOIT / CLEAR / INDETERMINATE
     │                            │                                   │
     │                            │ 3. on EXPLOIT: status_of(key)     │
     │                            │    flips RUNNING → HALTED         │
     │                            │    (irreversible)                 │
     │                            │                                   │
     │                            ◀─── 4. every write method reads ───┤
     │                            │      status_of() synchronously     │
     │                            │      and refuses if HALTED         │
```

**STANCH never calls CISTERN. CISTERN reads STANCH.** This inversion is the product, and §11 explains why it is also the only architecture that survives the current chain.

---

## 6. Track Anchor and Deviation Guard

Track definition, verbatim: *systems that run themselves; if a contract pauses, tunes or rewrites another contract or its own rules with no one voting, it belongs here.*

STANCH pauses another contract, with no one voting. The anchor phrase is **pauses another contract**.

**Forbidden drift.** Do not build for Agentic Commerce Infrastructure, Onchain Justice, Prediction Markets, AI Governance or Future of Work. Do not reinterpret STANCH into a dispute-resolution product, a reputation system, an insurance product, or a monitoring dashboard. If a proposed feature does not end in a contract's state changing without a vote, it is out of track and out of scope.

**Single-entry rule.** One project per Portal account. STANCH is that project.

---

## 7. Trust Boundary

| Party | Trusted with |
|---|---|
| Claimant | Nothing. A claim is an input, not an assertion. The claimant's description is never the basis of the verdict. |
| Validators | The classification, under the equivalence principle. This is the only trusted judgment in the system. |
| Deployer | Nothing after deployment. See negative claim N5. |
| Target operator | Choosing to register and to honour the verdict. A target that does not read STANCH is simply not protected. |
| STANCH itself | Publishing a verdict. It cannot act on it. |

**The honest boundary:** STANCH is opt-in and pull-based. It cannot halt a contract that was not written to read it. That is a real limitation and it is stated in the README above the fold, not in a footnote.

---

## 8. System Architecture

```
stanch/
├── contracts/
│   ├── stanch.py                 # the halt authority. no value, no upgraders.
│   ├── cistern.py                # demo target with a deliberate, observable defect
│   └── cistern_fixed.py          # the same target with the defect removed (control)
├── probes/                       # §11. run first, commit results, then build.
│   ├── probe_target.py
│   ├── probe_governor.py
│   ├── PROBE.md
│   └── results.json              # written by hand from observed output
├── evidence/
│   ├── claims.json               # the ledger. see §14.
│   ├── studio-next/              # one file per observed transaction
│   └── source-inspection/        # grep output backing the negative claims
├── frontend/                     # boilerplate v2-dev, per the hackathon stack
├── tests/
├── DECISIONS.md
├── REPRODUCE.md
└── README.md
```

**Stack, fixed by the hackathon rules, not negotiable:**

- Network `Studio Next`, RPC `https://studio-next.genlayer.com/api`, chain ID `61997`, explorer `https://explorer-studio-dev.genlayer.com/`
- New project: clone the `v2-dev` branch of `genlayerlabs/genlayer-project-boilerplate`, `npm ci`, copy `frontend/.env.example` to `frontend/.env`, set the deployed contract address
- Or existing app: `@genlayer/transaction-kit@0.1.0-rc.2` plus the React or Vue adapter at the same version, alongside `genlayer-js@2.0.0-rc.1`
- These are prerelease versions. Pin them. Do not upgrade mid-build.

---

## 9. Product Surfaces

Four pages. No more.

| Surface | Job | Failure state |
|---|---|---|
| **Registry** | Every registered target, its key, its current status, the transaction that set it | An unreachable target reads `UNKNOWN`, never `RUNNING` |
| **Submit a claim** | Target, the reading recipe, the claimed pattern. Shows the exact bytes that will be classified before you sign. | Malformed reading is refused client-side with the reason |
| **Verdict record** | One claim: the pinned reading, the verdict, the validator outcome, the transaction hash, the explorer link | A pending verdict reads `PENDING`. An indeterminate one reads `INDETERMINATE` and is never styled as either outcome. |
| **Proof room** | Every claim in `claims.json`, its status, its evidence class, its limitations, a link to the raw evidence file | A claim whose evidence is missing renders as `UNMEASURED`, not hidden |

**No-wallet rule.** Registry, verdict records and proof room must be fully readable with no wallet connected. Only claim submission requires a signature. A judge with no Studio Next funds must be able to see everything that matters.

---

## 10. Contract Requirements

### STANCH

State:

- `targets: TreeMap[str, str]` — registration key to target address
- `status: TreeMap[str, str]` — registration key to `RUNNING` or `HALTED`
- `claims: DynArray[str]` — append-only claim records as JSON
- `standard: str` — the classification standard, a module-level constant in code, **not** a writable slot

Methods:

| Method | Kind | Rule |
|---|---|---|
| `register(key, target_address)` | write | Idempotent. A key may be bound once. Rebinding is refused. |
| `submit_claim(key, reading_spec, pattern)` | write | Runs the verdict pipeline in §12. Appends a record regardless of outcome. |
| `status_of(key)` | view | Returns `RUNNING`, `HALTED`, or `UNKNOWN` for an unregistered key |
| `claim_at(index)` | view | The full record including the pinned reading and the verdict |
| `claim_count()` | view | |

**Methods that must not exist, and their absence is a shipped claim:** `resume`, `unhalt`, `set_status`, `set_standard`, `withdraw`, any `payable` method, any `emit_transfer`, any `@gl.public.write` reachable only by the deployer.

### CISTERN

A minimal vault with a **deliberate, observable accounting defect**. The defect must satisfy §13: the exploited condition must be visible in CISTERN's own public view surface while it is happening.

Every state-changing method begins with the guard:

```python
def _assert_running(self) -> None:
    word = gl.get_contract_at(Address(self.stanch_address)).view().status_of(self.stanch_key)
    if str(word) != "RUNNING":
        raise gl.vm.UserError("STANCH_HALTED")
```

`self.stanch_address` and `self.stanch_key` are constructor arguments written once. CISTERN does not need to know its own address, which avoids depending on a self-address accessor this document cannot confirm exists. If the probe confirms one, record it in `DECISIONS.md` and simplify.

---

## 11. Technical Feasibility Gate

**Nothing in §10 gets built until this section is resolved and `probes/results.json` is committed.**

### What is already established from documentation

- GenLayer upgradability is native and built around the Root Slot, which stores an upgraders list. At the start of a write transaction GenVM reads that list; a sender in it can modify any slot, including code. After `__init__` completes, the runtime automatically calls `root.lock_default()`, locking the root slot, the code slot, the locked_slots slot and the upgraders slot. A contract with locked slots and no upgraders cannot be upgraded, irreversibly.
- GenLayer fully supports deterministic logic. State updates, value transfers and contract interactions all work without AI components.
- Every Intelligent Contract has a ghost contract on the EVM layer at the same address, which holds GEN balance, relays transactions to consensus and executes external messages.

### The open defect that shapes the architecture

Issue `genlayerlabs/genvm-manager#20`, filed 5 August 2026, still open and unassigned, reports that on chain 4221 every asynchronous message an Intelligent Contract emits is recorded in the transaction and then never executed. `gl.deploy_contract` returns an address where no contract exists. `gl.get_contract_at(addr).emit().method()` never calls the callee. `emit_transfer` moves no balance. `on="accepted"` and `on="finalized"` behave identically. The parent transaction reaches FINALIZED with a correctly formed message recorded in it, so GenVM produces the message and nothing consumes it. Everything synchronous works normally on the same network. The reporter notes the dangerous asymmetry: value can be paid into a contract and cannot be paid out, so anything staked there is stranded while the contract's own bookkeeping records the payout as done.

**Chain 4221 is Asimov/Bradbury. Our mandated target is Studio Next, chain 61997.** The defect may not apply. It must be probed, not assumed.

### The five probes

Run all five on Studio Next. Record every result, including the ones that pass.

| ID | Question | Why STANCH cares |
|---|---|---|
| **P1** | Does `gl.deploy_contract` from inside a contract produce a reachable contract? | Not needed by v1. Establishes whether the async message path works at all. |
| **P2** | Does `gl.get_contract_at(addr).emit().method()` reach the callee? | If yes, the push model is available. If no, this justifies the pull architecture publicly. |
| **P3** | **Does `gl.get_contract_at(addr).view().method()` work contract-to-contract, synchronously, inside a write transaction and inside a view?** | **Load-bearing. The entire STANCH architecture is this one call.** The upstream issue says synchronous reads are healthy but it exercised EOA-to-contract reads, not contract-to-contract. |
| **P4** | Does `emit_transfer` move value out of a contract? | Decides whether a slashable bond in GEN is possible at all. |
| **P5** | Is the upgraders list empty after a plain deployment, and does an upgrade attempt then fail? | Backs negative claim N5. |

Procedure and contracts are in `probes/PROBE.md`. Results template in `probes/results.template.json`.

### Branches

| Outcome | Consequence |
|---|---|
| **P3 passes** | Build §10 as written. This is the expected and required path. |
| **P3 fails** | STANCH as specified is not buildable on Studio Next. Do not substitute a backend service that reads STANCH and pokes CISTERN; that reintroduces exactly the trusted operator the product exists to remove. Stop, file the upstream issue, and re-read §17. |
| **P2 passes** | Do **not** switch to the push model. Record in `DECISIONS.md` that the pull model was chosen even though push works, because it is the choice that produces the negative claim. Note this explicitly so a reviewer sees it was a decision, not a workaround. |
| **P2 fails** | Publish it. Extend the upstream issue with a Studio Next reproduction, link it from the README, and record the maintainer response including silence. |
| **P4 fails** | Bonds in GEN are impossible. §16 already assumes this. Nothing changes. |
| **P5 shows a populated upgraders list** | N5 is falsified as written. Find the freeze path, or narrow N5 to what is true, immediately. |

---

## 12. The Verdict Pipeline

Three stages. The separation is the point: the deterministic read is pinned before any model sees it.

**Stage 1 — pin the reading, under `gl.eq_principle.strict_eq`.**
Read the target's public view surface according to `reading_spec`. Output is deterministic bytes. Validators must agree byte for byte. A reading that cannot be reproduced is not a claim.

**Stage 2 — classify, under `gl.eq_principle.prompt_non_comparative`.**
Each validator independently classifies the pinned reading against the fixed standard. Non-comparative rather than comparative, because we want independent derivation of the same verdict rather than tolerance around a leader's answer.

Output is one of exactly three words:

```
EXPLOIT         The reading shows a condition matching the standard, active now.
CLEAR           The reading does not show such a condition.
INDETERMINATE   The reading is insufficient to decide.
```

**Stage 3 — act.**
`EXPLOIT` flips status to `HALTED`, once, irreversibly. `CLEAR` and `INDETERMINATE` change nothing. **`INDETERMINATE` is never collapsed into `CLEAR`.** It is counted, displayed and stored as its own outcome, and the UI styles it as neither a pass nor a fail.

Storage is copied to memory before entering any non-deterministic block. Storage is never read directly inside leader or validator logic.

---

## 13. What Makes a Condition Halt-able

A hard requirement that constrains the demo, and a limitation that goes in the README.

**A condition is halt-able only if it is observable in the target's public view surface at verdict time.**

Consequences, all of which are stated publicly rather than discovered by a reviewer:

- STANCH cannot halt an exploit that has already completed and left no trace in current state. This is acceptable: halting after the fact does nothing anyway, and the track wording is *active* exploit.
- STANCH cannot read historical state or transaction traces. Intelligent Contracts read current state.
- A target that exposes no useful view surface cannot be protected, however badly it is being drained.

CISTERN's deliberate defect must therefore produce a **currently readable** invariant violation, for example total claimable units exceeding total deposited units. Design the defect around the readable invariant, not the other way round.

---

## 14. Claim and Evidence Ledger

`evidence/claims.json` is the source of truth and it is self-describing: it carries its own `statusDefinitions` and `evidenceClassDefinitions` so a reviewer never guesses what a label means.

Two independent axes:

- **Status:** `SUPPORTED`, `PARTIAL`, `UNMEASURED`, `NOT_CLAIMED`
- **Evidence class:** `studio_next_observation`, `consensus_receipt`, `local_test`, `source_inspection`, `synthetic_fixture`, `publisher_claim`

Three rules, non-negotiable:

1. **`limitations[]` is usually longer than the claim.** That ratio is the discipline.
2. **The claim sentence carries its own boundary.** Write the negation inside the claim, not in a footnote a reader can skip.
3. **Partial evidence is described in the row and never raises its status.**

The skeleton ships pre-populated with every claim at `UNMEASURED` or `NOT_CLAIMED`. Promotion happens only when the evidence file exists.

---

## 15. Negative Claims

These five are the product. Each names the evidence that would falsify it.

| ID | Claim | Evidence |
|---|---|---|
| **N1** | STANCH cannot resume a halted target. No method exists to set a status back to `RUNNING`, and no code path writes `RUNNING` after construction. | `source_inspection` grep output, plus a test that attempts every public method against a halted key and shows all fail |
| **N2** | STANCH has no write path to any target. `.emit(`, `emit_transfer`, `gl.deploy_contract` and any EVM write interface appear nowhere in `contracts/stanch.py`. | `source_inspection`: the grep, committed, with the forbidden symbol list |
| **N3** | STANCH never takes custody of value. No `payable` method exists and its balance is structurally zero. | `source_inspection` plus a `studio_next_observation` of the contract balance |
| **N4** | A claim whose pinned reading does not support the pattern does not halt the target. | `consensus_receipt` for a submitted false claim returning `CLEAR`, with the target still `RUNNING` afterwards |
| **N5** | The classification standard cannot be changed by anyone, including the deployer. STANCH deploys with an empty upgraders list, so its code slot is locked at construction. | `studio_next_observation` reading the upgraders list, plus a failed upgrade attempt |

N4 is the one most builders will skip because it requires demoing your own system declining to act. It is the one that makes the other four believable.

---

## 16. Non-Goals

Stated plainly, each with the reason, because an unstated non-goal reads as an oversight.

- **No bond or slashing in GEN.** Upstream issue #20 reports value can be paid into a contract and not out, stranding it. Until P4 passes on Studio Next, STANCH takes no custody. Claim spam is addressed by the claim record being public and append-only, not by economics.
- **No automatic recovery.** Halt is one-way by design. Resuming a protocol after an exploit is a decision with more context than a contract has.
- **No protection of contracts that do not read STANCH.** Pull-based and opt-in.
- **No historical or trace-based detection.** See §13.
- **No mainnet.** Studio Next only, as mandated.
- **No multi-target atomic halt, no severity levels, no appeals process.** All are breadth. None are in the 48-hour window.
- **This is not an audit and not a production safety system.** Stated above the fold in the README.

---

## 17. Kill Criteria

If any becomes true: stop claiming the affected capability, record it with status `UNMEASURED` or `NOT_CLAIMED` and a plain-language blocker, print it in the README, and keep building whatever still stands. Do not hide a blocked capability behind a substitute and do not soften the wording to keep a claim alive.

| # | Condition | Action |
|---|---|---|
| K1 | P3 fails on Studio Next | The core architecture is falsified. Do not replace the sync read with an off-chain relayer. Fall back to a single-contract build where STANCH halts **itself** by the same verdict pipeline, which still satisfies the track ("or its own rules"), and say clearly that cross-contract enforcement was blocked upstream. |
| K2 | `prompt_non_comparative` cannot reach consensus on the classification within the deadline | Narrow the standard until it can, and publish the narrowing. A standard nobody can agree on is not a standard. |
| K3 | Studio Next is unavailable inside the final 12 hours | Ship with local test evidence only, every claim relabelled `local_test`, and the README stating no Studio Next observation exists. Do not present local runs as network evidence. |
| K4 | The demo defect in CISTERN turns out not to be readable from its public view surface | Redesign the defect around §13. Do not weaken the standard to match an unreadable bug. |

---

## 18. Acceptance Gates

Numbered, recorded the moment each passes, with the transaction hash or file that proves it.

| Gate | Condition |
|---|---|
| G0 | §11 probes run on Studio Next, `probes/results.json` committed, P3 resolved |
| G1 | STANCH deployed to Studio Next, address and deploy transaction recorded |
| G2 | CISTERN deployed, registered, `status_of` returns `RUNNING` |
| G3 | A true claim returns `EXPLOIT` under validator consensus and flips the status, with the receipt |
| G4 | A CISTERN write reverts with `STANCH_HALTED` after the flip, with the failing transaction |
| G5 | A false claim returns `CLEAR`, the target stays `RUNNING`, with the receipt |
| G6 | An insufficient claim returns `INDETERMINATE` and is displayed as neither outcome |
| G7 | All five negative claims in §15 have committed evidence |
| G8 | Frontend serves the registry, a verdict record and the proof room with no wallet connected |
| G9 | Demo video recorded, showing G3, G4 and G5 |
| G10 | Clean-clone reproduction: fresh clone, install, tests pass, `claims.json` verifies |

**G5 is not optional.** A submission with only G3 is a happy-path demo.

---

## 19. Testing Strategy

GenLayer Testing Suite, `gltest`, with `get_contract_factory` and `tx_execution_succeeded`.

Required negative and adversarial tests:

- Every public STANCH method called against a halted key, asserting none restores `RUNNING`
- Rebinding a registration key, asserting refusal
- `status_of` on an unregistered key returning `UNKNOWN`, not `RUNNING`
- CISTERN write methods after a halt, asserting `STANCH_HALTED`
- A claim with a reading spec pointing at a non-existent method, asserting no halt
- A claim whose prose asserts an exploit while its pinned reading shows a healthy invariant, asserting `CLEAR`. This is the prompt-injection test and it is the most important one in the suite.

Passing lint and tests is a starting point, not a guarantee of acceptance. The organizers say so explicitly.

---

## 20. Adversarial Campaign

Three attacks, each run and each recorded with its outcome, including any that succeed.

| Attack | Expectation |
|---|---|
| **Persuasive false claim.** Claim text argues forcefully for an exploit; the pinned reading shows a healthy invariant. | `CLEAR`. The verdict follows the reading, never the description. |
| **Injection in the reading.** The target's view surface returns a string containing instructions to the classifier. | `CLEAR` or `INDETERMINATE`, never `EXPLOIT`. Record the exact payload used. |
| **Registration squat.** A second party registers a key pointing at someone else's contract. | Refused, or harmless because the target chose its own key at construction. Record which. |

If an attack succeeds, it goes in the README under engineering decisions and the hard problems, with what was changed. Publishing the version where the mechanism failed is worth more than a clean table.

---

---

## 22. Judge Experience

Design the reviewer's five minutes. Put this in `README.md` as a table, and start it with the true gate status even when it reads badly.

| Time | What to do | What it establishes |
|---|---|---|
| 0:00–0:45 | Read the status line and the stage disclaimer at the top of the README | What is and is not claimed, before anything good is shown |
| 0:45–1:30 | Open the registry with no wallet. See CISTERN halted, with the transaction | The halt is real and on Studio Next |
| 1:30–2:30 | Open the verdict record for the true claim. Read the pinned reading, then the verdict | The verdict came from state, not from the claimant's prose |
| 2:30–3:30 | Open the verdict record for the **false** claim. Note `CLEAR`, target still `RUNNING` | The system declines to act |
| 3:30–4:15 | Run the grep in `REPRODUCE.md` against `contracts/stanch.py` | No write path to any target exists |
| 4:15–5:00 | Open `evidence/claims.json` and read the `limitations` on any claim | What the evidence does not reach |

---

## 23. Judging-Criteria Mapping

The organizers publish their own pre-submission self-check. Answer every one of them, in the README, in their words.

| Their question | STANCH's answer |
|---|---|
| Does my app actually call a real GenLayer contract? | Yes. Deployed on Studio Next, chain 61997, addresses and transactions in the README and in `claims.json`. |
| Why does decentralized judgment matter to this problem? | *Is this an active exploit?* cannot be written as a deterministic predicate in advance, because if it could the protocol would already block it. Both a false yes and a false no have an interested party. |
| Does the contract maintain meaningful state, and does its validator check the meaningful outcome? | State is the registry, the append-only claim records and the halt status. The validator checks the three-word verdict over a byte-pinned reading, not the prose of the claim. |
| Does the repository build and work? | G10, clean-clone reproduction, with the commands in `REPRODUCE.md`. |
| What have I built beyond the starter or boilerplate? | Two contracts, a three-stage verdict pipeline, an adversarial campaign, a claim ledger, and a documented upstream probe of async message execution on Studio Next. The boilerplate supplies the wallet plumbing only. |
| Can someone use the frontend and follow clear instructions to verify the result? | §9 no-wallet rule plus §22 timed path. |
| Passing lint and tests is a starting point, not a guarantee. | §19 and §20. The suite is mostly negative and adversarial tests. |

The Resources page points to GenLayer contract-writing skills covering validation patterns and anti-patterns. Read them before writing the equivalence-principle blocks, and if a design decision is uncertain, ask in the community channels early rather than at hour 40.

---

## 24. Competitive Positioning

Expect several emergency-halt entries. The differences that will be visible to a panel:

| Likely entry | STANCH |
|---|---|
| An agent watches a contract and calls pause | No off-chain watcher. No privileged caller. The target reads the verdict itself. |
| The pause authority is a contract with an owner | No owner, no upgraders, locked code slot from construction |
| The LLM reads the claim and decides | The LLM classifies a byte-pinned reading of the target's own state; the claim's prose is never the basis of the verdict |
| Demo shows a successful halt | Demo shows a successful halt **and** a refused false claim **and** an indeterminate one |
| "Verified" is a boolean | Two axes: status and evidence class, with limitations on every row |

The upstream probe is also positioning. A submission that arrives with a reproduction of a chain-layer defect on the organizers' own mandated network, filed upstream, reads as engineering rather than as a demo.

---

## 25. Demo Video Requirements

**Mandatory**, regardless of the Portal form labelling the field optional. It must show what the app does, explain what is happening, and help someone understand it before trying it.

Target 2:30. Structure:

| Time | Content |
|---|---|
| 0:00–0:20 | The problem: the pause key that can do everything and is asleep |
| 0:20–0:45 | CISTERN running, the defect being exploited, the invariant visibly breaking in its own view surface |
| 0:45–1:25 | A claim submitted. The pinned reading shown before the verdict. Validators agree. Status flips to HALTED. |
| 1:25–1:50 | The next CISTERN write reverting with `STANCH_HALTED` |
| 1:50–2:15 | **The false claim returning `CLEAR`, target still running** |
| 2:15–2:30 | The grep showing no write path, and the claims ledger with its limitations |

Every number on screen must match the README, the ledger and the explorer. Anything not executed on Studio Next is captioned `LOCAL FIXTURE` on screen.

---

## 26. Submission Deliverables

- Public GitHub repository
- Full project application on the Portal, submitted early and edited in place
- Demo video
- Deployed on Studio Next with addresses and transactions in the README
- `evidence/claims.json` with every claim carrying a status, an evidence class and limitations
- `REPRODUCE.md` with the clean-clone gate
- `DECISIONS.md` with the §11 outcome as D1

If the submission shows "Action needed", read the reviewer's note, update, and respond with what changed. Do not silently edit.

---

## 27. Scope Ladder and Stop Boundaries

Ordered by dependency, not by clock. Do not begin a rung before the one below it holds.

```
R0  §11 probes run, results committed, P3 resolved
R1  STANCH deployed, register + status_of working, no verdict pipeline yet
R2  CISTERN deployed, registered, guard clause refusing on a manually set HALTED
R3  Stage 1 of the pipeline: the strict_eq pinned reading, displayed, no classification
R4  Stage 2 and 3: classification and the irreversible flip
R5  The false claim and the indeterminate claim, recorded
R6  Frontend: registry, verdict record, proof room, no wallet
R7  Negative claim evidence, grep output, upgraders read
R8  Video
R9  Adversarial campaign, §20
```

**The stop boundary:** R5 is the minimum defensible submission. A build that reaches R4 and stops is a happy-path demo and should be submitted as one, honestly labelled, rather than dressed up. Everything from R6 up is presentation of a mechanism that already works. Do not build R6 before R5 holds.

---

## 28. Definition of Done

- Gates G0 through G7 pass, each with its committed evidence
- Every claim in `claims.json` has a status its evidence actually reaches, and a non-empty `limitations`
- No claim anywhere in README, UI, video or Portal application exceeds its ledger row
- `INDETERMINATE` and `UNKNOWN` appear as distinct outcomes in the UI
- The false-claim refusal is in the video
- Clean-clone reproduction passes
- The §11 probe result is public, whichever way it resolved

---

## 29. The One-Line Version

> STANCH does not ask you to trust the guardian. It removes the guardian's ability to do anything except tell the truth once, and then it shows you the claim it refused.
