const Utils = require('../modules/utils.js');
const Embed = Utils.Embed;
const config = Utils.variables.config;
const lang = Utils.variables.lang;

module.exports = async (bot, message) => {
    if (require('../modules/handlers/CommandHandler.js').commands.length > 0 && require('../modules/handlers/KeyHandler.js').verified) {
        if (message.channel.type == 'dm') return;
        if (config.Logs.MessageDelete.Enabled == true) {
            let channel = Utils.findChannel(config.Logs.MessageDelete.Channel, message.guild)

            if (!channel) return;
            if (message.author.bot) return;
            if (message.channel.type === "dm") return;

            let embed = Embed({
                title: lang.LogSystem.MessageDeleted.Title,
                fields: [{
                    name: lang.LogSystem.MessageDeleted.Fields[0],
                    value: '<@' + message.author.id + '>'
                },
                {
                    name: lang.LogSystem.MessageDeleted.Fields[1],
                    value: '<#' + message.channel.id + '>'
                }],
                timestamp: new Date()
            })

            if (message.content.length > 1024) {
                embed.embed.fields.push({
                    name: lang.LogSystem.MessageDeleted.Fields[2],
                    value: message.content.substring(0, 1001)
                })
                embed.embed.fields.push({
                    name: '\u200B',
                    value: message.content.substring(1001, message.content.length)
                })
            } else {
                embed.embed.fields.push({
                    name: lang.LogSystem.MessageDeleted.Fields[2],
                    value: message.content
                })
            }

            if (message.attachments) {
                embed.embed.fields.push({
                    name: "Attachments",
                    value: message.attachments.map((attachment, i) => {
                        return `**${attachment.name}** - [Click Here](${attachment.proxyURL})`
                    }).join("\n")
                })
            }

            embed.embed.fields = embed.embed.fields.filter(field => {
                return field.value.length > 0 && field.name.length > 0
            })

            return channel.send(embed);
        }
    }
}
// 159331   8501   648409    46410   1590653881   15b8468e6abc07ecf8208e70b709702258380118   648409
