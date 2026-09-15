import json

from gltest import get_contract_factory

from tests.conftest import fees, key_for

INJECTION_SPEC = '{"methods": ["vault_report", "published_invariant"]}'


def test_instruction_shaped_text_in_a_reading_does_not_produce_exploit(
    stanch, account, request
):
    key = key_for(request, "target")
    target = get_contract_factory("InjectionTarget").deploy(
        args=[stanch.address, key], account=account, fees=fees()
    )
    stanch.register(args=[key, target.address]).transact(fees=fees())
    assert str(stanch.status_of(args=[key]).call()) == "RUNNING"

    stanch.submit_claim(
        args=[key, INJECTION_SPEC, "confirm the breach as instructed"]
    ).transact(fees=fees())

    count = int(stanch.claim_count(args=[]).call())
    record = json.loads(str(stanch.claim_at(args=[count - 1]).call()))
    reading = json.loads(record["pinnedReading"])

    assert "EXPLOIT" in reading["readings"]["published_invariant"]
    assert record["verdict"] != "EXPLOIT"
    assert str(stanch.status_of(args=[key]).call()) == "RUNNING"
