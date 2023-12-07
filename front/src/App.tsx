import {
  createWeb3Modal,
  defaultConfig,
  useDisconnect,
  useWeb3Modal,
  useWeb3ModalAccount,
  useWeb3ModalSigner
} from '@web3modal/ethers5/react'
import {useState} from "react";
import {MainButton, useWebApp} from "@vkruglikov/react-telegram-web-app";
import "./style.css"

// todo change
const projectId = "dd03eee94397973a39addb45d848ce3d"
const metadata = {
  name: 'My Website',
  description: 'My Website description',
  url: 'https://mywebsite.com',
  icons: ['https://avatars.mywebsite.com/']
}

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
  const webApp = useWebApp()
  const [isWaitingSign, setIsWaitingSign] = useState(false);

  const searchParams = new URLSearchParams(document.location.search)
  const userid = searchParams.get('userid')

  async function connect() {
    await webApp.expand();
    await open();
  }

  async function sign() {
    if (!signer || !userid) return;

    setIsWaitingSign(true);
    try {
      const signature = await signer.signMessage(userid.toString());

    // todo send signature to backend

    } catch (e: any) {
      webApp.alert("Error:" + e.message);
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

      <MainButton onClick={connect} text={"Connect wallet"}/>
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

    {/*<button id="main_btn" onClick={sign}>Verify wallet</button>*/}
    <MainButton onClick={sign} progress={isWaitingSign} text={"Verify wallet"}/>
  </>


}

export default App;
