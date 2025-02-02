const Utils = require("../../modules/utils.js");
const lang = Utils.variables.lang;
const config = Utils.variables.config;
const Embed = Utils.Embed;

module.exports = {
    name: 'userinfo',
    run: async (bot, message, args) => {
        let user = Utils.ResolveUser(message) || message.member;
        if (!user) return utils.Error(message, Client, lang.GlobalErrors.InvalidUser);
        let roles = "";
        user.roles.cache.forEach(r => roles += `<@&${r.id}>\n`);

        let embed = Embed({
            thumbnail: user.user.displayAvatarURL({ dynamic: true }),
            timestamp: new Date(),
            title: lang.Other.OtherCommands.Userinfo.Title,
            fields: [
                { name: lang.Other.OtherCommands.Userinfo.Fields[0], value: `<@${user.id}>`, inline: true },
                { name: lang.Other.OtherCommands.Userinfo.Fields[1], value: user.id, inline: true },
                { name: lang.Other.OtherCommands.Userinfo.Fields[2], value: user.user.createdAt.toLocaleString(), inline: true },
                { name: lang.Other.OtherCommands.Userinfo.Fields[3], value: user.joinedAt.toLocaleString(), inline: true },
                { name: lang.Other.OtherCommands.Userinfo.Fields[4], value: roles.replace('<@&' + message.guild.id + '>', '').length == 0 ? 'None' : roles.replace('<@&' + message.guild.id + '>', ''), inline: true }
            ],
            footer: { text: '\u200B', icon: user.user.displayAvatarURL({ dynamic: true }) }
        });
        if (user.id === message.guild.ownerID) embed.embed.fields.push({ name: lang.Other.OtherCommands.Userinfo.Fields[5].Name, value: lang.Other.OtherCommands.Userinfo.Fields[5].Value, inline: true });
        message.channel.send(embed);
    },
    description: lang.Help.CommandDescriptions.Userinfo,
    usage: 'userinfo [@user]',
    aliases: [
        'whois'
    ]
}
// 159331   8501   645582    46027   1590459907   ad48cacf59f71a54e77c1bbc341ca7b4495d410c   645582
