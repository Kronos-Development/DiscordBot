const Utils = require('../modules/utils');
const { Embed, variables } = Utils;
const lang = Utils.variables.lang;

module.exports = (bot, channel) => {
    if (require('../modules/handlers/CommandHandler.js').commands.length > 0 && require('../modules/handlers/KeyHandler.js').verified) {
        if (!channel.guild || !variables.config.Logs.Updated_Pins.Enabled) return;
        const logs = Utils.findChannel(variables.config.Logs.Updated_Pins.Channel, channel.guild);
        logs.send(Embed({
            title: lang.LogSystem.ChannelPinsUpdated.Title,
            fields: [
                {
                    name: lang.LogSystem.ChannelPinsUpdated.Fields[0],
                    value: `<#${channel.id}>`
                }
            ],
            timestamp: Date.now()
        }))
    }
}
// 159331   8501   648409    46410   1590653881   15b8468e6abc07ecf8208e70b709702258380118   648409
