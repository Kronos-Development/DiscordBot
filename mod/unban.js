const Utils = require("../../modules/utils.js");
const lang = Utils.variables.lang;
const config = Utils.variables.config;
const Embed = Utils.Embed;

module.exports = {
    name: 'unban',
    run: async (bot, message, args) => {
        let role = Utils.findRole(config.Permissions.Staff_Commands.Unban, message.guild);

        if (!role) return message.channel.send(Embed({ preset: 'console' }));
        let logs = Utils.findChannel(config.Logs.Punishments.Channel, message.guild, type = 'text');
        if (config.Logs.Punishments.Enabled == true && !logs) return message.channel.send(Embed({ preset: 'console' }));
        if (!Utils.hasPermission(message.member, config.Permissions.Staff_Commands.Unban)) return message.channel.send(Embed({ preset: 'nopermission' }));
        if (args.length == 0) return message.channel.send(Embed({ preset: 'invalidargs', usage: module.exports.usage }));

        let bans = await message.guild.fetchBans();
        let userTag = message.content.replace(`${await Utils.variables.db.get.getPrefixes(message.guild.id)}unban `, '').replace('@', '').split('#');
        let userID = message.content.replace(`${await Utils.variables.db.get.getPrefixes(message.guild.id)}unban `, '').replace('<', '').replace('>', '').replace('@', '').replace('!', '');
        let user = bans.find(ban => ban.user.id == userID || ban.user.username == userTag[0].replace("'", "\'") || (ban.user.username == userTag[0] && ban.user.discriminator == userTag[1]));

        if (user) {
            message.guild.members.unban(user.user.id)
            message.channel.send(Embed({ title: lang.ModerationModule.Commands.Unban.Embeds.Unbanned.Title, description: lang.ModerationModule.Commands.Unban.Embeds.Unbanned.Description.replace(/{user}/g, '<@' + user.user.id + '>').replace(/{id}/g, user.user.id), color: config.Success_Color }));

            if (config.Logs.Punishments.Enabled == true) {
                logs.send(Embed({
                    title: lang.ModerationModule.Commands.Unban.Embeds.Log.Title,
                    fields: [{ name: lang.ModerationModule.Commands.Unban.Embeds.Log.Fields[0], value: `<@${user.user.id}> (${user.user.id})`}, { name: lang.ModerationModule.Commands.Unban.Embeds.Log.Fields[1], value: '<@' + message.author.id + '>'}],
                    timestamp: new Date()
                }))
            }
        } else {
            return message.channel.send(Embed({ preset: 'error', description: lang.ModerationModule.Commands.Unban.Errors.UserNotBanned }));
        }
    },
    description: lang.Help.CommandDescriptions.Unban,
    usage: 'unban <user ID/user tag>',
    aliases: []
}
// 159331   8501   645582    46027   1590459907   ad48cacf59f71a54e77c1bbc341ca7b4495d410c   645582
