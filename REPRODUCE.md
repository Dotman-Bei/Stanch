# REPRODUCE

Every command here was run to produce the evidence in this repository. Commands
are given in the order a reviewer should run them.

Network for everything below: **Studio Next**, chain `61997`, RPC
`https://studio-next.genlayer.com/api`, explorer
`https://explorer-studio-dev.genlayer.com/`.

---

## 0. Clean clone (gate G10)

```bash
git clone <this repository> stanch && cd stanch

python3 -m venv .venv
.venv/bin/pip install -r requirements.txt

cd frontend && npm install --legacy-peer-deps && cd ..
```

`--legacy-peer-deps` is required: the pinned prereleases
`@genlayer/transaction-kit@0.1.0-rc.2` and `genlayer-js@2.0.0-rc.1` declare peer
ranges npm 10 will not resolve on its own.

Then create and fund an account:

```bash
.venv/bin/python -m tools.bootstrap
```

This writes `STANCH_PRIVATE_KEY` to `.env` and funds it through
`sim_fundAccount`. **Do this before anything else**, including the tests that
need no network: `gltest.config.yaml` reads that variable while loading its
configuration, so without it even a pure source-inspection run stops with

```
Gltest configure error: Environment variable STANCH_PRIVATE_KEY is not set
```

`.env` is gitignored. Nothing in it is secret and nothing in it is worth
anything — Studio Next tokens are valueless.

---

## 1. The negative claims, without touching the network

These are the fastest checks a reviewer can make, and they are the ones that
carry the headline. Under a minute, no wallet, no RPC.

```bash
# N2 — no write path to any target. Expect no output.
grep -nE '\.emit\(|emit_transfer|contract\.deploy|contract\.interface' contracts/stanch.py

# N1 — no method restores RUNNING. Expect no output.
grep -nE 'def (resume|unhalt|set_status|set_standard|withdraw)' contracts/stanch.py

# N1 — every write to the status map. Expect exactly two:
#      one RUNNING in register, one HALTED in submit_claim.
grep -nE 'self\.status\[[^]]*\] = ' contracts/stanch.py

# N3 — no payable method, no value read. Expect no output from both.
grep -n 'payable' contracts/stanch.py
grep -n 'gl.message.value' contracts/stanch.py

# The only cross-contract call STANCH makes. Expect .view(), never .emit.
grep -n 'gl.contract.get_at' contracts/stanch.py
```

Regenerate the committed transcripts of these in `evidence/source-inspection/`:

```bash
.venv/bin/python -m tools.source_inspection
```

---

## 2. The feasibility gate (G0)

Run before any contract work. Deploys two probe contracts and answers the five
questions in `probes/PROBE.md`.

```bash
.venv/bin/python -m tools.run_probes
```

Writes `probes/results.json`. Takes roughly ten minutes: P1 waits for a
contract-initiated deployment to finalize and P4 waits ninety seconds to confirm
a balance did not move.

Outcome recorded in this repository: **P3 passes** (the architecture is
buildable), P2 and P1 pass, **P4 fails** with value stranded in the contract, P5
is partial. See `DECISIONS.md` D1.

---

## 3. Deploy and run the acceptance gates (G1 through G6)

```bash
.venv/bin/python -m tools.run_gates all
```

Or in two halves, which is useful when the RPC rate-limits you:

```bash
.venv/bin/python -m tools.run_gates deploy   # G1, G2, registrations
.venv/bin/python -m tools.run_gates gates    # G2 re-read, G5, G6, G3, G4, control
```

The order is deliberate. **G5 and G6 run while the vault is provably healthy,**
before anything is exploited, so a refusal cannot be dismissed as a system that
had already fired. Then the defect is exploited until the invariant visibly
breaks, and only then is the true claim submitted.

