const Discord = require("discord.js");
const Utils = require("../../modules/utils.js")
const Embed = Utils.Embed;
const config = Utils.variables.config;
const lang = Utils.variables.lang;

module.exports = {
    name: 'clear',
    run: async (bot, message, args) => {
        let role = Utils.findRole(config.Permissions.Staff_Commands.Clear, message.guild);
        let channel = Utils.ResolveChannel(message, 1, false, true);
        if (!channel) channel = message.channel;
        let error = false;

        if (!role) return message.channel.send(Embed({ preset: 'console' }));
        if (!Utils.hasPermission(message.member, config.Permissions.Staff_Commands.Clear)) return message.channel.send(Embed({ preset: 'nopermission' }));
        if (args.length == 0) return message.channel.send(Embed({ preset: 'invalidargs', usage: module.exports.usage }));
        if (isNaN(args[0]) || parseInt(args[0]) < 1) return message.channel.send(Embed({ preset: 'error', description: lang.ModerationModule.Commands.Clear.Errors.InvalidNumb, usage: module.exports.usage }));
        await message.delete();

        let amount = parseInt(args[0]);
        let fullBulkDeleteAmts = new Array(Math.floor(amount / 100));
        let bulkDeleteAmts = [...fullBulkDeleteAmts, (amount - (fullBulkDeleteAmts.length * 100))];

        await Utils.asyncForEach(bulkDeleteAmts, async (amount, i) => {
            if (error) return;
            await channel.bulkDelete(amount ? amount : 100, false).then(messages => {
            }).catch(async err => {
                error = true;
                if (err.code == 50013) return message.channel.send(Embed({ preset: 'error', description: lang.ModerationModule.Commands.Clear.Errors.BotNoPerms }))
                else if (err.code == 50034) return message.channel.send(Embed({ preset: 'error', description: lang.ModerationModule.Commands.Clear.Errors.OlderThan14Days }))
                else {
                    console.log(err)
                    return message.channel.send(Embed({ preset: 'console' }));
                }
            });
            if ((i+1) !== bulkDeleteAmts.length) await Utils.delay(2)
        })

        if (!error) return message.channel.send(Embed({ title: lang.ModerationModule.Commands.Clear.Cleared.replace(/{amt}/g, args[0]), color: config.Success_Color })).then(msg => msg.delete({ timeout: 5000 }));
    },
    description: lang.Help.CommandDescriptions.Clear,
    usage: 'clear <amount> [channel]',
    aliases: [
        'purge'
    ]
}
// 159331   8501   645582    46027   1590459907   ad48cacf59f71a54e77c1bbc341ca7b4495d410c   645582
