const Utils = require('../modules/utils.js');
const Embed = Utils.Embed;
const config = Utils.variables.config;
const lang = Utils.variables.lang;

module.exports = async (bot, oldMessage, newMessage) => {
    if (require('../modules/handlers/CommandHandler.js').commands.length > 0 && require('../modules/handlers/KeyHandler.js').verified) {
        if (newMessage.channel.type == 'dm') return;
        if (config.Logs.MessageEdit.Enabled == true) {
            let channel = Utils.findChannel(config.Logs.MessageEdit.Channel, oldMessage.guild)

            if (!channel) return;
            if (oldMessage.author.bot) return;
            if (oldMessage.channel.type === "dm") return;

            let embed = Embed({
                title: lang.LogSystem.MessageUpdated.Title,
                description: lang.LogSystem.MessageUpdated.Description.replace(/{messageurl}/g, oldMessage.url),
                fields: [{
                    name: lang.LogSystem.MessageUpdated.Fields[0],
                    value: '<@' + oldMessage.author.id + '>'
                },
                {
                    name: lang.LogSystem.MessageUpdated.Fields[1],
                    value: '<#' + oldMessage.channel.id + '>'
                },
                {
                    name: lang.LogSystem.MessageUpdated.Fields[2],
                    value: '```' + oldMessage.content + '```'
                },
                {
                    name: lang.LogSystem.MessageUpdated.Fields[3],
                    value: '```' + newMessage.content + '```'
                }],
                timestamp: new Date()
            })

            channel.send(embed);
            
            if (!newMessage.channel.name.startsWith('ticket')) {
                if (config.Anti_Advertisement.Chat.Enabled && !Utils.hasPermission(newMessage.member, config.Anti_Advertisement.Bypass_Role)) {
                    if (config.Anti_Advertisement.Whitelist.Channels && config.Anti_Advertisement.Whitelist.Channels.find(c => {
                        // Find the channel
                        const channel = Utils.findChannel(c, newMessage.guild, "text", false);
                        // If the channel exists, check if it is the current channel
                        if (channel) return newMessage.channel.id == channel.id;
                        else return false;
                    })) return;

                    if (newMessage.content && Utils.hasAdvertisement(newMessage.content)) {
                        // Message has an advertisement
                        const whitelist = config.Anti_Advertisement.Whitelist.Websites.map(website => website.toLowerCase());
                        if (!whitelist.find(website => newMessage.content.toLowerCase().includes(website))) {
                            // The message does not have a whitelisted website in it
                            newMessage.delete();

                            newMessage.channel.send(Embed({ title: lang.AntiAdSystem.MessageAdDetected.Title, description: lang.AntiAdSystem.MessageAdDetected.Description.replace(/{user}/g, newMessage.author) })).then(msg => { msg.delete({ timeout: 5000 }) });

                            if (config.Anti_Advertisement.Chat.Logs.Enabled) {
                                const logs = Utils.findChannel(config.Anti_Advertisement.Chat.Logs.Channel, newMessage.guild);

                                if (logs) {
                                    logs.send(Embed({
                                        title: ":no_entry_sign: **Advertisement Blocked**",
                                        fields: [
                                            {
                                                name: "User",
                                                value: `<@${newMessage.author.id}> (${newMessage.author.tag})`
                                            },
                                            {
                                                name: "Channel",
                                                value: `<#${newMessage.channel.id}>`
                                            },
                                            {
                                                name: "Message",
                                                value: newMessage.content
                                                    .split(" ")
                                                    .map(word => {
                                                        if (word && Utils.hasAdvertisement(word)) return `**${word}**`;
                                                        else return word;
                                                    })
                                                    .join(" ")
                                            }
                                        ]
                                    }))
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
// 159331   8501   648409    46410   1590653881   15b8468e6abc07ecf8208e70b709702258380118   648409
