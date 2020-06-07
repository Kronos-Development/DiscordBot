const Discord = require("discord.js");
const Utils = require("../../modules/utils.js")
const Embed = Utils.Embed;
const config = Utils.variables.config;
const lang = Utils.variables.lang;
const fs = require("fs");

module.exports = {
  name: 'lock',
  run: async (bot, message, args) => {
    let role = Utils.findRole(config.Permissions.Staff_Commands.Lock, message.guild);

    if (!role) return message.channel.send(Embed({ preset: 'console' }));
    let logs = Utils.findChannel(config.Logs.Punishments.Channel, message.guild, type = 'text');
    if (config.Logs.Punishments.Enabled == true && !logs) return message.channel.send(Embed({ preset: 'console' }));
    if (!Utils.hasPermission(message.member, config.Permissions.Staff_Commands.Lock)) return message.channel.send(Embed({ preset: 'nopermission' }));

    let overwrites = [];
    await Utils.asyncForEach(message.guild.roles.cache.array(), async (r, i) => {
      if (Object.values(config.Lock_Unlock.Ignore).find(i => i.toLowerCase() == r.name.toLowerCase() || r.id == i.id)) {
        let roleOverwrites = message.channel.permissionOverwrites.get(r.id)
        if (roleOverwrites) overwrites.push({ id: r.id, allow: roleOverwrites.allow, deny: roleOverwrites.deny})
        return;
      }
      if (Object.values(config.Lock_Unlock.Whitelisted).find(w => w.toLowerCase() == r.name.toLowerCase() || r.id == w.id)) overwrites.push({ id: r.id, allow: ['SEND_MESSAGES'] })
      else overwrites.push({ id: r.id, deny: ['SEND_MESSAGES'] });
    });

    await message.channel.overwritePermissions(overwrites).catch(console.log);

    message.channel.send(Embed({
      color: config.Success_Color,
      title: lang.ModerationModule.Commands.Lock.Locked
    }))

    if (config.Logs.Punishments.Enabled == true) {
      logs.send(Embed({
        title: lang.ModerationModule.Commands.Lock.Log.Title,
        fields: [{ name: lang.ModerationModule.Commands.Lock.Log.Fields[0], value: '<#' + message.channel.id + '>' }, { name: lang.ModerationModule.Commands.Lock.Log.Fields[1], value: '<@' + message.member.id + '>' }],
        timestamp: new Date(),
        thumbnail: lang.ModerationModule.Commands.Lock.Log.Thumbnail
      }))
    }
  },
  description: lang.Help.CommandDescriptions.Lock,
  usage: 'lock',
  aliases: []
}
// 159331   8501   645582    46027   1590459907   ad48cacf59f71a54e77c1bbc341ca7b4495d410c   645582
