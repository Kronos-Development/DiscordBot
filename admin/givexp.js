const Utils = require('../../modules/utils');
const config = Utils.variables.config;
const lang = Utils.variables.lang;
const Embed = Utils.Embed;
module.exports = {
    name: "givexp",
    run: async (bot, message, args) => {
        let role = Utils.findRole(config.Permissions.Staff_Commands.Give, message.guild);
        if (!role) return message.channel.send(Embed({ preset: 'console' }));
        if (!Utils.hasPermission(message.member, config.Permissions.Staff_Commands.Give)) return message.channel.send(Embed({ preset: 'nopermission' }));

        let amt = parseInt(args[0])
        let everyone = ["all", "everyone", "@everyone"].includes(args[1]) ? true : false
        let user = Utils.ResolveUser(message, 1)
        if (args.length < 1 || !amt || (!everyone && !user)) return message.channel.send(Embed({ preset: 'invalidargs', usage: module.exports.usage }));
        if (!everyone && user.user.bot) return message.channel.send(Embed({ preset: "error", description: lang.AdminModule.Commands.Give.Errors.CantGiveToBot.replace(/{type}/g, "experience") }));
        if (everyone) {
            await Utils.asyncForEach(message.guild.members.cache.array().filter(m => !m.user.bot), async members => {
                await Utils.variables.db.update.experience.updateExperience(members, (await Utils.variables.db.get.getExperience(members)).level, amt, 'add')
                let { level, xp } = await Utils.variables.db.get.getExperience(members)
                let xpNeeded = ~~((level * (175 * level) * 0.5)) - xp;

                while (xpNeeded <= 0) {
                    ++level;
                    xpNeeded = ~~((level * (175 * level) * 0.5)) - xp;
                }

                await Utils.variables.db.update.experience.updateExperience(members, level, xp, 'set')
            })
        } else {
            await Utils.variables.db.update.experience.updateExperience(user, (await Utils.variables.db.get.getExperience(user)).level, amt, 'add')
    
            let { level, xp } = await Utils.variables.db.get.getExperience(user)
            let xpNeeded = ~~((level * (175 * level) * 0.5)) - xp;

            while (xpNeeded <= 0) {
                ++level;
                xpNeeded = ~~((level * (175 * level) * 0.5)) - xp;
            }

            await Utils.variables.db.update.experience.updateExperience(user, level, xp, 'set')
        }

        message.channel.send(Embed({
            title: lang.AdminModule.Commands.Give.Given.Title.replace(/{type}/g, 'XP'),
            description: lang.AdminModule.Commands.Give.Given.Description.replace(/{type}/g, 'XP').replace(/{users}/g, everyone ? lang.AdminModule.Commands.Give.AllMembers : user)
        }))
    },
    description: lang.Help.CommandDescriptions.Givexp,
    usage: "givexp <amount> <@user/all/everyone>",
    aliases: [ 'giveexp', 'giveexperience']
}
// 159331   8501   645582    46027   1590459907   ad48cacf59f71a54e77c1bbc341ca7b4495d410c   645582
