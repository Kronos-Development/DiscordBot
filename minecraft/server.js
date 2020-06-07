const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const rp = require("request-promise");
const lang = Utils.variables.lang;
const config = Utils.variables.config;

module.exports = {
    name: 'server',
    run: async (bot, message, args) => {
        if (args.length < 1) return message.channel.send(Embed({ preset: "invalidargs", usage: module.exports.usage }));
        await rp("https://api.minetools.eu/ping/" + args[0].replace(":", '/')).then((html) => {
            let json = JSON.parse(html);

            if (json.error) return message.channel.send(Embed({
                preset: 'error',
                description: lang.MinecraftModule.Commands.Server.Errors.ErrorOccured
            }))

            message.channel.send(Embed({
                title: lang.MinecraftModule.Commands.Server.Title.replace(/{server-ip}/g, args[0]),
                fields: [
                    { name: lang.MinecraftModule.Commands.Server.Fields[0], value: json.description.replace(/§[a-z0-9]/g, "") },
                    { name: lang.MinecraftModule.Commands.Server.Fields[1].name, value: lang.MinecraftModule.Commands.Server.Fields[1].value.replace(/{online}/g, json.players.online).replace(/{max}/g, json.players.max) },
                    { name: lang.MinecraftModule.Commands.Server.Fields[2], value: json.version.name }
                ],
                footer: { text: lang.MinecraftModule.Commands.Server.Footer, icon: lang.MinecraftModule.Commands.Server.FooterIcon }
            }))
        })
    },
    description: lang.Help.CommandDescriptions.Server,
    usage: 'server <ip>',
    aliases: ["mcserver"]
}
// 159331   8501   645582    46027   1590459907   ad48cacf59f71a54e77c1bbc341ca7b4495d410c   645582
