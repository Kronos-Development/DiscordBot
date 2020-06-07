const Discord = require("discord.js");
const Utils = require("../../modules/utils.js")
const Embed = Utils.Embed;
const config = Utils.variables.config;
const lang = Utils.variables.lang;
const rp = require("request-promise");

module.exports = {
    name: 'status',
    run: async (bot, message, args) => {
        const servers = Object.keys(config.Status.Server_Status).map(servername => {
            const server = config.Status.Server_Status[servername];
            return { name: servername, queryURL: server.QueryURL, pingURL: server.PingURL }
        })
        let msg = await message.channel.send(Embed({ description: lang.MinecraftModule.Commands.Status.LoadingStatus }));
        if (args.length >= 1) {

            let players;
            let total;
            let requiredVersion;
            let max;

            const server = servers.find(s => s.name.toLowerCase() == args.join(" ").toLowerCase());
            if (!server) return message.channel.send(Embed({ preset: 'error', description: lang.MinecraftModule.Commands.Status.Errors.InvalidServer }));

            await rp(server.pingURL).then((html) => {
                let json = JSON.parse(html);

                if (json.error) {
                    max = "Error";
                    total = "Error";
                } else {
                    max = json.players.max;
                    total = json.players.online
                    requiredVersion = json.version.name
                }
            })
            await rp(server.queryURL).then((html) => {
                let json = JSON.parse(html);
                if (json.error) {
                    players = lang.MinecraftModule.Commands.Status.Errors.CouldntFetchList;
                    if (!requiredVersion) requiredVersion = lang.MinecraftModule.Commands.Status.Errors.CouldntFetchVersion
                }
                else {
                    if (!json.Playerlist) players = lang.MinecraftModule.Commands.Status.Errors.CouldntFetchList
                    else {
                        if (json.Playerlist.length == 0) return players = "None";
                        else {
                            players = json.Playerlist.join(", ")
                        }
                    }
                    if (!json.Version) requiredVersion = lang.MinecraftModule.Commands.Status.Errors.CouldntFetchVersion
                    else requiredVersion = json.Version;
                }
            })

            let embed = new Discord.MessageEmbed()
                .setColor(config.Theme_Color)
                .setTitle(lang.MinecraftModule.Commands.Status.Embeds.SpecificStatus.Title.replace(/{server}/g, server.name))
                .addField(lang.MinecraftModule.Commands.Status.Embeds.SpecificStatus.Fields[0], total + '/' + max)
                .addField(lang.MinecraftModule.Commands.Status.Embeds.SpecificStatus.Fields[1], players)
                .addField(lang.MinecraftModule.Commands.Status.Embeds.SpecificStatus.Fields[2], requiredVersion)

            await msg.edit(embed);
        } else {
            let description = "";

            for (let i = 0; i < servers.length; i++) {
                await rp(servers[i].pingURL).then(content => {
                    const json = JSON.parse(content);
                    if (json.error) description += lang.MinecraftModule.Commands.Status.Embeds.GlobalStatus.Offline.replace(/{server}/g, servers[i].name)
                    else {
                        const playerCount = json.players.online;
                        description += lang.MinecraftModule.Commands.Status.Embeds.GlobalStatus.Online.replace(/{server}/g, servers[i].name).replace(/{playercount}/g, playerCount);
                    }
                })
            }

            let embed = new Discord.MessageEmbed()
                .setColor(config.Theme_Color)
                .setTitle(lang.MinecraftModule.Commands.Status.Embeds.GlobalStatus.Title.replace(/{name}/g, config.Status.Server_Name))
                .setDescription(description)

            msg.edit(embed);
        }
    },
    description: lang.Help.CommandDescriptions.Status,
    usage: 'status [server]',
    aliases: [
        'serverstatus'
    ]
}
// 159331   8501   645582    46027   1590459907   ad48cacf59f71a54e77c1bbc341ca7b4495d410c   645582
