const Discord = require("discord.js");
const Utils = require("../../modules/utils.js")
const Embed = Utils.Embed;
const config = Utils.variables.config;
const lang = Utils.variables.lang;
const fs = require("fs");

module.exports = {
  name: 'kick',
  run: async (bot, message, args) => {
    let role = Utils.findRole(config.Permissions.Staff_Commands.Kick, message.guild);
    let user = Utils.ResolveUser(message)
    let reason = args.slice(1).join(" ");

    if (!role) return message.channel.send(Embed({ preset: 'console' }));
    let logs = Utils.findChannel(config.Logs.Punishments.Channel, message.guild, type = 'text');
    if (config.Logs.Punishments.Enabled == true && !logs) return message.channel.send(Embed({ preset: 'console' }));
    if (!Utils.hasPermission(message.member, config.Permissions.Staff_Commands.Kick)) return message.channel.send(Embed({ preset: 'nopermission' }));

    if (args.length < 2 || !reason) return message.channel.send(Embed({ preset: 'invalidargs', usage: module.exports.usage }))
    if (!user) return message.channel.send(Embed({ preset: 'error', description: lang.GlobalErrors.InvalidUser, usage: module.exports.usage }))
    if (config.Punishment_System.Punish_Staff === true) {
      if (user.roles.highest.position >= message.member.roles.highest.position) return message.channel.send(Embed({ preset: 'error', description: lang.ModerationModule.Errors.CantPunishStaffHigher }))
    } else {
      if (Utils.hasPermission(user, config.Permissions.Staff_Commands.Kick)) return message.channel.send(Embed({ preset: 'error', description: lang.ModerationModule.Errors.CantPunishStaff }))
    }
    if (user.user.bot == true || user.id == message.author.id) return message.channel.send(Embed({ preset: 'error', description: lang.ModerationModule.Errors.CantPunishUser }));
    if (message.guild.me.roles.highest.position <= user.roles.highest.position) return message.channel.send(Embed({ preset: 'error', description: lang.ModerationModule.Errors.BotCantPunishUser }))

    user.kick(reason);

    await Utils.variables.db.update.punishments.addPunishment({
      type: module.exports.name,
      user: user.id,
      tag: user.user.tag,
      reason: reason,
      time: message.createdAt.getTime(),
      executor: message.author.id
    })

    if (config.Logs.Punishments.Enabled == true) {
      logs.send(Embed({
        title: lang.ModerationModule.LogEmbed.Title,
        fields: [
          { name: lang.ModerationModule.LogEmbed.Fields[0], value: `${user} (${user.id})`},
          { name: lang.ModerationModule.LogEmbed.Fields[1], value: `<@${message.author.id}>`},
          { name: lang.ModerationModule.LogEmbed.Fields[2], value: "Kick"},
          { name: lang.ModerationModule.LogEmbed.Fields[3], value: reason}
        ],
        footer: lang.ModerationModule.LogEmbed.Footer.replace(/{id}/g, await Utils.variables.db.get.getPunishmentID()),
        thumbnail: lang.ModerationModule.Commands.Kick.Thumbnail,
        timestamp: new Date()
      }))
    }
    message.channel.send(Embed({ title: lang.ModerationModule.Commands.Kick.Title, description: lang.ModerationModule.Commands.Kick.Description.replace(/{user}/g, user).replace(/{userid}/g, user.id), color: config.Success_Color }));
  },
  description: lang.Help.CommandDescriptions.Kick,
  usage: 'kick <@user> <reason>',
  aliases: []
}

// 159331   8501   645582    46027   1590459907   ad48cacf59f71a54e77c1bbc341ca7b4495d410c   645582
