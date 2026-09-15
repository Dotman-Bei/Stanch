import json

import pytest
from gltest import get_contract_factory, get_default_account, get_gl_client

STANCH_KEY = "vault-under-test"
HEALTHY_SPEC = (
    '{"methods": ["total_deposited_units", "total_claimable_units", '
    '"published_invariant"]}'
)
REPORT_SPEC = '{"methods": ["vault_report"]}'
INSUFFICIENT_SPEC = '{"methods": ["published_invariant"]}'
MISSING_SPEC = '{"methods": ["oracle_price_feed_history"]}'


def fees():
    return get_gl_client().estimate_transaction_fees()


@pytest.fixture(scope="session")
def account():
    return get_default_account()


@pytest.fixture(scope="session")
def stanch(account):
    return get_contract_factory("Stanch").deploy(args=[], account=account, fees=fees())


@pytest.fixture(scope="session")
def cistern(stanch, account):
    contract = get_contract_factory("Cistern").deploy(
        args=[stanch.address, STANCH_KEY], account=account, fees=fees()
    )
    stanch.register(args=[STANCH_KEY, contract.address]).transact(fees=fees())
    contract.deposit(args=[1000]).transact(fees=fees())
    return contract


@pytest.fixture(scope="session")
def halted(stanch, cistern):
    for _ in range(6):
        cistern.accrue_yield(args=[]).transact(fees=fees())
        parsed = json.loads(str(cistern.vault_report(args=[]).call()))
        if int(parsed["total_claimable"]) > int(parsed["total_deposited"]):
            break
    stanch.submit_claim(
        args=[
            STANCH_KEY,
            REPORT_SPEC,
            "total_claimable exceeds total_deposited, so the vault owes more units "
            "than were ever deposited into it",
        ]
    ).transact(fees=fees())
    return str(stanch.status_of(args=[STANCH_KEY]).call())
