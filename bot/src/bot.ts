import {Context, Markup, session, Telegraf} from "telegraf";
import {checkDeepLink, getBalance, getMsg, packDeeplink} from "./web3";
import {BOT_TOKEN, FRONT_URL} from "./config";
import {isAddress} from "ethers/lib/utils";
import {channelMode} from "./allow_channel";
import {InlineKeyboardMarkup} from "telegraf/src/core/types/typegram";
import {message} from "telegraf/filters";
import {inlineKeyboard} from "telegraf/typings/markup";


interface SessionData {
    text: string,
    entities: any,
    tokenAddress: string,
    tokenBalance: number,
    chatInviteTo: number,
    chatInviteFrom: number,
    additionalBtns: [string, string][],
    photoFileId?: string,
    state: string,
    msgId?: number
}

interface BotContext extends Context {
    session: SessionData
}

export const bot = new Telegraf<BotContext>(BOT_TOKEN);

bot.use(channelMode())
bot.use(session())


bot.command('start', async (ctx) => {
    console.log('start')
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
})


bot.command('setup', async (ctx) => {
    if (ctx.message.chat.type != 'private') {
        const url = `http://t.me/${bot.botInfo?.username}?start=setup`
        const inlineKeyboard: InlineKeyboardMarkup = {
            inline_keyboard: [
                [Markup.button.url('💫 Fast setup', url)],
            ],
        };
        await ctx.replyWithHTML(`[Tutorial] - Just setup bro`, {parse_mode: 'HTML', reply_markup: inlineKeyboard})
        return
    }
    ctx.session = {
        text: '',
        entities: [],
        tokenAddress: '',
        tokenBalance: 0,
        chatInviteTo: 0,
        chatInviteFrom: 0,
        additionalBtns: [],
        photoFileId: undefined,
        state: '',
        msgId: 0
    }
    ctx.session.state = 'setToken'
    await ctx.replyWithHTML(`💫 <b>Fast setup</b>\n\n` +
        `<code>Token address</code>\n` +
        `<code>Necessary balance</code>\n`)
})

bot.on(message('text'), async (ctx) => {
    if (!ctx.session) return;

    if (ctx.session.state == 'setToken') {
        let [tokenAddress, tokenBalance] = ctx.message.text.split('\n')

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
        ctx.session.tokenAddress = tokenAddress
        ctx.session.tokenBalance = +tokenBalance

        await ctx.replyWithHTML(`<b>Click below and select the group you want to attach your portal to:</b>`,
            Markup.keyboard([
                Markup.button.groupRequest("➡️ Select a group", 1)
            ])
        );
    }
    if (ctx.session.state == 'setText') {
        ctx.session.text = ctx.message.text
        ctx.session.entities = ctx.message.entities
        const headerText = `⚙️ <b>Portal setup is almost complete!</b>`
        await bot.telegram.editMessageText(ctx.chat!.id, ctx.session.msgId, undefined, headerText, {
            reply_markup: {
                inline_keyboard: [
                            [Markup.button.callback('🔗 Create portal', 'create')],
                            [Markup.button.callback('⚙️ Advanced settings', 'settings')],
                            [Markup.button.callback('👁️‍🗨️ Show preview', 'preview')]
                        ]
            }, parse_mode: "HTML"
        })

        await ctx.deleteMessage()

        ctx.session.state = 'settings'
    }
    if (ctx.session.state == 'addBtns') {
        const settingsKeyboard = getSettingsInlineKeyboard()
        let [textBtn, url] = ctx.message.text.split('\n')
        // todo validate
        ctx.session.additionalBtns.push([textBtn, url])

        const text = `⚙️ <b>Advanced settings</b>\n\nNew button has been saved!`
        await bot.telegram.editMessageText(ctx.chat!.id, ctx.session.msgId, undefined, text, {
            reply_markup: {
                inline_keyboard: settingsKeyboard
            }, parse_mode: "HTML"}
        )
        await ctx.telegram.deleteMessage(ctx.chat!.id, ctx.message.message_id)
    }
})


bot.on(message("chat_shared"), async (ctx) => {
    if (!ctx.session) return;

    const requestId = ctx.message.chat_shared.request_id
    if (requestId == 1) {
        const channelId = ctx.message.chat_shared.chat_id

        // validate channelId
        try {
            const rights = await ctx.telegram.getChatMember(channelId, ctx.botInfo.id)
            //@ts-ignore
            if (!rights.can_invite_users)
                return await ctx.sendMessage(`Can't create invite links to chat '${channelId}'`)
        } catch (e) {
            return await ctx.sendMessage(`Can't find me in chat '${channelId}'`)
        }

        ctx.session.chatInviteTo = ctx.message.chat_shared.chat_id
        await ctx.replyWithHTML("<b>Select a channel when your portal will be created</b>",
            Markup.keyboard([
                Markup.button.channelRequest("➡️ Select a channel", 2)
            ]))
    } else if (requestId == 2) {
        if (ctx.message.chat_shared.chat_id == ctx.session.chatInviteTo) {
            return await ctx.sendMessage(`You can't select the same channel`)
        }
        ctx.session.chatInviteFrom = ctx.message.chat_shared.chat_id

        ctx.session.state = 'setText'
        const msg = await ctx.replyWithHTML(`<b>Send a invite text</b>`)
        ctx.session.msgId = msg.message_id
    }
})


