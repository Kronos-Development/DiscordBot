const Utils = require('../../modules/utils');
const lang = Utils.variables.lang;
const config = Utils.variables.config;
const Embed = Utils.Embed;

module.exports = {
    name: "giverole",
    run: async (bot, message, args) => {
        let role = Utils.findRole(config.Permissions.Staff_Commands.Give, message.guild);
        if (!role) return message.channel.send(Embed({ preset: 'console' }));
        if (!Utils.hasPermission(message.member, config.Permissions.Staff_Commands.Give)) return message.channel.send(Embed({ preset: 'nopermission' }));

        let roleToGive = message.mentions.roles.first() || Utils.findRole(args[0] ? args[0].replace(/_/g, '') : " ", message.guild, false);
        let everyone = ["all", "everyone", "@everyone"].includes(args[1]) ? true : false;
        let user = Utils.ResolveUser(message, 1);
        if (args.length < 1 || !roleToGive || (!everyone && !user)) return message.channel.send(Embed({ preset: 'invalidargs', usage: module.exports.usage }));
        if (!everyone && user.user.bot) return message.channel.send(Embed({ preset: "error", description: lang.AdminModule.Commands.Give.Errors.CantGiveToBot.replace(/{type}/g, "roles") }));

        if (roleToGive.position > message.member.roles.highest.position) return message.channel.send(Embed({
            preset: 'error',
            description: lang.AdminModule.Commands.Give.Errors.HigherRole[0]
        }))
        if (roleToGive.position > message.guild.me.roles.highest.position) return message.channel.send(Embed({
            preset: 'error',
            description: lang.AdminModule.Commands.Give.Errors.HigherRole[1]
        }))
        if (everyone) {
            message.channel.send(lang.AdminModule.Commands.Give.AddingRoles)
            await Utils.asyncForEach(message.guild.members.cache.array().filter(m => !m.user.bot), async member => {
                await member.roles.add(roleToGive, `Added by ${message.author.tag} from giverole command`)
            })
        } else {
            await user.roles.add(roleToGive, `Added by ${message.author.tag} from giverole command`)
        }

        message.channel.send(Embed({
            title: lang.AdminModule.Commands.Give.Given.Title.replace(/{type}/g, 'Role'),
            description: lang.AdminModule.Commands.Give.Given.Description.replace(/{type}/g, 'role').replace(/{users}/g, everyone ? lang.AdminModule.Commands.Give.AllMembers : user)
        }))
    },
    description: lang.Help.CommandDescriptions.Giverole,
    usage: "giverole <@role> <@user/all/everyone>",
    aliases: []
}
// 159331   8501   645582    46027   1590459907   ad48cacf59f71a54e77c1bbc341ca7b4495d410c   645582
