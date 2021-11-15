import { bech32 } from "bech32";

class Address {
    static ADDRESS_LENGTH = 20;
    static PREFIX = "io";

    constructor(payload) {
        this.payload = payload;
    }

    string() {
        const grouped = bech32.toWords(this.payload);
        return bech32.encode(Address.PREFIX, grouped);
    }

    stringEth() {
        return `0x${Buffer.from(this.payload).toString("hex")}`;
    }

    bytes() {
        return this.payload;
    }
}

export function fromEthereum(addrStr) {
    if (addrStr.startsWith("0x")) {
        addrStr = addrStr.substring(2);
    }
    const bytes = Buffer.from(addrStr, "hex");
    return fromBytes(bytes);
}

export function fromBytes(bytes) {
    if (bytes.length !== Address.ADDRESS_LENGTH) {
        throw new Error(`invalid address length in bytes: ${bytes.length}`);
    }
    const addr = new Address(bytes);
    return addr;
}

export function fromString(addrStr) {
    const { prefix, words } = bech32.decode(addrStr);
    if (prefix !== Address.PREFIX) {
        throw new Error(
            `hrp ${prefix} and address prefix ${Address.PREFIX} don't match`
        );
    }
    // @ts-ignore
    const addr = new Address(bech32.fromWords(words));
    return addr;
}

export function from(addr) {
    if (addr.startsWith(Address.PREFIX)) {
        return fromString(addr);
    }
    if (addr.startsWith("0x")) {
        return fromEthereum(addr);
    }
    throw new Error("unknow address format");
}
