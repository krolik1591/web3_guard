import {Markup, Telegraf} from "telegraf";
import {checkDeepLink, getMsg, packDeeplink} from "./web3";
import {BOT_TOKEN, FRONT_URL} from "./config";

export const bot = new Telegraf(BOT_TOKEN);

bot.start((ctx: any) => {
    const userId = ctx.from.id;
    const deepLinkData = ctx.message.text.split(' ')[1]
    if (!deepLinkData)
        return ctx.sendMessage('Hi!')

    const {channelId, tokenAddress, tokenBalance} = checkDeepLink(deepLinkData);

    const msgToSign = getMsg(userId, channelId.toString(), tokenAddress, tokenBalance.toString())

    const queryParams = new URLSearchParams({
        userId, channelId: channelId.toString(), tokenAddress,
        tokenBalance: tokenBalance.toString(), msgToSign
    }).toString();
    const url = `${FRONT_URL}?${queryParams}`

    ctx.sendMessage(url)
    // ctx.reply('Click the button below to verify your address:', Markup.inlineKeyboard([
    //   Markup.button.url('Verify', url)
    // ]));
})

bot.command('create', (ctx) => {
    const [_, channelId, tokenAddress, tokenBalance] = ctx.message.text.split(' ')

    const deeplink = packDeeplink(+channelId, tokenAddress, +tokenBalance)
    const url = `http://t.me/${bot.botInfo?.username}?start=${deeplink}`

    ctx.reply('Click the button below to verify your address:', Markup.inlineKeyboard([
        Markup.button.url('Verify', url)
    ]));
})

export async function sendInviteLink(chanelId: number, userId: number, userAddress: string) {
    const link = await bot.telegram.createChatInviteLink(chanelId, {
        member_limit: 1,
        name: `${userId} ${userAddress}`
    })

    await bot.telegram.sendMessage(userId, link.invite_link)
}