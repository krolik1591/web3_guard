import {ethers} from "ethers";


export const FRONT_URL = 'http://192.168.1.103:3000';

export const BOT_TOKEN = '6520715679:AAHarCYuKoMQEUOKkW8_FgAayi8AV5Z7h1s';

export const SECRET = 'PesPatroN'
const networkUrl = "https://bsc-testnet.public.blastapi.io/";

export const provider = new ethers.providers.StaticJsonRpcProvider(networkUrl);
