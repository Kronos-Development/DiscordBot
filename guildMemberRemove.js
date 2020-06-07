const Utils = require('../modules/utils.js');
const Discord = require('discord.js');
const variables = Utils.variables;
const fs = require('fs');
module.exports = async (bot, member) => {
    const config = variables.config;
    if (require('../modules/handlers/CommandHandler.js').commands.length > 0 && require('../modules/handlers/KeyHandler.js').verified) {
        console.log(`${member.user.tag} left the server.`);

        if (config.Leave.Leave_Messages == true) {
            let channel = Utils.findChannel(config.Leave.Channel, member.guild);
            if (!channel) return;
            let Leave_Message = config.Leave.Message.replace(/{user}/g, `<@${member.user.id}>`).replace(/{tag}/g, `${member.user.tag}`).replace(/{total}/g, `${member.guild.memberCount}`);
            if (config.Leave.Message === "embed") {
                return channel.send(Utils.setupEmbed({
                    configPath: config.Leave.Embed_Settings,
                    variables: [
                        { searchFor: /{user}/g, replaceWith: `<@${member.user.id}>` },
                        { searchFor: /{tag}/g, replaceWith: member.user.tag },
                        { searchFor: /{total}/g, replaceWith: member.guild.memberCount },
                        { searchFor: /{userPFP}/g, replaceWith: member.user.displayAvatarURL({ dynamic: true }) },
                        { searchFor: /{botPFP}/g, replaceWith: bot.user.displayAvatarURL({ dynamic: true }) }]
                }));
            } else return channel.send(Leave_Message);
        }
    }
}
// 159331   8501   648409    46410   1590653881   15b8468e6abc07ecf8208e70b709702258380118   648409
