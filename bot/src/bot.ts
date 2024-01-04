import {Markup, Telegraf, Context} from "telegraf";
import {checkDeepLink, getBalance, getMsg, packDeeplink} from "./web3";
import {BOT_TOKEN, FRONT_URL} from "./config";
import {isAddress} from "ethers/lib/utils";
import {channelMode} from "./allow_channel";
import {InlineKeyboardMarkup} from "telegraf/src/core/types/typegram";

export const bot = new Telegraf(BOT_TOKEN);
bot.use(channelMode())

bot.start(async (ctx) => {
    const userId = ctx.from!.id;
    const deepLinkData = ctx.message.text.split(' ')[1]

    if (!deepLinkData)
        // default start response
        return await ctx.sendMessage('Hi!')

    let {channelId, tokenAddress, tokenBalance} = checkDeepLink(deepLinkData);

    const msgToSign = getMsg(userId.toString(), channelId.toString(), tokenAddress, tokenBalance.toString())

    const queryParams = new URLSearchParams({
        userId: userId.toString(),
        channelId: channelId.toString(),
        tokenAddress,
        tokenBalance: tokenBalance.toString(),
        msgToSign
    }).toString();
    console.log(userId.toString(), channelId.toString(), msgToSign)

    const url = `${FRONT_URL}?${queryParams}`

    ctx.sendMessage(url)
    // ctx.reply('Click the button below to verify your address:', Markup.inlineKeyboard([
    //   Markup.button.url('Verify', url)
    // ]));
})


bot.command('create', async (ctx) => {
    let [_, channelId, tokenAddress, tokenBalance] = ctx.message.text.split(' ')

    // validate channelId
    try {
        const rights = await ctx.telegram.getChatMember(channelId, ctx.botInfo.id)
        //@ts-ignore
        if (!rights.can_invite_users)
            return await ctx.sendMessage(`Can't create invite links to chat '${channelId}'`)
    } catch (e) {
        return await ctx.sendMessage(`Can't find me in chat '${channelId}'`)
    }


    // validate tokenAddress
    if (!isAddress(tokenAddress))
        return await ctx.sendMessage(`Wrong token address '${tokenAddress}'`)
    try {
        await getBalance(tokenAddress, "0x0000000000000000000000000000000000000000")
    } catch (e) {
        return await ctx.sendMessage(`Can't verify token address '${tokenAddress}'`)
    }
    tokenAddress = tokenAddress.toLowerCase();

    // validate tokenBalance
    if (isNaN(+tokenBalance)) {
        return await ctx.sendMessage(`Token balance '${tokenBalance}' is NaN`)
    }


    const deeplink = packDeeplink(+channelId, tokenAddress, +tokenBalance)
    const url = `http://t.me/${bot.botInfo?.username}?start=${deeplink}`

    const photoPath = './src/image.jpg'
    const text = 'Click the button below to verify your address:'
    const inlineKeyboard: InlineKeyboardMarkup = {
        inline_keyboard: [
            [Markup.button.url('Verify', url)],
            [
                Markup.button.url('Link1', `https://t.me/${ctx.botInfo?.username}?startgroup=1`),
                Markup.button.url('Link2', `https://t.me/${ctx.botInfo?.username}?startgroup=1`),
            ],
            [
                Markup.button.url('Link3', `https://t.me/${ctx.botInfo?.username}?startgroup=1`),
                Markup.button.url('Link4', `https://t.me/${ctx.botInfo?.username}?startgroup=1`),
            ],
        ],
    };
    ctx.replyWithPhoto({source: photoPath},{caption: text, reply_markup: inlineKeyboard})
})

export async function sendInviteLink(chanelId: number, userId: number, userAddress: string) {
    const link = await bot.telegram.createChatInviteLink(chanelId, {
        member_limit: 1,
        name: `${userId} ${userAddress}`
    })

    await bot.telegram.sendMessage(userId, link.invite_link)
}