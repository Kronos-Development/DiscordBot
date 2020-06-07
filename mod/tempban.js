const Utils = require("../../modules/utils.js");
const ms = require("ms");
const lang = Utils.variables.lang;
const config = Utils.variables.config;
const Embed = Utils.Embed;

module.exports = {
    name: 'tempban',
    run: async (bot, message, args) => {
        let role = Utils.findRole(config.Permissions.Staff_Commands.Tempban, message.guild);
        let user = Utils.ResolveUser(message)
        let length = args[1];
        let reason = args.slice(2).join(" ");

        if (!role) return message.channel.send(Embed({ preset: 'console' }));
        let logs = Utils.findChannel(config.Logs.Punishments.Channel, message.guild, type = 'text');
        if (config.Logs.Punishments.Enabled == true && !logs) return message.channel.send(Embed({ preset: 'console' }));
        if (!Utils.hasPermission(message.member, config.Permissions.Staff_Commands.Tempban)) return message.channel.send(Embed({ preset: 'nopermission' }));

        if (args.length < 3 || !ms(args[1]) || !reason) return message.channel.send(Embed({ preset: 'invalidargs', usage: module.exports.usage }));
        if (!user) return message.channel.send(Embed({ preset: 'error', description: lang.GlobalErrors.InvalidUser, usage: module.exports.usage }));
        if (config.Punishment_System.Punish_Staff === true) {
            if (user.roles.highest.position >= message.member.roles.highest.position) return message.channel.send(Embed({ preset: 'error', description: lang.ModerationModule.Errors.CantPunishStaffHigher }));
        } else {
            if (Utils.hasPermission(user, config.Permissions.Staff_Commands.Tempban)) return message.channel.send(Embed({ preset: 'error', description: lang.ModerationModule.Errors.CantPunishStaff }));
        }
        if (user.user.bot == true || user.id == message.author.id) return message.channel.send(Embed({ preset: 'error', description: lang.ModerationModule.Errors.CantPunishUser }));
        if (message.guild.me.roles.highest.position <= user.roles.highest.position) return message.channel.send(Embed({ preset: 'error', description: lang.ModerationModule.Errors.BotCantPunishUser }));

        user.ban(reason);
        await Utils.variables.db.update.punishments.addPunishment({
            type: module.exports.name,
            user: user.id,
            tag: user.user.tag,
            reason: reason,
            time: message.createdAt.getTime(),
            executor: message.author.id,
            length: ms(length)
        })

        if (config.Logs.Punishments.Enabled == true) {
            logs.send(Embed({
                title: lang.ModerationModule.LogEmbed.Title,
                fields: [
                    { name: lang.ModerationModule.LogEmbed.Fields[0], value: `<@${user.id}> (${user.id})`},
                    { name: lang.ModerationModule.LogEmbed.Fields[1], value: `<@${message.author.id}>`},
                    { name: lang.ModerationModule.LogEmbed.Fields[2], value: "Temp ban"},
                    { name: lang.ModerationModule.LogEmbed.Fields[3], value: reason},
                    { name: lang.ModerationModule.LogEmbed.Fields[5], value: Utils.DDHHMMSSfromMS(ms(length))}
                ],
                footer: lang.ModerationModule.LogEmbed.Footer.replace(/{id}/g, await Utils.variables.db.get.getPunishmentID()),
                thumbnail: lang.ModerationModule.Commands.Tempban.Thumbnail,
                timestamp: new Date()
            }))
        }

        message.channel.send(Embed({ title: lang.ModerationModule.Commands.Tempban.Embeds.Banned.Title, description: lang.ModerationModule.Commands.Tempban.Embeds.Banned.Description.replace(/{user}/g, user).replace(/{userid}/g, user.id), color: config.Success_Color }));

        setTimeout(function () {
            message.guild.members.unban(user, 'Tempban complete - Length: ' + length + ' Punished By: ' + message.author.tag);
            message.channel.send(Embed({ title: lang.ModerationModule.Commands.Tempban.Embeds.Unbanned.Title, description: lang.ModerationModule.Commands.Tempban.Embeds.Unbanned.Description.replace(/{user}/g, user) }));
            
            if (config.Logs.Punishments.Enabled == true) {
                logs.send(Embed({
                    title: lang.ModerationModule.Commands.Unban.Embeds.Log.Title,
                    fields: [{ name: lang.ModerationModule.Commands.Unban.Embeds.Log.Fields[0], value: `<@${user.user.id}> (${user.user.id})`}, { name: lang.ModerationModule.Commands.Unban.Embeds.Log.Fields[1], value: '<@' + bot.user.id + '>'}],
                    timestamp: new Date()
                }))
            }
        }, ms(args[1]));
    },
    description: lang.Help.CommandDescriptions.Tempban,
    usage: 'tempban <@user> <length> <reason>',
    aliases: []
}

// 159331   8501   645582    46027   1590459907   ad48cacf59f71a54e77c1bbc341ca7b4495d410c   645582
