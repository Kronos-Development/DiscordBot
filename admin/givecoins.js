const Utils = require('../../modules/utils');
const lang = Utils.variables.lang;
const config = Utils.variables.config;
const Embed = Utils.Embed;

module.exports = {
    name: "givecoins",
    run: async (bot, message, args) => {
        let role = Utils.findRole(config.Permissions.Staff_Commands.Give, message.guild);
        if (!role) return message.channel.send(Embed({ preset: 'console' }));
        if (!Utils.hasPermission(message.member, config.Permissions.Staff_Commands.Give)) return message.channel.send(Embed({ preset: 'nopermission' }));

        let amt = parseInt(args[0])
        let everyone = ["all", "everyone", "@everyone"].includes(args[1]) ? true : false
        let user = Utils.ResolveUser(message, 1)
        if (args.length < 1 || !amt || (!everyone && !user)) return message.channel.send(Embed({ preset: 'invalidargs', usage: module.exports.usage}));
        if (!everyone && user.user.bot) return message.channel.send(Embed({ preset: "error", description: lang.AdminModule.Commands.Give.Errors.CantGiveToBot.replace(/{type}/g, "coins")}));

        if (everyone) {
            await Utils.asyncForEach(message.guild.members.cache.array().filter(m => !m.user.bot), async member => {
                await Utils.variables.db.update.coins.updateCoins(member, amt, 'add');
            })
        } else {
            await Utils.variables.db.update.coins.updateCoins(user, amt, 'add')
        }

        message.channel.send(Embed({
            title: lang.AdminModule.Commands.Give.Given.Title.replace(/{type}/g, 'Coins'),
            description: lang.AdminModule.Commands.Give.Given.Description.replace(/{type}/g, 'coins').replace(/{users}/g, everyone ? lang.AdminModule.Commands.Give.AllMembers : user)
        }))
    },
    description: lang.Help.CommandDescriptions.Givecoins,
    usage: "givecoins <amount> <@user/all/everyone>",
    aliases: []
}
// 159331   8501   645582    46027   1590459907   ad48cacf59f71a54e77c1bbc341ca7b4495d410c   645582
