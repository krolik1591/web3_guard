import {Markup, Telegraf} from "telegraf";
import {checkDeepLink, getMsg, packDeeplink} from "./web3";

export const bot = new Telegraf('6520715679:AAHarCYuKoMQEUOKkW8_FgAayi8AV5Z7h1s');

bot.start((ctx: any) => {
    const userId = ctx.from.id;
    const deepLinkData = ctx.message.text.split(' ')[1]
    if (!deepLinkData)
        return ctx.sendMessage('Hi!')

    const {channelId, tokenAddress, tokenBalance} = checkDeepLink(deepLinkData);

    const msgToSign = getMsg(userId, channelId, tokenAddress, tokenBalance.toString())
    const queryParams = new URLSearchParams({userId, channelId, tokenAddress, tokenBalance, msgToSign}).toString();
    const url = `http://localhost:3000?${queryParams}`

    ctx.sendMessage(url)
    // ctx.reply('Click the button below to verify your address:', Markup.inlineKeyboard([
    //   Markup.button.url('Verify', "https://localhost:3000/")
    // ]));
})

bot.command('create', (ctx) => {
    const channelId = ctx.chat.id
    const [_, tokenAddress, tokenBalance] = ctx.message.text.split(' ')

  console.log(channelId, tokenAddress, tokenBalance)
    const deeplink = packDeeplink(channelId, tokenAddress, +tokenBalance)
    const url = `http://t.me/${bot.botInfo?.username}?start=${deeplink}`

    console.log(deeplink)
    ctx.reply('Click the button below to verify your address:', Markup.inlineKeyboard([
        Markup.button.url('Verify', url)
    ]));
})

export async function sendInviteLink(chanelId: number, userId: number, userAddress: string){
    const link = await bot.telegram.createChatInviteLink(-1002031460106, {
        member_limit: 1,
        name: `${userId} ${userAddress}`
    })

    await bot.telegram.sendMessage(userId, link.invite_link)
}