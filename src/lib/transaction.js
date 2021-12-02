import * as RLP from "@ethersproject/rlp";
import { arrayify, hexlify, isBytesLike, splitSignature, stripZeros } from "@ethersproject/bytes";

const transactionFields = [
    { name: "nonce",    maxLength: 32, numeric: true },
    { name: "gasPrice", maxLength: 32, numeric: true },
    { name: "gasLimit", maxLength: 32, numeric: true },
    { name: "to",          length: 20 },
    { name: "value",    maxLength: 32, numeric: true },
    { name: "data" },
];

export function serialize(transaction, signature) {
    const raw = [];

    transactionFields.forEach(function(fieldInfo) {
        let value = (transaction)[fieldInfo.name] || ([]);
        const options = { };
        if (fieldInfo.numeric) { options.hexPad = "left"; }
        value = arrayify(hexlify(value, options));

        // Fixed-width field
        if (fieldInfo.length && value.length !== fieldInfo.length && value.length > 0) {
            throw new Error("invalid length for " + fieldInfo.name, ("transaction:" + fieldInfo.name), value);
        }

        // Variable-width (with a maximum)
        if (fieldInfo.maxLength) {
            value = stripZeros(value);
            if (value.length > fieldInfo.maxLength) {
                throw new Error("invalid length for " + fieldInfo.name, ("transaction:" + fieldInfo.name), value );
            }
        }

        raw.push(hexlify(value));
    });

    let chainId = 0;
    if (transaction.chainId != null) {
        // A chainId was provided; if non-zero we'll use EIP-155
        chainId = transaction.chainId;

        if (typeof(chainId) !== "number") {
            throw new Error("invalid transaction.chainId", "transaction", transaction);
        }

    } else if (signature && !isBytesLike(signature) && signature.v > 28) {
        // No chainId provided, but the signature is signing with EIP-155; derive chainId
        chainId = Math.floor((signature.v - 35) / 2);
    }

    // We have an EIP-155 transaction (chainId was specified and non-zero)
    if (chainId !== 0) {
        raw.push(hexlify(chainId)); // @TODO: hexValue?
        raw.push("0x");
        raw.push("0x");
    }

    // Requesting an unsigned transaction
    if (!signature) {
        return RLP.encode(raw);
    }

    // The splitSignature will ensure the transaction has a recoveryParam in the
    // case that the signTransaction function only adds a v.
    const sig = splitSignature(signature);

    // We pushed a chainId and null r, s on for hashing only; remove those
    let v = 27 + sig.recoveryParam
    if (chainId !== 0) {
        raw.pop();
        raw.pop();
        raw.pop();
        v += chainId * 2 + 8;

        // If an EIP-155 v (directly or indirectly; maybe _vs) was provided, check it!
        if (sig.v > 28 && sig.v !== v) {
             throw new Error("transaction.chainId/signature.v mismatch", "signature", signature);
        }
    } else if (sig.v !== v) {
         throw new Error("transaction.chainId/signature.v mismatch", "signature", signature);
    }

    raw.push(hexlify(v));
    raw.push(stripZeros(arrayify(sig.r)));
    raw.push(stripZeros(arrayify(sig.s)));
    // special flag for IoTeX native transaction
    raw.push(hexlify(1));

    return RLP.encode(raw);
}
