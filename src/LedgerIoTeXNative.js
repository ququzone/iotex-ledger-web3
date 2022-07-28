import { Component } from "react";
import Transport from "@ledgerhq/hw-transport-webusb";
import { IoTeXApp } from "./lib/iotex_ledger";

import { publicKeyToAddress } from "iotex-antenna/lib/crypto/crypto";
import { SealedEnvelop } from "iotex-antenna/lib/action/envelop";
import Antenna from "iotex-antenna";

class LedgerSigner {
    constructor(iotex, address, publicKey) {
        this.iotex = iotex;
        this.publicKey = publicKey;
        this.address = address;
    }

    async signOnly(envelop) {
        const signed = await this.iotex.sign([44, 304, 0, 0, 0], envelop.bytestream());
        if (signed.code !== 36864) {
            throw new Error(signed.message || "ledger error");
        }
        return new SealedEnvelop(envelop, this.publicKey, signed.signature);
    }

    async getAccount(address) {
        return {address: address};
    }

    async signMessage(message) {
        const signed = await this.iotex.signMessage([44, 304, 0, 0, 0], message);
        if (signed.code !== 36864) {
            throw new Error(signed.message || "ledger error");
        }
        return signed.signature;
    }
}

class Ledger extends Component {
    constructor(props) {
        super(props);
        this.state = {
            connectd: false,
            address: undefined,
            eth: undefined,
        };
    }

    handleConnect = async () => {
        const transport = await Transport.create()
        const iotex = new IoTeXApp(transport)
        try {
            const result = await iotex.publicKey([44, 304, 0, 0, 0])
            const address = publicKeyToAddress(result.publicKey)
            this.setState({
                connectd: true,
                address: address,
                publicKey: result.publicKey,
                iotex: iotex,
            })
        } catch (err) {
            console.log(`fail to connect ledger: ${err}`)
        }
    }

    handleTransfer = async () => {
        const antenna = new Antenna(
            "http://api.testnet.iotex.one:80",
            2, 
            {signer: new LedgerSigner(this.state.iotex, this.state.address, this.state.publicKey)}
        );

        const hash = await antenna.iotx.sendTransfer({
            from: this.state.address,
            to: "io1zu648steh0667wwcmdqlpdswflrrzpn2c3cu00",
            value: "1000000000000000000",
            gasPrice: "1000000000000",
            gasLimit: "10000",
        });
        this.setState({
            transferred: true,
            transferHash: hash,
        })
    }

    render = () => {
        let connectInfo;
        if (this.state.connectd) {
            connectInfo = (
                <div>
                    <p>Connected to {this.state.address}</p>
                    <p><button onClick={this.handleTransfer}>Transfer one token</button></p>
                </div>
            )
        } else {
            connectInfo = <p><button onClick={this.handleConnect}>Connect</button></p>
        }
        let transferInfo;
        if (this.state.transferred) {
            transferInfo = (
                <div>
                    <p>Send transaction successful {this.state.transferHash}</p>
                </div>
            )
        }
        return (
            <div>
                <p>Make sure unlock ledger and open iotex app</p>
                {connectInfo}
                {transferInfo}
            </div>
        );
    }
}

export default Ledger
