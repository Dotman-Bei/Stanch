from tools.studio_next import ENV_PATH, balance, client, fund, load_or_create_key

MINIMUM = 40 * 10**18
TOP_UP = 500 * 10**18


def main() -> None:
    key = load_or_create_key()
    print(f"account key in {ENV_PATH} ({'reused' if key else 'created'})")
    gl = client()
    address = gl.local_account.address
    print("address:", address)
    current = balance(gl, address)
    print("balance:", current)
    if current < MINIMUM:
        fund(gl, address, TOP_UP)
        print("funded :", balance(gl, address))
    print("\nready. Studio Next, chain", gl.chain.id)


if __name__ == "__main__":
    main()
