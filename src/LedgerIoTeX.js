import { Component } from "react";
import Transport from "@ledgerhq/hw-transport-webusb";
import { IoTeXApp } from "./lib/iotex_ledger";
import { ethers, utils, BigNumber } from 'ethers';
import { from } from "./lib/iotex_address";
import action from "./lib/action_pb";
import { serialize } from "./lib/transaction";

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
            const address = utils.computeAddress(result.publicKey)
            this.setState({
                connectd: true,
                address: address,
                iotex: iotex,
            })
        } catch (err) {
            console.log(`fail to connect ledger: ${err}`)
        }
    }

    handleTransfer = async () => {
        const provider = new ethers.providers.JsonRpcProvider(
            'https://babel-ledger.onrender.com'
        );
        const nonce = await provider.getTransactionCount(this.state.address)

        const transaction = {
            to: "0x173553c179bbf5af39D8Db41F0B60e4Fc631066a",
            nonce: nonce,
            gasLimit: 10000,
            gasPrice: BigNumber.from("1000000000000"),
            data: "0x",
            value: BigNumber.from('1000000000000000000'),
            chainId: 4689
        }

        let isContract = false
        if (transaction.to !== "") {
            isContract = (await provider.getCode(transaction.to)) !== "0x"
        }

        const act = new action.ActionCore();
        act.setVersion(1);
        act.setNonce(Number(transaction.nonce));
        act.setGaslimit(Number(transaction.gasLimit));
        act.setGasprice(transaction.gasPrice.toString());
        act.setChainid(0);
        if (isContract) {
            const pbExecution = new action.Execution();
            pbExecution.setAmount(transaction.value.toString());
            if (transaction.to === "") {
                pbExecution.setContract("");
            } else {
                pbExecution.setContract(from(transaction.to).string());
            }
            pbExecution.setData(Buffer.from(transaction.data.slice(2), "hex"));

            act.setExecution(pbExecution);
        } else {
            const pbTransfer = new action.Transfer();
            pbTransfer.setAmount(transaction.value.toString());
            pbTransfer.setRecipient(from(transaction.to).string());
            pbTransfer.setPayload(Buffer.from(transaction.data.slice(2), "hex"));

            act.setTransfer(pbTransfer);
        }
        const signature = await this.state.iotex.sign([44, 304, 0, 0, 0], act.serializeBinary());

        console.log(serialize(transaction, signature.signature));

        const result = await provider.sendTransaction(serialize(transaction, signature.signature))
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
                <p>Make sure unlock ledger and open iotex app</p>
                {connectInfo}
                {transferInfo}
            </div>
        );
    }
}

export default Ledger
