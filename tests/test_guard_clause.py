import json

from gltest import get_contract_factory
from gltest.assertions import tx_execution_failed, tx_execution_succeeded

from tests.conftest import fees, key_for


def test_writes_succeed_while_running(stanch, cistern, running_key):
    assert str(stanch.status_of(args=[running_key]).call()) == "RUNNING"
    assert tx_execution_succeeded(cistern.deposit(args=[10]).transact(fees=fees()))


def test_target_refuses_its_own_writes_once_halted(stanch, halted_cistern, halted_key):
    assert str(stanch.status_of(args=[halted_key]).call()) == "HALTED"
    assert str(halted_cistern.stanch_status(args=[]).call()) == "HALTED"

    for method, args in (("deposit", [10]), ("withdraw", [1]), ("accrue_yield", [])):
        receipt = getattr(halted_cistern, method)(args=args).transact(fees=fees())
        assert tx_execution_failed(receipt), method


def test_views_still_read_after_a_halt(halted_cistern):
    report = json.loads(str(halted_cistern.vault_report(args=[]).call()))
    assert int(report["total_claimable"]) > int(report["total_deposited"])
    assert report["invariant"] == "total_claimable must never exceed total_deposited"


def test_the_fixed_target_refuses_the_accrual_that_broke_the_demo(
    stanch, account, request
):
    key = key_for(request, "control")
    fixed = get_contract_factory("CisternFixed").deploy(
        args=[stanch.address, key], account=account, fees=fees()
    )
    stanch.register(args=[key, fixed.address]).transact(fees=fees())
    fixed.deposit(args=[1000]).transact(fees=fees())

    assert tx_execution_failed(fixed.accrue_yield(args=[]).transact(fees=fees()))

    report = json.loads(str(fixed.vault_report(args=[]).call()))
    assert int(report["total_claimable"]) <= int(report["total_deposited"])
