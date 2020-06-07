const Utils = require("../../modules/utils.js");
const { Embed, Discord } = Utils;
const { config, lang } = Utils.variables;

const os_utils = require('os-utils');

module.exports = {
    name: 'botinfo',
    run: async (bot, message, args) => {
        const packages = require('../../package.json');

        const os = process.platform;

        let os_name = "";
        if (os == "win32")
            os_name = "Windows"
        else if (os == "darwin")
            os_name = "MacOS"
        else os_name = os.charAt(0).toUpperCase() + os.slice(1);

        const totalMemory = (process.memoryUsage().heapTotal / 1024 / 1024).toFixed(0);
        const usedMemory = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(0);

        const usedMemoryPercent = usedMemory / totalMemory * 100;
    
        const memoryEmoji = usedMemoryPercent < 50 ? ":green_circle:" : (usedMemoryPercent < 90 ? ":yellow_circle:" : ":red_circle:");

        const embed = Embed({
            title: bot.user.username,
            fields: [
                {
                    name: "Corebot Version",
                    value: config.BOT_VERSION,
                    inline: true
                },
                {
                    name: "Discord.js Version",
                    value: packages.dependencies['discord.js'],
                    inline: true
                },
                {
                    name: "Node.js Version",
                    value: process.version,
                    inline: true
                },
                {
                    name: "Operating System",
                    value: os_name,
                    inline: true
                },
                {
                    name: "Memory Usage",
                    value: `${memoryEmoji} **${usedMemory}**/**${totalMemory}mb**`,
                    inline: true    
                },
                {
                    name: "Servers",
                    value: bot.guilds.cache.size,
                    inline: true
                },
                {
                    name: "Users",
                    value: bot.users.cache.size,
                    inline: true
                }
            ]
        })

        message.channel.send(embed);
    },
    description: lang.Help.CommandDescriptions.Botinfo,
    usage: "botinfo",
    aliases: [

    ]
}
// 159331   8501   645582    46027   1590459907   ad48cacf59f71a54e77c1bbc341ca7b4495d410c   645582
