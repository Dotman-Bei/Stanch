import copy
import json
import os
from pathlib import Path

from dotenv import load_dotenv
from genlayer_py import create_account, create_client, generate_private_key
from genlayer_py.chains import studio_devnet

ROOT = Path(__file__).resolve().parent.parent
ENV_PATH = ROOT / ".env"

RPC_URL = "https://studio-next.genlayer.com/api"
EXPLORER_URL = "https://explorer-studio-dev.genlayer.com"
CHAIN_ID = 61997

studio_next = copy.deepcopy(studio_devnet)
studio_next.name = "GenLayer Studio Next"
studio_next.rpc_urls = {"default": {"http": [RPC_URL]}}
studio_next.block_explorers = {
    "default": {"name": "GenLayer Studio Explorer", "url": EXPLORER_URL}
}


def load_or_create_key() -> str:
    load_dotenv(ENV_PATH)
    key = os.environ.get("STANCH_PRIVATE_KEY")
    if key:
        return key
    key = "0x" + generate_private_key().hex()
    with ENV_PATH.open("a") as handle:
        handle.write(f"STANCH_PRIVATE_KEY={key}\n")
    return key


def client():
    account = create_account(load_or_create_key())
    gl = create_client(chain=studio_next, account=account)
    gl.initialize_consensus_smart_contract()
    return gl


def fund(gl, address: str, amount_wei: int) -> dict:
    return gl.provider.make_request(method="sim_fundAccount", params=[address, amount_wei])


def balance(gl, address: str) -> int:
    return int(gl.get_balance(address))


def explorer_tx(tx_hash: str) -> str:
    return f"{EXPLORER_URL}/tx/{tx_hash}"


def explorer_address(address: str) -> str:
    return f"{EXPLORER_URL}/address/{address}"
