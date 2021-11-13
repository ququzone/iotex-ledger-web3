import { Component } from "react";
import Transport from "@ledgerhq/hw-transport-webusb";
import Eth from "@ledgerhq/hw-app-eth";
import { ethers, utils, BigNumber } from 'ethers';

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
        const eth = new Eth(transport)
        try {
            const result = await eth.getAddress("44'/60'/0'/0/0")
            this.setState({
                connectd: true,
                address: result.address,
                eth: eth,
            })
        } catch (err) {
            console.log(`fail to connect ledger: ${err}`)
        }
    }

    handleTransfer = async () => {
        const provider = new ethers.providers.JsonRpcProvider(
            'https://babel-api.mainnet.iotex.io'
        );
        const nonce = await provider.getTransactionCount(this.state.address)

        const transaction = {
            to: "0x173553c179bbf5af39D8Db41F0B60e4Fc631066a",
            nonce: nonce,
            gasLimit: 10000,
            gasPrice: BigNumber.from("1000000000000"),
            data: "0x",
            value: utils.parseEther("1.0"),
            chainId: 4689
        }

        const signature = await this.state.eth.signTransaction("44'/60'/0'/0/0", utils.serializeTransaction(transaction).slice(2))

        const result = await provider.sendTransaction(utils.serializeTransaction(transaction, {
            r: `0x${signature.r}`,
            s: `0x${signature.s}`,
            v: BigNumber.from(`0x${signature.v}`).toNumber(),
        }))
        this.setState({
            transferred: true,
            transferHash: result.hash,
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
                <p>Make sure unlock ledger and open ethereum app</p>
                {connectInfo}
                {transferInfo}
            </div>
        );
    }
}

export default Ledger
