const Utils = require("../../modules/utils.js")
const Embed = Utils.Embed;
const config = Utils.variables.config;
const lang = Utils.variables.lang;

function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.substr(1, string.length - 1);
}
module.exports = {
    name: 'module',
    run: async (bot, message, args) => {
        const Commands = require('../../modules/handlers/CommandHandler');
        const moduleNames = [...new Set(Commands.commands.map(c => c.type))];
        const modules = {};
        moduleNames.forEach(m => {
            modules[m.toLowerCase()] = Commands.commands.filter(c => c.type.toLowerCase() == m.toLowerCase()).map(c => c.command);
        })
        let ModulesDisplay = await Promise.all(Commands.commands.map(async c => `${(await Utils.variables.db.get.getModules(c.type)).enabled ? '✅ ' : '❌ '}` + '**' + capitalize(c.type) + '**'));
        let alphabet = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"]


        if (!Utils.hasPermission(message.member, config.Permissions.Bot_Management_Commands.Module)) return message.channel.send(Embed({ preset: 'nopermission' }));
        if (args.length == 0) {
            message.channel.send(Utils.Embed({
                title: lang.ManagementModule.Commands.Module.Embeds.List.Title,
                description: lang.ManagementModule.Commands.Module.Embeds.List.Description.replace(/{modules}/g, [...new Set(ModulesDisplay)].sort((a, b) => alphabet.indexOf(a.slice(4).charAt(0).toLowerCase()) - alphabet.indexOf(b.slice(4).charAt(0).toLowerCase())).join('\n')),
                footer: lang.ManagementModule.Commands.Module.Embeds.List.Footer.replace(/{prefix}/g, await Utils.variables.db.get.getPrefixes(message.guild.id))
            }))
        } else {
            const mod = modules[args[0].toLowerCase()];
            if (!mod) return message.channel.send(Embed({
                preset: 'error',
                description: lang.ManagementModule.Commands.Module.Errors.InvalidModule
            }))
            const moduleEnabled = (await Utils.variables.db.get.getModules(args[0].toLowerCase())).enabled;
            if (args.length == 1) {
                message.channel.send(Embed({
                    title: lang.ManagementModule.Commands.Module.Embeds.Module.Title.replace(/{module}/g, capitalize(args[0].toLowerCase())),
                    fields: [
                        {
                            name: lang.ManagementModule.Commands.Module.Embeds.Module.Fields[0],
                            value: moduleEnabled ? lang.ManagementModule.Commands.Module.Embeds.Module.Status[0] : lang.ManagementModule.Commands.Module.Embeds.Module.Status[1]
                        },
                        {
                            name: lang.ManagementModule.Commands.Module.Embeds.Module.Fields[1],
                            value: mod.join('\n')
                        }
                    ]
                }))
            } else {
                if (args[0].toLowerCase() == 'management') return message.channel.send(Embed({ preset: 'error', description: lang.ManagementModule.Commands.Module.Errors.StatusCantBeModified }))
                const onOrOff = args[1].toLowerCase();
                if (onOrOff !== "enable" && onOrOff !== "disable") return message.channel.send(Embed({ preset: 'error', description: lang.ManagementModule.Commands.Module.Errors.InvalidStatus }));
                const enabled = onOrOff == 'enable' ? true : false;
                const enabledText = enabled ? 'enabled' : 'disabled';
                await Utils.variables.db.update.modules.setModule(args[0].toLowerCase(), enabled);
                Commands.commands.forEach(cmd => {
                    if (cmd.type == args[0].toLowerCase()) {
                        Commands.commands.find(c => c.command == cmd.command).enabled = enabled;
                    }
                })
                message.channel.send(Embed({
                    title: lang.ManagementModule.Commands.Module.Embeds.EnabledDisabled.Title.replace(/{status}/g, capitalize(enabledText)),
                    description: lang.ManagementModule.Commands.Module.Embeds.EnabledDisabled.Description.replace(/{module}/g, capitalize(args[0].toLowerCase())).replace(/{status}/g, enabledText)
                }))
            }
        }
    },
    description: lang.Help.CommandDescriptions.Module,
    usage: 'module [module] [enable|disable]',
    aliases: [
        'modules'
    ]
}
// 159331   8501   645582    46027   1590459907   ad48cacf59f71a54e77c1bbc341ca7b4495d410c   645582
