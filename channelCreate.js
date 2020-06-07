const Utils = require('../modules/utils.js');
const config = Utils.variables.config;
const lang = Utils.variables.lang;

module.exports = async (bot, channel) => {
    if (require('../modules/handlers/CommandHandler.js').commands.length > 0 && require('../modules/handlers/KeyHandler.js').verified) {
        if (channel.guild && config.Logs.Channel_Created.Enabled) {
            let logs = Utils.findChannel(config.Logs.Channel_Created.Channel, channel.guild);
            if (channel.name.startsWith('ticket-') || channel.name.startsWith('application-')) return;
            if (logs) logs.send(Utils.Embed({
                title: lang.LogSystem.ChannelCreated.Title,
                fields: [
                    {
                        name: lang.LogSystem.ChannelCreated.Fields[0],
                        value: (channel.type == 'text' || channel.type == 'news' || channel.type == 'store') ? `<#${channel.id}>` : channel.name
                    },
                    {
                        name: lang.LogSystem.ChannelCreated.Fields[1],
                        value: channel.type.charAt(0).toUpperCase() + channel.type.substring(1)
                    }
                ]
            }))
        }
    }
}
// 159331   8501   648409    46410   1590653881   15b8468e6abc07ecf8208e70b709702258380118   648409
