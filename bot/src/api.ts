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


    await app.listen({ host: "0.0.0.0", port: 8080 })
}

export async function checkEndpoint(req: FastifyRequest, res: FastifyReply) {
    const {userId, channelId, tokenAddress, tokenBalance, signature} = req.body as any

    const msgToSign = getMsg(userId.toString(), channelId.toString(), tokenAddress, tokenBalance.toString())
    console.log(userId, channelId, msgToSign)

    const userAddress = recoverSigner(msgToSign, signature)
    const balance = +(await getBalance(tokenAddress, userAddress));

    console.log(balance)
    console.log(userAddress)

    if (balance < tokenBalance){
        await res.code(402)
        return console.log('fuck u cheap freak')
    }
    await sendInviteLink(channelId, userId, userAddress)

    await res.code(200)

}