bot.action('settings', async (ctx) => {
    if (!ctx.session) return;
    const settingsKeyboard = getSettingsInlineKeyboard()
    await bot.telegram.editMessageText(ctx.chat!.id, ctx.session.msgId, undefined, ctx.session.text, {
        reply_markup: {
            inline_keyboard: settingsKeyboard
        }
    })
})

bot.action('editText', async (ctx) => {
    if (!ctx.session) return;

    await ctx.editMessageText(`<b>Send a invite text</b>`, {parse_mode: 'HTML'})
    ctx.session.state = 'setText'
})

bot.action('addPhoto', async (ctx) => {
    if (!ctx.session) return;

    await ctx.editMessageText(`<b>Send a photo</b>`, {parse_mode: 'HTML'})
    ctx.session.state = 'addPhoto'
})

bot.on('photo', async (ctx) => {
    if (!ctx.session) return;

    const photo = ctx.message.photo[ctx.message.photo.length - 1]
    ctx.session.photoFileId = photo.file_id
    const text = `⚙️ <b>Advanced settings</b>\n\nNew media has been saved!`
    const settingsKeyboard = getSettingsInlineKeyboard()
    await bot.telegram.editMessageText(ctx.chat!.id, ctx.session.msgId, undefined, text, {
        reply_markup: {
            inline_keyboard: settingsKeyboard
        }, parse_mode: 'HTML'
    })
    await bot.telegram.deleteMessage(ctx.chat!.id, ctx.message.message_id)
})


bot.action('addBtns', async (ctx) => {
    if (!ctx.session) return;

    await ctx.editMessageText(`<b>Send:</b>\n\n` +
        `<code>Button text</code>\n` +
        `<code>Button url</code>`, {parse_mode: 'HTML'})
    ctx.session.state = 'addBtns'
})


bot.action('portalMenu', async (ctx) => {
    if (!ctx.session) return;
    const text = '⚙️ <b>Portal setup is almost complete!</b>'
    await bot.telegram.editMessageText(ctx.chat!.id, ctx.session.msgId, undefined, text, {
        reply_markup: {
            inline_keyboard: [
                [Markup.button.callback('🔗 Create portal', 'create')],
                [Markup.button.callback('⚙️ Advanced settings', 'settings')],
                [Markup.button.callback('👁️‍🗨️ Show preview', 'preview')]
            ]
        }, parse_mode: 'HTML'
    })
})

bot.action('preview', async (ctx) => {
    if (!ctx.session) return;

    await ctx.answerCbQuery()

    const data = ctx.session
    const inlineKeyboard = getPortalKeyboard(data, true)
    console.log(ctx.chat!.id)
    if (data.photoFileId) {
        await sendWithPhoto(ctx.chat!.id, data, inlineKeyboard)
    } else {
        await sendWithoutPhoto(ctx.chat!.id, data, inlineKeyboard)
    }
})

bot.action('create', async (ctx) => {
    if (!ctx.session) return;

    await ctx.answerCbQuery()
    const data = ctx.session
    const inlineKeyboard = getPortalKeyboard(data, false)

    if (data.photoFileId) {
        await sendWithPhoto(data.chatInviteFrom, data, inlineKeyboard)
    } else {
        await sendWithoutPhoto(data.chatInviteFrom, data, inlineKeyboard)
    }
})

bot.action('delete', async (ctx) => {
    await ctx.answerCbQuery()
    await ctx.deleteMessage()
})

function getPortalKeyboard(data: SessionData, isPreview: boolean) {
    const deeplink = packDeeplink(data.chatInviteTo, data.tokenAddress, data.tokenBalance)
    const url = `http://t.me/${bot.botInfo?.username}?start=${deeplink}`

    const additionalBtns = (data.additionalBtns ?? [])
        .map(([text, url]) => Markup.button.url(text, url))

    const deleteBtn = Markup.button.callback('🗑️ Delete preview', 'delete')
    const inlineKeyboard: InlineKeyboardMarkup = {
        inline_keyboard: [
            [Markup.button.url('Verify', url)],
            additionalBtns,
            isPreview ? [deleteBtn] : []
        ],
    };
    return inlineKeyboard
}

function getSettingsInlineKeyboard(){
    return [
        [Markup.button.callback('Edit portal image', 'addPhoto'),
            Markup.button.callback('Edit portal text', 'editText')],
        [Markup.button.callback('Edit portal buttons', 'addBtns')],
        [Markup.button.callback('💾 Save options', 'portalMenu')]
    ]
}

async function sendWithPhoto(channelId: number, data: any, inlineKeyboard: InlineKeyboardMarkup) {
    const msg = await bot.telegram.sendPhoto(channelId, data.photoFileId, {
        caption: data.text,
        caption_entities: data.entities,
        reply_markup: inlineKeyboard
    })
    return msg.message_id
}

async function sendWithoutPhoto(channelId: number, data: any, inlineKeyboard: InlineKeyboardMarkup) {
    const msg = await bot.telegram.sendMessage(channelId, data.text, {
        reply_markup: inlineKeyboard,
        entities: data.entities
    })
    return msg.message_id
}

export async function sendInviteLink(chanelId: number, userId: number, userAddress: string) {
    const link = await bot.telegram.createChatInviteLink(chanelId, {
        member_limit: 1,
        name: `${userId} ${userAddress}`
    })

    await bot.telegram.sendMessage(userId, link.invite_link)
}