from gltest.assertions import tx_execution_failed, tx_execution_succeeded

from tests.conftest import STANCH_KEY, fees


def test_unregistered_key_reads_unknown_not_running(stanch):
    assert str(stanch.status_of(args=["a-key-nobody-bound"]).call()) == "UNKNOWN"


def test_registration_binds_and_reports_running(stanch, cistern):
    assert str(stanch.status_of(args=[STANCH_KEY]).call()) == "RUNNING"
    assert str(stanch.target_of(args=[STANCH_KEY]).call()).lower() == cistern.address.lower()


def test_rebinding_a_key_is_refused(stanch, cistern, account):
    other = get_other_address(cistern)
    receipt = stanch.register(args=[STANCH_KEY, other]).transact(fees=fees())
    assert tx_execution_failed(receipt)
    assert str(stanch.target_of(args=[STANCH_KEY]).call()).lower() == cistern.address.lower()


def test_empty_key_is_refused(stanch, cistern):
    receipt = stanch.register(args=["", cistern.address]).transact(fees=fees())
    assert tx_execution_failed(receipt)


def test_target_reads_its_own_status_through_stanch(cistern):
    assert str(cistern.stanch_status(args=[]).call()) == "RUNNING"


def get_other_address(cistern) -> str:
    tail = cistern.address[-1]
    replacement = "0" if tail != "0" else "1"
    return cistern.address[:-1] + replacement
