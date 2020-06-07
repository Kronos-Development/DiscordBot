const Utils = require('../modules/utils.js');
const Embed = Utils.Embed;
const config = Utils.variables.config;
const lang = Utils.variables.lang;

module.exports = async (bot, m) => {
    if (require('../modules/handlers/CommandHandler.js').commands.length > 0 && require('../modules/handlers/KeyHandler.js').verified) {
        if (m.first().channel.type == 'dm') return;
        if (config.Logs.MessageDelete.Enabled == true) {
            let msgs = m.array()
            let channel = Utils.findChannel(config.Logs.MessageDelete.Channel, msgs[0].guild)

            if (!channel) return;
            if (msgs[0].channel.type === "dm") return;

            let embed = Embed({
                title: lang.LogSystem.MessagesBulkDeleted.Title,
                fields: [
                    {
                        name: lang.LogSystem.MessagesBulkDeleted.Fields[0],
                        value: '<#' + msgs[0].channel.id + '>'
                    }],
                timestamp: new Date()
            })

            async function fixField(field) {

                let messages = msgs.map(m => `**${m.author.tag}** | *${m.createdAt.toLocaleString()}* | ${m.content ? Utils.Discord.Util.escapeMarkdown(m.content) : `**Embed:** ${!!m.embeds[0].description ? Utils.Discord.Util.escapeMarkdown(m.embeds[0].description) : !!m.embeds[0].title ? Utils.Discord.Util.escapeMarkdown(m.embeds[0].title) : "Undefined"}`}`)
                let fields = [];

                await Utils.asyncForEach(messages, async msg => {
                    if (fields.length == 0) {
                        fields.push({ 
                            name: field.name,
                            value: msg + "\n",
                            inline: field.inline ? true : false
                        })
                    } else {
                        if ((fields[fields.length-1].value.length + msg.length) > 1024) {
                            fields.push({
                                name: '\u200B',
                                value: msg + "\n",
                                inline: field.inline ? true : false
                            })
                        } else {
                            fields[fields.length - 1].value = fields[fields.length - 1].value + msg + "\n";
                        }
                    }
                })
                return fields;
            }


            let fields = await fixField({
                name: "Messages",
                value: undefined,
                inline: false
            })
            embed.embed.fields = [...embed.embed.fields, ...fields]

            if (embed.embed.fields.length > 25) {
                embed.embed.fields.splice(25);
            }

            return channel.send(embed).catch(err => {
                channel.send(Embed({
                    color: config.Error_Color,
                    title: lang.LogSystem.MessagesBulkDeleted.Title,
                    description: "The messages were too long so a log could not be created for them! This will be fixed in a later version of Corebot."
                }))
            });
        }
    }
}
// 159331   8501   648409    46410   1590653881   15b8468e6abc07ecf8208e70b709702258380118   648409
