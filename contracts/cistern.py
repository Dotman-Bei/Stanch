# { "Depends": "py-genlayer:5jycge4q8k23462jtb0b9fyey1s9qz928sz2nbrd9mg4sxqg2qng" }

import json

import genlayer as gl

INVARIANT = "total_claimable must never exceed total_deposited"


class Cistern(gl.contract.Contract):
    stanch_address: str
    stanch_key: str
    claims: gl.storage.TreeMap[str, gl.u256]
    total_deposited: gl.u256
    total_claimable: gl.u256
    accrual_calls: gl.u256

    def __init__(self, stanch_address: str, stanch_key: str) -> None:
        self.stanch_address = gl.Address(str(stanch_address)).as_hex
        self.stanch_key = str(stanch_key)
        self.total_deposited = gl.u256(0)
        self.total_claimable = gl.u256(0)
        self.accrual_calls = gl.u256(0)

    def _assert_running(self) -> None:
        word = gl.contract.get_at(gl.Address(self.stanch_address)).view().status_of(self.stanch_key)
        if str(word) != "RUNNING":
            raise gl.vm.UserError("STANCH_HALTED")

    @gl.public.write
    def deposit(self, units: int) -> None:
        self._assert_running()
        amount = int(units)
        if amount <= 0:
            raise gl.vm.UserError("NON_POSITIVE_UNITS")
        holder = gl.message.sender_address.as_hex
        current = int(self.claims[holder]) if holder in self.claims else 0
        self.claims[holder] = gl.u256(current + amount)
        self.total_deposited = gl.u256(int(self.total_deposited) + amount)
        self.total_claimable = gl.u256(int(self.total_claimable) + amount)

    @gl.public.write
    def withdraw(self, units: int) -> None:
        self._assert_running()
        amount = int(units)
        holder = gl.message.sender_address.as_hex
        current = int(self.claims[holder]) if holder in self.claims else 0
        if amount <= 0 or amount > current:
            raise gl.vm.UserError("AMOUNT_EXCEEDS_CLAIM")
        self.claims[holder] = gl.u256(current - amount)
        self.total_claimable = gl.u256(int(self.total_claimable) - amount)
        backing = int(self.total_deposited)
        self.total_deposited = gl.u256(backing - amount if backing >= amount else 0)

    @gl.public.write
    def accrue_yield(self) -> None:
        self._assert_running()
        holder = gl.message.sender_address.as_hex
        current = int(self.claims[holder]) if holder in self.claims else 0
        if current <= 0:
            raise gl.vm.UserError("NOTHING_TO_ACCRUE")
        bonus = current // 4
        if bonus <= 0:
            bonus = 1
        self.claims[holder] = gl.u256(current + bonus)
        self.total_claimable = gl.u256(int(self.total_claimable) + bonus)
        self.accrual_calls = gl.u256(int(self.accrual_calls) + 1)

    @gl.public.view
    def total_deposited_units(self) -> str:
        return str(int(self.total_deposited))

    @gl.public.view
    def total_claimable_units(self) -> str:
        return str(int(self.total_claimable))

    @gl.public.view
    def claim_of(self, holder: str) -> str:
        address = gl.Address(str(holder)).as_hex
        return str(int(self.claims[address])) if address in self.claims else "0"

    @gl.public.view
    def published_invariant(self) -> str:
        return INVARIANT

    @gl.public.view
    def vault_report(self) -> str:
        deposited = int(self.total_deposited)
        claimable = int(self.total_claimable)
        return json.dumps(
            {
                "invariant": INVARIANT,
                "total_deposited": str(deposited),
                "total_claimable": str(claimable),
                "excess_claimable": str(claimable - deposited if claimable > deposited else 0),
                "accrual_calls": str(int(self.accrual_calls)),
                "stanch": self.stanch_address,
                "stanch_key": self.stanch_key,
            },
            sort_keys=True,
        )

    @gl.public.view
    def stanch_status(self) -> str:
        return str(
            gl.contract.get_at(gl.Address(self.stanch_address)).view().status_of(self.stanch_key)
        )
