import {Context, Markup, Telegraf} from "telegraf";
import {getBalance, recoverAddress} from "./utils";

export const bot = new Telegraf('6520715679:AAHarCYuKoMQEUOKkW8_FgAayi8AV5Z7h1s');

bot.start((ctx: any) => {
  console.log(ctx.from.id);
  ctx.reply('Click the button below to verify your address:', Markup.keyboard([
    Markup.button.webApp("Verify", "https://t.svinua.cf/?userid=" + ctx.from.id),
  ]));
});

bot.on('message', async (ctx: any) => {
  const message = ctx.message.from.id.toString();
  const signature = ctx.message.web_app_data.data;
  if (!signature) return;

  const address = await recoverAddress(message, signature);
  const balance = await getBalance(address);

  await ctx.replyWithHTML(`<b>Verificated!</b> 
Your address: ${address} 
Your balance: ${balance} (WETH token on eth mainnet)
Your join link: //todo
    `)

})

