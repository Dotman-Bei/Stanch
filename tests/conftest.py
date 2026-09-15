import json

import pytest
from gltest import get_contract_factory, get_default_account, get_gl_client

HEALTHY_SPEC = (
    '{"methods": ["total_deposited_units", "total_claimable_units", '
    '"published_invariant"]}'
)
REPORT_SPEC = '{"methods": ["vault_report"]}'
INSUFFICIENT_SPEC = '{"methods": ["published_invariant"]}'
MISSING_SPEC = '{"methods": ["oracle_price_feed_history"]}'

TRUE_PATTERN = (
    "total_claimable exceeds total_deposited, so the vault owes more units than "
    "were ever deposited into it"
)


def fees():
    return get_gl_client().estimate_transaction_fees()


def key_for(request, suffix: str) -> str:
    return f"{request.module.__name__.rsplit('.', 1)[-1]}-{suffix}"


@pytest.fixture(scope="session")
def account():
    return get_default_account()


@pytest.fixture(scope="session")
def stanch(account):
    return get_contract_factory("Stanch").deploy(args=[], account=account, fees=fees())


def _deploy_vault(stanch, account, key, factory_name="Cistern"):
    contract = get_contract_factory(factory_name).deploy(
        args=[stanch.address, key], account=account, fees=fees()
    )
    stanch.register(args=[key, contract.address]).transact(fees=fees())
    contract.deposit(args=[1000]).transact(fees=fees())
    return contract


@pytest.fixture(scope="module")
def running_key(request):
    return key_for(request, "running")


@pytest.fixture(scope="module")
def cistern(stanch, account, running_key):
    """A registered target that stays RUNNING for the whole module.

    Nothing in this fixture halts anything. Tests that need a halted target take
    `halted_cistern`, which deploys its own, so a halt in one test can never
    become a precondition in another.
    """
    return _deploy_vault(stanch, account, running_key)


@pytest.fixture(scope="module")
def halted_key(request):
    return key_for(request, "halted")


@pytest.fixture(scope="module")
def halted_cistern(stanch, account, halted_key):
    contract = _deploy_vault(stanch, account, halted_key)

    for _ in range(6):
        contract.accrue_yield(args=[]).transact(fees=fees())
        report = json.loads(str(contract.vault_report(args=[]).call()))
        if int(report["total_claimable"]) > int(report["total_deposited"]):
            break
    else:
        pytest.fail("could not break the invariant within six accruals")

    stanch.submit_claim(args=[halted_key, REPORT_SPEC, TRUE_PATTERN]).transact(
        fees=fees()
    )
    status = str(stanch.status_of(args=[halted_key]).call())
    if status != "HALTED":
        pytest.fail(
            f"the true claim did not halt the target; status is {status}. "
            "If submit_claim did not decide, see DECISIONS.md D-010."
        )
    return contract
