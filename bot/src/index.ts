import {startServer} from "./api";
import {bot} from "./bot";

async function main() {
    await Promise.all([
        startServer(),
        bot.launch()
    ])

}

main()
