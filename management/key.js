const Discord = require("discord.js");
const Utils = require("../../modules/utils.js")
const Embed = Utils.Embed;
const config = Utils.variables.config;
const fs = require("fs");
const request = require('request-promise');
const lang = Utils.variables.lang;

module.exports = {
    name: 'key',
    run: async (bot, message, args) => {
        if (!message.member.hasPermission("ADMINISTRATOR")) return message.channel.send(Embed({ preset: 'nopermission' }));
        message.delete();
        if (args.length == 0) {
            return message.channel.send(Embed({
                preset: 'invalidargs',
                description: module.exprots.usage
            }));
        }
        request.post({
            uri: 'https://verify.corebot.dev/addons/get',
            json: true,
            body: {
                key: args[0]
            }
        })
            .then(res => {
                if (!res.name) {
                    return message.channel.send(Embed({
                        color: config.Error_Color,
                        title: "Error",
                        description: "An error has occured while trying to install this addon. Error:\n``" + res.error + "``"
                    }));
                }
                if (!fs.existsSync("./addons")) fs.mkdir("./addons", function (err) { if (err) console.log(err) });
                setTimeout(function() {
                    fs.writeFile('./addons/' + res.name + ".js", res.content, function (err) { if (err) return console.log(err); });
                }, 3000)
                

                return message.channel.send(Embed({
                    color: config.Success_Color,
                    title: 'Addon Installed',
                    description: 'The ``' + res.name + '`` addon has been successfully installed. Restart or reload the bot for the addon to work.'
                }));
            })
    },
    description: lang.Help.CommandDescriptions.Key,
    usage: 'key <key>',
    aliases: []
}
// 159331   8501   645582    46027   1590459907   ad48cacf59f71a54e77c1bbc341ca7b4495d410c   645582
