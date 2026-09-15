import sys

from tools.studio_next import client

DEPENDS = '# { "Depends": "py-genlayer:5jycge4q8k23462jtb0b9fyey1s9qz928sz2nbrd9mg4sxqg2qng" }\n'

TEMPLATE = DEPENDS + '''
import genlayer as gl

_mark = "INTRO" + "SPECT"
_probe = {expr}
raise Exception(_mark + "<<" + repr(_probe) + ">>")


class Dummy(gl.contract.Contract):
    def __init__(self) -> None:
        pass
'''


def introspect(expr: str) -> str:
    gl = client()
    code = TEMPLATE.replace("{expr}", expr)
    try:
        gl.get_contract_schema_for_code(contract_code=code.encode())
        return "NO ERROR RAISED"
    except Exception as exc:
        text = str(exc)
        marker = "INTROSPECT<<"
        start = text.rfind(marker)
        if start == -1:
            return text[:4000]
        end = text.find(">>", start)
        return text[start + len(marker) : end]


if __name__ == "__main__":
    print(introspect(sys.argv[1]))
