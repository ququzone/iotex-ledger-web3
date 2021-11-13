import { Component } from "react";
import Transport from "@ledgerhq/hw-transport-webusb";
import Eth from "@ledgerhq/hw-app-eth";

class Ledger extends Component {
    constructor(props) {
        super(props);
        this.state = {
            connectd: false,
            address: undefined
        };
    }

    handleConnect = async () => {
        const transport = await Transport.create()
        const eth = new Eth(transport)
        try {
            const result = await eth.getAddress("44'/60'/0'/0/0")
            this.setState({
                connectd: true,
                address: result.address
            })
        } catch (err) {
            console.log(`fail to connect ledger: ${err}`)
        }
    }

    connectInfo = () => {
        if (this.state.connectd) {
            <p>Connected to {this.state.address}</p>
        } else {
            <p><button onClick={this.handleConnect}>Connect</button></p>
        }
    }

    render = () => {
        let connectInfo;
        if (this.state.connectd) {
            connectInfo = <p>Connected to {this.state.address}</p>
        } else {
            connectInfo = <p><button onClick={this.handleConnect}>Connect</button></p>
        }
        return (
            <div>
                <p>Make sure unlock ledger and open ethereum app</p>
                {connectInfo}
            </div>
        );
    }
}

export default Ledger
