import fastify, {FastifyReply, FastifyRequest} from "fastify";
import {getBalance, getMsg, recoverSigner} from "./web3";
import cors from "@fastify/cors";
import {ethers} from "ethers";
import {sendInviteLink} from "./bot";

export async function startServer(){
    const app = fastify({ logger: true, trustProxy: true });
    await app.register(cors, { origin: '*' });

    // @ts-ignore
    app.post("/check", checkEndpoint);


    await app.listen({ port: 8080 })
}

export async function checkEndpoint(req: FastifyRequest, res: FastifyReply) {
    const {userId, channelId, tokenAddress, tokenBalance, signature} = req.body as any

    const msgToSign = getMsg(userId, channelId)
    const userAddress = recoverSigner(msgToSign, signature)
    const balanceWei = await getBalance(tokenAddress, userAddress);
    const balance = +ethers.utils.formatEther(balanceWei);
    console.log(balance)
    console.log(userAddress)
    if (balance < tokenBalance){
        return console.log('fuck u cheap freak')
    }
    await sendInviteLink(channelId, userId, userAddress)
}
