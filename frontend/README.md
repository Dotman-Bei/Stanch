# STANCH — interface

Four surfaces over the STANCH contract on GenLayer Studio Next, chain 61997.

| Route | Surface | Wallet |
|---|---|---|
| `/` | Registry — every registered target, its key, its status, the transaction that bound it | not needed |
| `/claim` | Submit a claim — target, reading recipe, asserted pattern, with a preview of the exact bytes that will be classified | **required to sign** |
| `/verdict/[index]` | Verdict record — the pinned reading, the verdict over it, the target's status now | not needed |
| `/proof` | Proof room — every claim on chain, the evidence ledger, and what each claim does not reach | not needed |

**The no-wallet rule is a requirement, not a convenience.** A reviewer with no
Studio Next funds must be able to see everything that matters. Only claim
submission asks for a signature.

## Setup

```bash
npm install --legacy-peer-deps
cp .env.example .env
# set NEXT_PUBLIC_CONTRACT_ADDRESS to the deployed STANCH address from
# ../evidence/studio-next/deployment.json
npm run dev
```

`--legacy-peer-deps` is required: the pinned prereleases
`@genlayer/transaction-kit@0.1.0-rc.2` and `genlayer-js@2.0.0-rc.1` declare peer
ranges npm 10 will not resolve unaided.

To refresh the addresses, probe results and claim ledger the pages read from:

```bash
cd .. && .venv/bin/python -m tools.sync_frontend
```

## Rate limits

Studio Next allows **30 reads per minute**. Every page reads the chain live, and
one pass over the four surfaces costs roughly two dozen calls, so a reviewer
clicking quickly would otherwise be rate-limited into an error page.

Reads are cached for **10 seconds** and no longer — far shorter than the minutes a
verdict takes to reach consensus, so no page can show a stale halt status in any
way that matters. If the limit is hit anyway, the page says *"Slow down a moment"*
and states plainly that the contracts are fine, rather than claiming the chain
could not be read.

## What the interface will not do

- It never synthesises a value. If `NEXT_PUBLIC_CONTRACT_ADDRESS` is unset, or
  Studio Next does not answer, the page says so.
- An unreachable target reads `UNKNOWN`. It never reads `RUNNING`.
- `INDETERMINATE` and `UNKNOWN` are styled as neither a pass nor a fail:
  frost glass with a dashed edge, against the solid pills used for the two real
  outcomes.
- A ledger claim whose evidence file is missing renders as `UNMEASURED` rather
  than being hidden.

## Design

The visual system is the Base Club / SocialFi brutalist specification in
`../docs/brand/frontend.txt` v2.5.0: electric blue `#0038FF` ground, volt lime
`#CCFF00` accent, deep abyss `#001A99` extrusion shadows, pure black outlines
with hard offsets, frost-glass cards, Arial Black display type over Inter and
JetBrains Mono. Addresses, hashes and counts are monospace with `tabular-nums`.

Verdict states are separated by shape and weight rather than hue, so the
three-way distinction survives in a two-colour palette. See `../DECISIONS.md`
D-005.
