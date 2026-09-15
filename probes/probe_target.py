# { "Depends": "py-genlayer:5jycge4q8k23462jtb0b9fyey1s9qz928sz2nbrd9mg4sxqg2qng" }

#
# PROBE TARGET — adapted from genlayerlabs/genvm-manager issue #20.
#
# THE Depends LINE ABOVE WAS CORRECTED AGAINST THE LIVE CHAIN. See DECISIONS.md
# D-002. Neither the hash in the upstream issue nor the hash in the v2-dev
# boilerplate resolves on Studio Next; both fail with
# a VM_ERROR whose message is: invalid_contract runner malformed
# The hash above is what `py-genlayer:latest` resolved to on Studio Next on
# 2026-09-15, pinned per PRD section 8.
#
# THE SDK SURFACE WAS ALSO CORRECTED. The PRD was written from documentation
# describing `from genlayer import *`, `gl.get_contract_at` and bare `u256`.
# The runner actually installed on Studio Next exposes `import genlayer as gl`,
# `gl.contract.Contract`, `gl.contract.get_at` and `gl.u256`. See DECISIONS.md
# D-003 for the introspection that established this.
#
# This contract exists only to be read and called. It holds no logic worth
# testing. Comments are permitted in probes and forbidden in contracts/.

import json

import genlayer as gl


class ProbeTarget(gl.contract.Contract):
    label: str
    creator: str
    async_calls: gl.u256
    last_caller: str
    last_note: str

    def __init__(self, label: str) -> None:
        self.label = str(label)
        self.creator = gl.message.sender_address.as_hex
        self.async_calls = gl.u256(0)
        self.last_caller = ""
        self.last_note = ""

    # P2 lands here if asynchronous emitted messages execute on Studio Next.
    # If async_calls is still 0 after the governor's p2_async_call, the message
    # was recorded and never consumed.
    @gl.public.write
    def note(self, text: str) -> None:
        self.async_calls = gl.u256(int(self.async_calls) + 1)
        self.last_caller = gl.message.sender_address.as_hex
        self.last_note = str(text)[:200]

    # P3 reads this. It returns a constant on purpose: the probe is testing the
    # transport, not the value. STANCH's real equivalent is status_of(key).
    @gl.public.view
    def status_word(self) -> str:
        return "RUNNING"

    @gl.public.view
    def state(self) -> str:
        return json.dumps(
            {
                "label": self.label,
                "creator": self.creator,
                "async_calls": str(int(self.async_calls)),
                "last_caller": self.last_caller,
                "last_note": self.last_note,
            }
        )
