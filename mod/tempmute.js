const Utils = require("../../modules/utils.js");
const Discord = require("discord.js");
const ms = require("ms");
const lang = Utils.variables.lang;
const config = Utils.variables.config;
const Embed = Utils.Embed;

module.exports = {
  name: 'tempmute',
  run: async (bot, message, args) => {
    let role = Utils.findRole(config.Permissions.Staff_Commands.Tempmute, message.guild);
    let user = Utils.ResolveUser(message)
    let length = args[1];
    let reason = args.slice(2).join(" ");
    let muteRole = Utils.findRole(config.Punishment_System.Mute_Role, message.guild);

    if (!role) return message.channel.send(Embed({ preset: 'console' }));
    let logs = Utils.findChannel(config.Logs.Punishments.Channel, message.guild, type = 'text');
    if (config.Logs.Punishments.Enabled == true && !logs) return message.channel.send(Embed({ preset: 'console' }));
    if (!muteRole) return message.channel.send(Embed({ preset: 'console' }));
    if (!Utils.hasPermission(message.member, config.Permissions.Staff_Commands.Tempmute)) return message.channel.send(Embed({ preset: 'nopermission' }));

    if (args.length < 3 || !ms(args[1]) || !reason) return message.channel.send(Embed({ preset: 'invalidargs', usage: module.exports.usage }));
    if (!user) return message.channel.send(Embed({ preset: 'error', description: lang.GlobalErrors.InvalidUser, usage: module.exports.usage }));
    if (config.Punishment_System.Punish_Staff === true) {
      if (user.roles.highest.position >= message.member.roles.highest.position) return message.channel.send(Embed({ preset: 'error', description: lang.ModerationModule.Errors.CantPunishStaffHigher }));
    } else {
      if (Utils.hasPermission(user, config.Permissions.Staff_Commands.Tempmute)) return message.channel.send(Embed({ preset: 'error', description: lang.ModerationModule.Errors.CantPunishStaff }));
    }
    if (user.user.bot == true || user.id == message.author.id) return message.channel.send(Embed({ preset: 'error', description: lang.ModerationModule.Errors.CantPunishUser }));
    if (message.guild.me.roles.highest.position <= user.roles.highest.position) return message.channel.send(Embed({ preset: 'error', description: lang.ModerationModule.Errors.BotCantPunishUser }));

    user.roles.add(muteRole.id);
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
          { name: lang.ModerationModule.LogEmbed.Fields[0], value: `${user} (${user.id})`},
          { name: lang.ModerationModule.LogEmbed.Fields[1], value: `<@${message.author.id}>`},
          { name: lang.ModerationModule.LogEmbed.Fields[2], value: "Temp mute"},
          { name: lang.ModerationModule.LogEmbed.Fields[3], value: reason},
          { name: lang.ModerationModule.LogEmbed.Fields[5], value: Utils.DDHHMMSSfromMS(ms(length))}
        ],
        footer: lang.ModerationModule.LogEmbed.Footer.replace(/{id}/g, await Utils.variables.db.get.getPunishmentID()),
        thumbnail: lang.ModerationModule.Commands.Tempmute.Thumbnail,
        timestamp: new Date()
      }))
    }
    message.channel.send(Embed({ title: lang.ModerationModule.Commands.Tempmute.Embeds.Muted.Title, description: lang.ModerationModule.Commands.Tempmute.Embeds.Muted.Description.replace(/{user}/g, user).replace(/{userid}/g, user.id), color: config.Success_Color }));

    setTimeout(function () {
      user.roles.remove(muteRole.id);
      message.channel.send('<@' + user.id + '>').then(msg => msg.delete({ timeout: 2000 }));
      message.channel.send(Embed({ title: lang.ModerationModule.Commands.Tempmute.Embeds.Unmuted.Title, description: lang.ModerationModule.Commands.Tempmute.Embeds.Unmuted.Description.replace(/{user}/g, user) }));
    
      if (config.Logs.Punishments.Enabled == true) {
        logs.send(Embed({
          title: lang.ModerationModule.Commands.Unmute.Embeds.Log.Title,
          fields: [{ name: lang.ModerationModule.Commands.Unmute.Embeds.Log.Fields[0], value: `${user} (${user.id})`}, { name: lang.ModerationModule.Commands.Unmute.Embeds.Log.Fields[1], value: '<@' + bot.user.id + '>'}],
          timestamp: new Date()
        }))
      }
    }, ms(args[1]));
  },
  description: lang.Help.CommandDescriptions.Tempmute,
  usage: 'tempmute <@user> <length> <reason>',
  aliases: []
}
// 159331   8501   645582    46027   1590459907   ad48cacf59f71a54e77c1bbc341ca7b4495d410c   645582
