import {ethers} from "ethers";


export const FRONT_URL = 'http://localhost:3000';

export const BOT_TOKEN = '6520715679:AAHarCYuKoMQEUOKkW8_FgAayi8AV5Z7h1s';

export const SECRET = 'PesPatroN'
const networkUrl = "https://ethereum.publicnode.com";

export const provider = new ethers.providers.StaticJsonRpcProvider(networkUrl);
