import json

from gltest.assertions import tx_execution_failed, tx_execution_succeeded

from tests.conftest import STANCH_KEY, fees


def test_writes_succeed_while_running(stanch, cistern):
    assert str(stanch.status_of(args=[STANCH_KEY]).call()) == "RUNNING"
    receipt = cistern.deposit(args=[10]).transact(fees=fees())
    assert tx_execution_succeeded(receipt)


def test_target_refuses_its_own_writes_once_halted(stanch, cistern, halted):
    assert halted == "HALTED"
    assert str(cistern.stanch_status(args=[])) != "RUNNING"

    for method, args in (
        ("deposit", [10]),
        ("withdraw", [1]),
        ("accrue_yield", []),
    ):
        receipt = getattr(cistern, method)(args=args).transact(fees=fees())
        assert tx_execution_failed(receipt), method


def test_views_still_read_after_a_halt(cistern, halted):
    report = json.loads(str(cistern.vault_report(args=[]).call()))
    assert int(report["total_claimable"]) > int(report["total_deposited"])
    assert report["invariant"] == "total_claimable must never exceed total_deposited"


def test_the_fixed_target_refuses_the_accrual_that_broke_the_demo(stanch, account):
    from gltest import get_contract_factory

    key = "fixed-control-under-test"
    fixed = get_contract_factory("CisternFixed").deploy(
        args=[stanch.address, key], account=account, fees=fees()
    )
    stanch.register(args=[key, fixed.address]).transact(fees=fees())
    fixed.deposit(args=[1000]).transact(fees=fees())

    receipt = fixed.accrue_yield(args=[]).transact(fees=fees())
    assert tx_execution_failed(receipt)

    report = json.loads(str(fixed.vault_report(args=[]).call()))
    assert int(report["total_claimable"]) <= int(report["total_deposited"])
