from gltest.assertions import tx_execution_failed

from tests.conftest import fees


def test_unregistered_key_reads_unknown_not_running(stanch):
    assert str(stanch.status_of(args=["a-key-nobody-bound"]).call()) == "UNKNOWN"


def test_registration_binds_and_reports_running(stanch, cistern, running_key):
    assert str(stanch.status_of(args=[running_key]).call()) == "RUNNING"
    assert str(stanch.target_of(args=[running_key]).call()).lower() == cistern.address.lower()


def test_rebinding_a_key_is_refused(stanch, cistern, running_key):
    receipt = stanch.register(args=[running_key, stanch.address]).transact(fees=fees())
    assert tx_execution_failed(receipt)
    assert str(stanch.target_of(args=[running_key]).call()).lower() == cistern.address.lower()


def test_empty_key_is_refused(stanch, cistern):
    receipt = stanch.register(args=["", cistern.address]).transact(fees=fees())
    assert tx_execution_failed(receipt)


def test_target_reads_its_own_status_through_stanch(cistern):
    assert str(cistern.stanch_status(args=[]).call()) == "RUNNING"