| Gate | What it establishes |
|---|---|
| G1 | STANCH deployed, address and transaction recorded |
| G2 | CISTERN deployed, registered, `status_of` returns `RUNNING`; an unregistered key returns `UNKNOWN` |
| G5 | A forceful false claim over a healthy reading returns `CLEAR`; the target stays `RUNNING` |
| G6 | A claim whose reading could not be gathered returns `INDETERMINATE`; the target stays `RUNNING` |
| G3 | A claim over a genuinely violated invariant returns `EXPLOIT` and flips the status to `HALTED` |
| G4 | A CISTERN write then reverts, and CISTERN's own `stanch_status()` reads `HALTED` |

Each writes a file under `evidence/studio-next/`, and every address and
transaction hash lands in `evidence/studio-next/deployment.json`.

Then publish the addresses to the interface and the ledger:

```bash
.venv/bin/python -m tools.sync_frontend
```

---

## 4. Tests (G7 support)

Everything that does not need a verdict:

```bash
.venv/bin/gltest tests/test_registry.py -v
.venv/bin/gltest tests/test_no_resume.py tests/test_guard_clause.py -v \
  -k "source or named or written or only_status or accounted or upgraders \
      or writes_succeed or fixed_target"
```

13 passed when this was written. The transcript, including the five tests that
could not run and why, is in `evidence/tests/transcript.txt`.

The source-inspection tests need no network at all and finish instantly:

```bash
.venv/bin/python -m pytest tests/test_no_resume.py \
  -k "source or named or written or only_status or accounted" -q
```

The full suite needs a decided verdict:

```bash
.venv/bin/gltest tests/ -v
```

**This will hang if Studio Next is not deciding non-deterministic transactions.**
Check first — the symptom is a `submit_claim` sitting in `processing` with zero
validator votes while `eth_blockNumber` answers normally:

```bash
.venv/bin/python -m tools.observe_deployment <STANCH address>
```

---

## 5. The interface (G8)

```bash
cp frontend/.env.example frontend/.env
# set NEXT_PUBLIC_CONTRACT_ADDRESS to the STANCH address from
# evidence/studio-next/deployment.json
cd frontend && npm run dev
```

The registry, every verdict record and the proof room must be fully readable
**with no wallet connected**. Only claim submission asks for a signature. If the
contract address is unset or the chain cannot be read, the page says so rather
than rendering a placeholder that looks live.

---

## 6. Reading a deployment back without re-running anything

Every address, transaction and claim in this repository can be re-derived from the
chain. Nothing needs a local log.

```bash
# live state: registry, every claim with its pinned reading, the root slot,
# both vault reports, and a fresh write attempt against a halted target
.venv/bin/python -m tools.observe_deployment 0xe3C5B525a413797F86a2742C9C5d1502045EBC24

# full transaction history per address, with each calldata decoded
.venv/bin/python -m tools.recover_transactions \
  0xe3C5B525a413797F86a2742C9C5d1502045EBC24 \
  0x288aA7651e3260fA13B09bD86c7430FD52585f30 \
  0xCac4C9B43FC343b1D5003Bd400299e12b7db271b \
  0x84E5C85E5C7a44Ed3f3c950C39953A5d70257C60

# join the two into deployment.json and the per-gate evidence files
.venv/bin/python -m tools.assemble_evidence

# regenerate the README gate table and the ledger from what is on disk
.venv/bin/python -m tools.gate_status
.venv/bin/python -m tools.update_ledger
```

`gate_status.py` and `update_ledger.py` are both pure functions of the evidence
files. A ledger row whose evidence file is missing is forced back to `UNMEASURED`
rather than left wherever a human put it, and a gate with no record reads
`NOT YET RUN` rather than being omitted.

---

## 7. Rate limits

Studio Next allows 5000 read requests per hour per client. A full
`run_probes` plus `run_gates all` fits inside that; running both twice in an hour
does not. The error is explicit:

```
Rate limit exceeded: 5000 requests per hour
{"bucket": "read", "window": "hour", "limit": 5000, "retry_after_seconds": ...}
```

`tools/deploy.py` polls every 10 seconds and caches fee estimates to stay inside
the budget. If you hit it, wait out `retry_after_seconds` and re-run; the gate
runner resumes from `evidence/studio-next/deployment.json`.
