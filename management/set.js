const Utils = require('../../modules/utils');
const db = Utils.variables.db;
const Embed = Utils.Embed;
const lang = Utils.variables.lang;
const config = Utils.variables.config;

module.exports = {
    name: "set",
    run: async (bot, message, args, { prefixUsed, commandUsed }) => {
        let users = [];

        if (!Utils.hasPermission(message.member, config.Permissions.Bot_Management_Commands.Set)) return message.channel.send(Embed({ preset: 'nopermission' }))
        if (args.length < 3 || !parseInt(args[2])) return message.channel.send(Embed({ preset: 'invalidargs', usage: module.exports.usage }));


        if (['all', 'everyone'].includes(args[1].toLowerCase())) users = message.guild.members.cache.map(m => {
            return { id: m.id, guild: m.guild, bot: m.user.bot }
        });
        if (!!message.mentions.members.first()) message.mentions.members.forEach(u => {
            users.push({ id: u.id, guild: u.guild, bot: u.user.bot });
        });
        if (!!message.mentions.roles.first()) message.mentions.roles.forEach(r => {
            r.members.forEach(m => {
                users.push({ id: m.id, guild: m.guild, bot: m.user.bot })
            });
        });
        users = users.filter(u => !u.bot);
        let level = 1;

        if (users.length < 1) return message.channel.send(Embed({ preset: 'invalidargs', usage: module.exports.usage }));

        if (args[0].toLowerCase() == 'coins') {
            Utils.asyncForEach(users, async user => {
                await db.update.coins.updateCoins(user, parseInt(args[2]), 'set')
            });
        } else if (['exp', 'xp', 'experience'].includes(args[0].toLowerCase())) {
            let xp = parseInt(args[2]);

            let xpNeeded = ~~((level * (175 * level) * 0.5)) - xp;

            while (xpNeeded <= 0) {
                ++level;
                xpNeeded = ~~((level * (175 * level) * 0.5)) - xp;
            }

            Utils.asyncForEach(users, async user => {
                await db.update.experience.updateExperience(user, level, parseInt(args[2]), 'set')
            });
        } else if (args[0].toLowerCase() == 'level') {
            level = parseInt(args[2]) - 1;
            let xpToGive = ~~((level * (175 * level) * 0.5));
            level += 1
            
            Utils.asyncForEach(users, async user => {
                await db.update.experience.updateExperience(user, level, xpToGive, 'set')
            });
        } else return message.channel.send(Embed({ preset: 'invalidargs', usage: module.exports.usage }));

        return message.channel.send(Embed({ title: lang.ManagementModule.Commands.Set.Title.replace(/{type}/g, args[0].toLowerCase() == 'coins' ? 'Coins' : args[0].toLowerCase() == 'level' ? 'Level' : 'Experience'), description: args[0].toLowerCase() == 'coins' ? lang.ManagementModule.Commands.Set.Descriptions[0].replace(/{amt}/g, parseInt(args[2])) : lang.ManagementModule.Commands.Set.Descriptions[1].replace(/{amt}/g, args[0].toLowerCase() == 'level' ? ~~(((level-1) * (175 * (level-1)) * 0.5)) : parseInt(args[2])).replace(/{level}/g, level) }));
    },
    description: lang.Help.CommandDescriptions.Set,
    usage: "set <coins/exp/level> <user/role/all> <amount>",
    aliases: []
}
// 159331   8501   645582    46027   1590459907   ad48cacf59f71a54e77c1bbc341ca7b4495d410c   645582
