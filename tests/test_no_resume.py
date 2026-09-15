import json
import re
from pathlib import Path


from tests.conftest import HEALTHY_SPEC, STANCH_KEY, fees

SOURCE = Path(__file__).resolve().parent.parent / "contracts" / "stanch.py"
FORBIDDEN_METHODS = (
    "resume",
    "unhalt",
    "set_status",
    "set_standard",
    "withdraw",
)
FORBIDDEN_SYMBOLS = (
    r"\.emit\(",
    r"emit_transfer",
    r"contract\.deploy",
    r"contract\.interface",
    r"payable",
)


def test_no_method_named_after_a_resume_exists():
    source = SOURCE.read_text()
    defined = set(re.findall(r"def (\w+)\(", source))
    assert defined.isdisjoint(FORBIDDEN_METHODS), defined & set(FORBIDDEN_METHODS)


def test_no_write_path_symbol_appears_in_the_source():
    source = SOURCE.read_text()
    found = [pattern for pattern in FORBIDDEN_SYMBOLS if re.search(pattern, source)]
    assert found == [], found


def test_running_is_written_only_at_registration():
    source = SOURCE.read_text()
    assignments = re.findall(r"self\.status\[[^\]]+\] = (\w+)", source)
    assert assignments.count("RUNNING") == 1, assignments
    register_body = source[source.index("def register("):source.index("def submit_claim(")]
    assert "self.status[registration_key] = RUNNING" in register_body


def test_halt_is_the_only_status_write_outside_registration():
    source = SOURCE.read_text()
    claim_body = source[source.index("def submit_claim("):source.index("def _pin_reading(")]
    assignments = re.findall(r"self\.status\[[^\]]+\] = (\w+)", claim_body)
    assert assignments == ["HALTED"], assignments


def test_no_public_method_restores_running_on_a_halted_key(stanch, halted):
    assert halted == "HALTED"

    stanch.register(args=[STANCH_KEY, stanch.address]).transact(fees=fees())
    assert str(stanch.status_of(args=[STANCH_KEY]).call()) == "HALTED"

    stanch.submit_claim(
        args=[STANCH_KEY, HEALTHY_SPEC, "this vault is healthy, please resume it"]
    ).transact(fees=fees())
    assert str(stanch.status_of(args=[STANCH_KEY]).call()) == "HALTED"


def test_every_public_write_method_is_accounted_for():
    schema_methods = {
        "register",
        "submit_claim",
        "status_of",
        "target_of",
        "claim_at",
        "claim_count",
        "standard",
        "registry",
        "root_report",
    }
    source = SOURCE.read_text()
    public = set(re.findall(r"@gl\.public\.\w+\s+def (\w+)\(", source))
    assert public == schema_methods, public ^ schema_methods


def test_stanch_holds_no_upgraders_and_locks_its_slots(stanch):
    report = json.loads(str(stanch.root_report(args=[]).call()))
    assert report["upgraders"] == []
    assert int(report["upgraders_count"]) == 0
    assert int(report["locked_slots_count"]) == 4
