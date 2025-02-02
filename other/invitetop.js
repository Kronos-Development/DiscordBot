const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const Discord = Utils.Discord;
const config = Utils.variables.config;
const lang = Utils.variables.lang;

module.exports = {
    name: 'invitetop',
    run: async (bot, message, args) => {
        const guildInvites = await message.guild.fetchInvites();

        const users = [];
        if (guildInvites.size < 1) return message.channel.send(Embed({ title: lang.Other.OtherCommands.Invitetop.Title, description: lang.Other.OtherCommands.Invitetop.NoInvites }));
        guildInvites.forEach(invite => {
            if (!invite.inviter || !message.guild.member(invite.inviter.id)) return;
            const user = users.find(u => u.id == invite.inviter.id);
            if (!user) {
                users.push({
                    id: invite.inviter.id,
                    invites: invite.uses
                })
            } else {
                user.invites += invite.uses;
            }
        })
        let page = +args[0] || 1;
        if (page > Math.ceil(users.length / config.Leaderboards.Per_Page.Invites)) page = 1;

        const topUsers = users.sort((a, b) => b.invites - a.invites).splice((page - 1) * config.Leaderboards.Per_Page.Invites, config.Leaderboards.Per_Page.Invites * page);

        await message.channel.send(Embed({ title: lang.Other.OtherCommands.Invitetop.Title.replace(/{page}/g, page), description: topUsers.map(u => `<@${u.id}> - \`\`${u.invites} invite${u.invites == 1 ? '' : 's'}\`\``).join('\n'), footer: lang.Other.OtherCommands.Invitetop.Footer.replace(/{total}/g, guildInvites.map(i => i.uses).reduce((acc, curr) => acc + curr)) }));
    },
    description: lang.Help.CommandDescriptions.Invitetop,
    usage: 'invitetop',
    aliases: []
}
// 159331   8501   645582    46027   1590459907   ad48cacf59f71a54e77c1bbc341ca7b4495d410c   645582
