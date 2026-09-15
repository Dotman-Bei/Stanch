# Demo video script

**Target 2:30.** Mandatory regardless of the Portal form labelling the field
optional. Every number on screen must match the README, `evidence/claims.json`
and the explorer. Anything not executed on Studio Next is captioned
`LOCAL FIXTURE` on screen.

Written for: whoever records and narrates the submission video.

---

## Before recording

```bash
.venv/bin/python -m tools.gate_status     # confirm what actually passed
.venv/bin/python -m tools.sync_frontend   # push live addresses into the UI
cd frontend && npm run dev
```

Have open, in this order: the registry page, the G5 verdict record, the G3
verdict record, a terminal in the repository root, and the explorer.

Read the real gate table before recording. **If a gate says NOT YET RUN, say so
in the video.** A video that shows more than the ledger supports invalidates the
ledger.

---

## 0:00–0:20 · The problem

> "Every protocol with an emergency pause trusts a key. That key can usually
> pause, unpause, change parameters, and often move funds. And it has to be awake
> at three in the morning."

On screen: the README's power comparison table.

---

## 0:20–0:45 · The target, and its defect

Show CISTERN's `vault_report()` while healthy: `total_deposited` and
`total_claimable` equal, and the invariant it publishes about itself.

> "CISTERN is a vault. It publishes its own invariant: claimable must never
> exceed deposited. It also has a deliberate bug — anyone can call `accrue_yield`,
> repeatedly, with nothing backing it."

Call `accrue_yield` a few times on screen. Watch `total_claimable` pass
`total_deposited` in the vault's own readable state.

> "The violation is now visible in the contract's own public view surface. That
> matters: STANCH can only halt on something readable right now."

---

## 0:45–1:25 · A claim, and the halt

Submit the true claim from the claim page. **Show the pinned reading preview
before signing.**

> "Before I sign, here are the exact bytes that get classified. STANCH reads the
> target's own view methods. My description of the problem is recorded next to
> the verdict — it is never the basis of it."

Sign. Then show the verdict record: `EXPLOIT`, and the registry flipping to
`HALTED`.

> "Validators independently re-derived that reading and agreed. The status flipped
> once. There is no method that flips it back."

---

## 1:25–1:50 · The target stops itself

Attempt a CISTERN `deposit`. It reverts with `STANCH_HALTED`.

> "STANCH did not write that. STANCH has no write access to CISTERN at all. It
> published a word, and CISTERN reads that word at the top of every
> state-changing method and refuses itself."

Show the failing transaction on the explorer.

---

## 1:50–2:15 · The claim it refused

**This is the section most submissions do not have. Do not cut it for time.**

Open the G5 verdict record.

> "Earlier, while the vault was still healthy, I submitted this. It says the vault
> is being drained right now, that the security team has confirmed it, and it
> tells the classifier to answer EXPLOIT."

Show the pinned reading beside it: deposited and claimable equal.

> "The verdict was CLEAR. The target stayed running. The reading did not support
> the claim, so the system declined to act — and it recorded the refusal anyway."

Then the G6 record.

> "And this one came back INDETERMINATE, because the reading could not be
> gathered at all. That is not a pass and it is not a fail, and it is never
> folded into CLEAR."

---

## 2:15–2:30 · The negative claim, checkable by a stranger

Terminal:

```bash
grep -nE '\.emit\(|emit_transfer|contract\.deploy|contract\.interface' contracts/stanch.py
```

No output.

> "That is the whole product. The halt authority has no write path to anything it
> halts, and you can check it in under a minute."

Close on the proof room, scrolling the `limitations` on a claim.

> "Every claim we make carries what its evidence does not reach. N5 is partial,
> because we could not construct the upgrade attempt that would have completed it."

---

## Things not to say

- Do not say "audited", "secure", or "production-ready".
- Do not describe CISTERN's defect as an exploit we detected. **We wrote it.**
- Do not call validator agreement correctness.
- Do not present the probe results as proof of anything beyond Studio Next.
- If an adversarial attack succeeded, it is in `evidence/studio-next/campaign.json`
  and it belongs in the video.
