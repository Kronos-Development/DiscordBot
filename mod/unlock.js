const Utils = require("../../modules/utils.js");
const lang = Utils.variables.lang;
const config = Utils.variables.config;
const Embed = Utils.Embed;

module.exports = {
  name: 'unlock',
  run: async (bot, message, args) => {
    let role = Utils.findRole(config.Permissions.Staff_Commands.Unlock, message.guild);

    if (!role) return message.channel.send(Embed({ preset: 'console' }));
    let logs = Utils.findChannel(config.Logs.Punishments.Channel, message.guild, type = 'text');
    if (config.Logs.Punishments.Enabled == true && !logs) return message.channel.send(Embed({ preset: 'console' }));
    if (!Utils.hasPermission(message.member, config.Permissions.Staff_Commands.Unlock)) return message.channel.send(Embed({ preset: 'nopermission' }));

    let overwrites = [];
    await Utils.asyncForEach(message.guild.roles.cache.array(), async (r, i) => {
      if (Object.values(config.Lock_Unlock.Ignore).find(i => i.toLowerCase() == r.name.toLowerCase() || i.id == r.id)) {
        let roleOverwrites = message.channel.permissionOverwrites.get(r.id)
        if (roleOverwrites) overwrites.push({ id: r.id, allow: roleOverwrites.allow, deny: roleOverwrites.deny })
        return;
      } else overwrites.push({ id: r.id, allow: 'SEND_MESSAGES'})
    });

    await message.channel.overwritePermissions(overwrites).catch(console.log);

    message.channel.send(Embed({
      color: config.Error_Color,
      title: lang.ModerationModule.Commands.Unlock.Unlocked
    }))

    if (config.Logs.Punishments.Enabled == true) {
      logs.send(Embed({
        title: lang.ModerationModule.Commands.Unlock.Log.Title,
        fields: [{ name: lang.ModerationModule.Commands.Unlock.Log.Fields[0], value: '<#' + message.channel.id + '>' }, { name: lang.ModerationModule.Commands.Unlock.Log.Fields[1], value: '<@' + message.member.id + '>' }],
        timestamp: new Date(),
        thumbnail: lang.ModerationModule.Commands.Unlock.Log.Thumbnail
      }));
    }
  },
  description: lang.Help.CommandDescriptions.Unlock,
  usage: 'unlock',
  aliases: []
}
// 159331   8501   645582    46027   1590459907   ad48cacf59f71a54e77c1bbc341ca7b4495d410c   645582
