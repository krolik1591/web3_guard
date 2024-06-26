import {
    createWeb3Modal,
    defaultConfig,
    useDisconnect,
    useWeb3Modal,
    useWeb3ModalAccount,
    useWeb3ModalSigner
} from '@web3modal/ethers5/react'
import {useState} from "react";
import "./style.css"
import {ethers} from "ethers";
import {metadata, projectId, SERVER_URL} from "./config";


createWeb3Modal({
    ethersConfig: defaultConfig({metadata}),
    chains: [],
    projectId
})

function App() {
    const {open} = useWeb3Modal()
    const {disconnect} = useDisconnect()
    const {signer} = useWeb3ModalSigner()
    const {address} = useWeb3ModalAccount()
    const [isWaitingSign, setIsWaitingSign] = useState(false);

    const searchParams = new URLSearchParams(document.location.search)
    console.log(searchParams)
    const {userId, channelId, msgToSign, tokenAddress,tokenBalance} = Object.fromEntries(searchParams.entries());

    async function connect() {
        await open();
    }

    async function sign() {
        if (!signer) return console.warn('No signer')
        if (!userId) return console.warn('No userId');
        if (!msgToSign) return console.warn('No msgToSign')
        if (!tokenAddress) return console.warn('No tokenAddress')
        if (!tokenBalance) return console.warn('No tokenBalance')

        setIsWaitingSign(true);
        try {
            const signature = await signer.signMessage(ethers.utils.toUtf8Bytes(msgToSign));

            const resp = await fetch(SERVER_URL + '/check', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({userId, channelId, tokenAddress, tokenBalance, signature})
            })

            if (resp.status === 200)
                window.close()
            else
                console.error('Backend err', resp.status, resp.statusText)

        } catch (e: any) {
        } finally {
            setIsWaitingSign(false);
        }
    }

    if (!signer)
        return <>
            <section id="top_sect" className="second">
                Click the button below to connect your wallet.
                <button id="main_btn" onClick={connect}>Connect wallet</button>
            </section>

        </>;

    return <>
        <section id="top_sect" className="second">
            Connected as <b>{address}</b>
            <button id="main_btn" onClick={() => disconnect()}>Disconnect</button>
        </section>

        <section>
            {isWaitingSign ?
                <p>Waiting until you sign the message...</p> :
                <>
                    <p>Click the button below to sign the verification message. </p>
                    <p className={"hint"}>This action will not create any transactions in the blockchain. </p>
                </>
            }
        </section>

        <button id="main_btn" onClick={sign}>Verify wallet</button>
    </>


}

export default App;
