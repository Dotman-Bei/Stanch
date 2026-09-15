# { "Depends": "py-genlayer:5jycge4q8k23462jtb0b9fyey1s9qz928sz2nbrd9mg4sxqg2qng" }

# PROBE GOVERNOR - runs P1 through P4 on Studio Next, chain 61997.
#
# THE BLANK LINE ABOVE IS LOAD-BEARING. GenVM treats the contiguous block of
# leading comment lines as its runner header and requires every one of them to
# parse as a JSON directive. A prose comment placed directly under the Depends
# line makes the whole contract fail to load with "invalid_contract runner
# malformed". A blank line terminates the header block. See DECISIONS.md D-004.
#
# THE SDK SURFACE HERE WAS VERIFIED AGAINST THE LIVE RUNNER, not against the
# PRD. See DECISIONS.md D-003. The corrections that matter:
#   gl.get_contract_at  ->  gl.contract.get_at
#   gl.deploy_contract  ->  gl.contract.deploy
#   gl.Contract         ->  gl.contract.Contract
#   DynArray/TreeMap    ->  gl.storage.DynArray / gl.storage.TreeMap
#   u256                ->  gl.u256
#   on="accepted"       ->  on="decided"
#
# P3 is the load-bearing probe. STANCH is buildable if and only if P3 passes.
#
# No exception handling anywhere below. That is deliberate. If a call is not
# supported, the transaction reverts and nothing is written, and the ABSENCE of
# a recorded result plus the transaction receipt is the finding. Swallowing the
# error would turn an unsupported operation into a silent pass, which is the
# exact failure mode this whole project exists to prevent.

import json

import genlayer as gl


class ProbeGovernor(gl.contract.Contract):
    child_code: str
    log: gl.storage.DynArray[str]
    p1_spawned_address: str
    p3_write_result: str

    def __init__(self) -> None:
        self.child_code = ""
        self.p1_spawned_address = ""
        self.p3_write_result = ""

    @gl.public.write
    def set_child_code(self, code: str) -> None:
        self.child_code = str(code)
        self.log.append("CHILD_CODE_SET len=" + str(len(str(code))))

    # ---------------------------------------------------------------- P1
    # Does a contract-initiated deployment produce a REACHABLE contract?
    # An address being returned is not the test. Reading state at that address
    # in a separate call is the test.
    @gl.public.write
    def p1_spawn(self, label: str, salt: str) -> None:
        addr = gl.contract.deploy(
            code=self.child_code.encode("utf-8"),
            args=[str(label)],
            salt_nonce=gl.u256(int(salt)),
            on="finalized",
        )
        self.p1_spawned_address = str(addr)
        self.log.append("P1 SPAWN returned=" + str(addr))

    # ---------------------------------------------------------------- P2
    # Does an asynchronous emitted write reach the callee?
    # This call succeeding proves nothing on its own. Read the TARGET's
    # async_calls afterwards. Issue #20 reports the parent transaction
    # finalizing normally while the callee is never touched.
    @gl.public.write
    def p2_async_call(self, target_hex: str, text: str) -> None:
        gl.contract.get_at(gl.Address(str(target_hex))).emit(on="finalized").note(str(text))
        self.log.append("P2 EMITTED to=" + str(target_hex))

    # ---------------------------------------------------------------- P3a
    # Contract-to-contract synchronous read, inside a WRITE transaction.
    # This is the exact shape of CISTERN's guard clause.
    # If p3_write_result is empty after this runs, check the receipt: the
    # transaction reverted and the architecture in the PRD is falsified.
    @gl.public.write
    def p3_sync_view_in_write(self, target_hex: str) -> None:
        word = gl.contract.get_at(gl.Address(str(target_hex))).view().status_word()
        self.p3_write_result = "READ_OK word=" + str(word)
        self.log.append("P3a " + self.p3_write_result)

    # ---------------------------------------------------------------- P3b
    # The same read from a VIEW, callable with no transaction and no gas.
    # Run this one first. It is the cheapest possible answer to the question
    # that decides whether STANCH gets built.
    @gl.public.view
    def p3_sync_view_in_view(self, target_hex: str) -> str:
        return gl.contract.get_at(gl.Address(str(target_hex))).view().status_word()

    # ---------------------------------------------------------------- P4
    # Does value leave a contract? Decides whether a slashable bond is
    # possible. Issue #20 reports value can be paid IN and never OUT, which
    # strands anything escrowed. STANCH assumes P4 fails and takes no custody.
    @gl.public.write.payable
    def p4_take(self) -> None:
        self.log.append("P4 TOOK " + str(int(gl.message.value)))

    @gl.public.write
    def p4_pay_out(self, to_hex: str, amount_wei: str) -> None:
        amount = gl.u256(int(amount_wei))
        here = gl.contract.get_at(gl.message.contract_address)
        if int(amount) > int(here.balance):
            raise gl.vm.UserError("not enough balance")
        gl.contract.get_at(gl.Address(str(to_hex))).emit_transfer(value=amount)
        self.log.append("P4 PAID " + str(to_hex) + " " + str(int(amount)))

    # ----------------------------------------------------------------
    @gl.public.view
    def state(self) -> str:
        return json.dumps(
            {
                "child_code_len": len(self.child_code),
                "p1_spawned_address": self.p1_spawned_address,
                "p3_write_result": self.p3_write_result,
                "log": list(self.log),
            }
        )
