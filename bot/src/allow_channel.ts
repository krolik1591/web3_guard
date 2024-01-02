import type { Context } from "telegraf";
import { channelPost } from "telegraf/filters";
import type { MessageEntity } from "telegraf/types";

export const channelMode = () => <C extends Context>(ctx: C, next: () => Promise<void>) => {
    // check if this update is a channelPost
    if (!ctx.has(channelPost("text"))) return next();

    if (ctx.channelPost.text.startsWith("/")) {
        // create a new bot_command entity
        const entity: MessageEntity = {
            type: "bot_command",
            offset: 0,
            length: ctx.channelPost.text.split(" ")[0].length,
        };

        // insert the created entity in the channelPost's entities array (or create it)
        (ctx.channelPost.entities ??= []).unshift(entity);
    }

    /* Create a message object in update, so this update will now start matching both channelPost and message related handlers.
        This means bot.command and bot.hears will work on channels now */
    // @ts-expect-error ignore this error, because obviously channel_post updates don't normally have message, we're doing something wonky
    ctx.update.message = ctx.channelPost;
    return next();
};