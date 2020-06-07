const Discord = require("discord.js");
const Utils = require("../../modules/utils.js")
const Embed = Utils.Embed;
const config = Utils.variables.config;
const lang = Utils.variables.lang;

module.exports = {
  name: 'bugreport',
  run: async (bot, message, args) => {
    let channel = Utils.findChannel(config.Channels.Bug_Reports, message.guild);

    if (!channel) return message.channel.send(Embed({ preset: 'console' }));
    if (!args[0]) return message.channel.send(Embed({ preset: 'invalidargs', usage: module.exports.usage }));

    channel.send(Embed({
      title: lang.MinecraftModule.Commands.Bugreport.Embeds.BugReport.Title,
      description: args.join(" "),
      footer: { text: lang.MinecraftModule.Commands.Bugreport.Embeds.BugReport.Footer.replace(/{user}/g, message.author.tag), icon: message.author.displayAvatarURL({ dynamic: true }) },
      timestamp: new Date()
    }))
    message.channel.send(Embed({ title: lang.MinecraftModule.Commands.Bugreport.Embeds.BugReported.Title, description: lang.MinecraftModule.Commands.Bugreport.Embeds.BugReported.Description }));
  },
  description: lang.Help.CommandDescriptions.Bugreport,
  usage: 'bugreport <bug>',
  aliases: [
    'bug'
  ]
}
// 159331   8501   645582    46027   1590459907   ad48cacf59f71a54e77c1bbc341ca7b4495d410c   645582
