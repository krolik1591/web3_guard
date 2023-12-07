import {ethers} from "ethers";

const networkUrl = "https://ethereum.publicnode.com";
const provider = new ethers.providers.StaticJsonRpcProvider(networkUrl);

const tokenAbi = ["function balanceOf(address) view returns (uint)"];
const tokenAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
const token = new ethers.Contract(tokenAddress, tokenAbi, provider);


export async function recoverAddress(message: string, signature: string) {
  const msgHash = ethers.utils.hashMessage(message);
  const msgHashBytes = ethers.utils.arrayify(msgHash);

  return ethers.utils.recoverAddress(msgHashBytes, signature);
}

export async function getBalance(address: string) {
  return await token.balanceOf(address);
}
