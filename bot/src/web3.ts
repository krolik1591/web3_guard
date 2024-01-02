import {ethers} from "ethers";
import {base58, formatUnits, hexlify, keccak256, RLP, toUtf8Bytes, verifyMessage} from "ethers/lib/utils";
import {provider, SECRET} from "./config";
import {channel} from "diagnostics_channel";

const tokenAbi = [
    "function balanceOf(address) view returns (uint)",
    "function decimals() view returns (uint8)",
];


export async function getBalance(tokenAddress: string, address: string) {
    const token = new ethers.Contract(tokenAddress, tokenAbi, provider);
    const decimals = await token.decimals();
    const balance = await token.balanceOf(address);
    return +formatUnits(balance, decimals)
}

export function getMsg(...data: string[]) {
    const msg = data.join('') + SECRET
    return keccak256(toUtf8Bytes(msg))
}


export function recoverSigner(msgToSign: string, signature: string) {
    return verifyMessage(toUtf8Bytes(msgToSign), signature)
}


export function packDeeplink(channelId: number, tokenAddress: string, tokenBalance: number) {
    channelId = channelId + 1e15 // negative numbers doesn't encode well
    tokenAddress = tokenAddress.toLowerCase()

    const hash = getMsg(hexlify(channelId), tokenAddress, hexlify(tokenBalance)).slice(0, 18)  // first 8 bytes
    const packed = RLP.encode([hexlify(channelId), hexlify(tokenBalance), tokenAddress, hash]);
    // console.log("PACK", [hexlify(channelId), hexlify(tokenBalance), tokenAddress, hash])
    return base58.encode(packed)
}

export function checkDeepLink(deepLinkData: string) {
    const decoded = base58.decode(deepLinkData);
    let [channelId, tokenBalance, tokenAddress, hash] = RLP.decode(decoded)

    // console.log("CHECK", [channelId, tokenBalance, tokenAddress, hash])

    const verifyHash = getMsg(channelId, tokenAddress, tokenBalance).slice(0, 18)  // first 8 bytes
    if (hash != verifyHash) {
        console.warn("wrong hash", hash, verifyHash)
        throw "wrong hash";
    }

    channelId -= 1e15; // undo magic from encode

    return {
        channelId: +channelId,
        tokenAddress,
        tokenBalance: +tokenBalance,
    }
}


function test(channelId1: number, tokenAddress1: string, tokenBalance1: number) {
    const packed = packDeeplink(channelId1, tokenAddress1, tokenBalance1);
    const {channelId, tokenAddress, tokenBalance} = checkDeepLink(packed);
    console.log({channelId, tokenAddress, tokenBalance})
    console.assert(channelId1 == channelId, "channel")
    console.assert(tokenAddress1 == tokenAddress, "token addr")
    console.assert(tokenBalance1 == tokenBalance, "token balance")

}

// test(357108179, "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", 99999999999)
// test(-1002031460106, "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", 99999999999)
