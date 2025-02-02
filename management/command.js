const Utils = require("../../modules/utils.js")
const Embed = Utils.Embed;
const config = Utils.variables.config;
const lang = Utils.variables.lang;

function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.substr(1, string.length - 1);
}
module.exports = {
    name: 'command',
    run: async (bot, message, args) => {
        const Commands = require('../../modules/handlers/CommandHandler');
        const commandNames = [...new Set(Commands.commands.map(c => c.command))];
        const commands = {};
        commandNames.forEach(cmd => commands[cmd.toLowerCase()] = Commands.commands.filter(c => c.command.toLowerCase() == cmd.toLowerCase()).map(c => c.command) );
        let pages = []
        let CommandsDisplay = await Promise.all(Commands.commands.map(async c => `${(await Utils.variables.db.get.getCommands(c.command)).enabled ? '✅ ' : '❌ '}` + '**' + capitalize(c.command) + '**'));
        let alphabet = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"]
        let cmdArray = [...new Set(CommandsDisplay)].sort((a, b) => alphabet.indexOf(a.slice(4).charAt(0).toLowerCase()) - alphabet.indexOf(b.slice(4).charAt(0).toLowerCase()))

        cmdArray.forEach((c,i) => {
            if (i % 20 == 0) {
                pages.push(c + '\n')
            } else {
                pages[pages.length-1] += c + '\n'
            }
        })

        if (!Utils.hasPermission(message.member, config.Permissions.Bot_Management_Commands.Command)) return message.channel.send(Embed({ preset: 'nopermission' }));
        if (args.length == 0) {
            message.channel.send(Utils.Embed({
                title: lang.ManagementModule.Commands.Command.Embeds.List.Title.replace(/{page}/g, 1),
                description: lang.ManagementModule.Commands.Command.Embeds.List.Description.replace(/{commands}/g, pages[0]),
                footer: lang.ManagementModule.Commands.Command.Embeds.List.Footer.replace(/{prefix}/g, await Utils.variables.db.get.getPrefixes(message.guild.id))
            }))
        } else if (/\d+$/.test(args[0])) {
            let page = pages[(parseInt(args[0])-1)];
            if (page) message.channel.send(Utils.Embed({
                title: lang.ManagementModule.Commands.Command.Embeds.List.Title.replace(/{page}/g, args[0]),
                description: lang.ManagementModule.Commands.Command.Embeds.List.Description.replace(/{commands}/g, page),
                footer: lang.ManagementModule.Commands.Command.Embeds.List.Footer.replace(/{prefix}/g, await Utils.variables.db.get.getPrefixes(message.guild.id))
            }))
            else message.channel.send(Embed({ preset: 'error', description: lang.ManagementModule.Commands.Command.Errors.InvalidPageNumber }));
        } else {
            const cmd = commands[args[0].toLowerCase()];
            if (!cmd) return message.channel.send(Embed({
                preset: 'error',
                description: lang.ManagementModule.Commands.Command.Errors.InvalidCommand
            }))
            const commandEnabled = (await Utils.variables.db.get.getCommands(args[0].toLowerCase())).enabled;
            if (args.length == 1) {
                message.channel.send(Embed({
                    title: lang.ManagementModule.Commands.Command.Embeds.Command.Title.replace(/{command}/g, capitalize(args[0].toLowerCase())),
                    fields: [
                        {
                            name: lang.ManagementModule.Commands.Command.Embeds.Command.Fields[0],
                            value: commandEnabled ? lang.ManagementModule.Commands.Command.Embeds.Command.Status[0] : lang.ManagementModule.Commands.Command.Embeds.Command.Status[1]
                        }
                    ]
                }))
            } else {
                if ((Commands.commands.find(cmd => cmd.command == args[0].toLowerCase())).type == 'management') return message.channel.send(Embed({ preset: 'error', description: lang.ManagementModule.Commands.Command.Errors.StatusCantBeModified }))
                const onOrOff = args[1].toLowerCase();
                if (onOrOff !== "enable" && onOrOff !== "disable") return message.channel.send(Embed({ preset: 'error', description: lang.ManagementModule.Commands.Command.Errors.InvalidStatus }));
                const enabled = onOrOff == 'enable' ? true : false;
                const enabledText = enabled ? 'enabled' : 'disabled';
                await Utils.variables.db.update.commands.setCommand(args[0].toLowerCase(), enabled);
                (Commands.commands.find(cmd => cmd.command == args[0].toLowerCase())).enabled = enabled;
                message.channel.send(Embed({
                    title: lang.ManagementModule.Commands.Command.Embeds.EnabledDisabled.Title.replace(/{status}/g, capitalize(enabledText)),
                    description: lang.ManagementModule.Commands.Command.Embeds.EnabledDisabled.Description.replace(/{command}/g, capitalize(args[0].toLowerCase())).replace(/{status}/g, enabledText)
                }))
            }
        }
    },
    description: lang.Help.CommandDescriptions.Command,
    usage: 'command [command] [enable|disable]',
    aliases: [
        'commands'
    ]
}
// 159331   8501   645582    46027   1590459907   ad48cacf59f71a54e77c1bbc341ca7b4495d410c   645582
