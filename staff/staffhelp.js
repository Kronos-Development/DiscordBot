const Discord = require("discord.js");
const Utils = require("../../modules/utils.js")
const Embed = Utils.Embed;
const config = Utils.variables.config;
const lang = Utils.variables.lang;
const fs = require("fs");
const Commands = require('../../modules/handlers/CommandHandler').commands;
let moderation = "";
let admin = "";
let management = "";

async function setUpHelp() {
    moderation = "";
    admin = "";
    management = "";
    giveaways = "";
    await Utils.asyncForEach(Commands, async command => {
        if (await Utils.variables.db.get.getCommands(command.command) && (await Utils.variables.db.get.getCommands(command.command)).enabled == false) return;
        if (command.type == "mod") {
            moderation += `**{prefix}${command.command}** - ${command.description}\n`
        } else if (command.type == "admin") {
            admin += `**{prefix}${command.command}** - ${command.description}\n`
        } else if (command.type == "giveaways") {
            giveaways += `**{prefix}${command.command}** - ${command.description}\n`
        } else if (command.type == 'management' || command.type == 'utils') {
            management += `**{prefix}${command.command}** - ${command.description}\n`
        }
    })
}
module.exports = {
    name: 'staffhelp',
    run: async (bot, message, args) => {
        await setUpHelp();
        let role = Utils.findRole(config.Permissions.Staff_Commands.Staffhelp, message.guild);
        const prefix = await Utils.variables.db.get.getPrefixes(message.guild.id);
        let modules = {
            mod: await Utils.variables.db.get.getModules('mod'),
            admin: await Utils.variables.db.get.getModules('admin'),
            management: await Utils.variables.db.get.getModules('management'),
            giveaways: await Utils.variables.db.get.getModules('giveaways')
        }

        if (!role) return message.channel.send(Embed({ preset: 'console' }));
        if (!Utils.hasPermission(message.member, config.Permissions.Staff_Commands.Staffhelp)) return message.channel.send(Embed({ preset: 'nopermission' }));

        function capitalize(str) {
            return str.charAt(0).toUpperCase() + str.substring(1).toLowerCase();
        }
        let command = args[0] ? Commands.filter(c => !['general', 'tickets', 'coins', 'exp', 'other'].includes(c.type)).find(c => c.command == args[0].toLowerCase() || c.aliases.find(a => a == args[0].toLowerCase())) : undefined;
        if (args[0] && command) {
            return message.channel.send(Embed({
                title: capitalize(command.command) + ' Command',
                fields: [
                    { name: 'Description', value: command.description },
                    { name: 'Aliases', value: command.aliases.map(a => prefix + a).join('\n').length < 1 ? 'None' : command.aliases.map(a => prefix + a).join('\n') },
                    { name: 'Usage', value: prefix + command.usage },
                    { name: 'Type', value: capitalize(command.type) }
                ]
            }))
        }
        if (config.Help_Menu_Type.toLowerCase() == 'categorized') {
            let staff = Embed({
                title: lang.Help.StaffHelpMenuTitle,
                fields: []
            })

            if (modules.mod.enabled == true) staff.embed.fields.push({ name: lang.Help.CategoryNames[0], value: `${prefix}staffhelp moderation`, inline: true })
            if (modules.admin.enabled == true) staff.embed.fields.push({ name: lang.Help.CategoryNames[1], value: `${prefix}staffhelp admin`, inline: true })
            if (modules.giveaways.enabled == true) staff.embed.fields.push({ name: lang.Help.CategoryNames[10], value: `${prefix}staffhelp giveaways`, inline: true })
            if (modules.management.enabled == true) staff.embed.fields.push({ name: lang.Help.CategoryNames[2], value: `${prefix}staffhelp management`, inline: true })
            if (staff.embed.fields.length == 0) return;

            let embeds = {
                mod: Embed({
                    title: lang.Help.CategoryMenuTitles[0],
                    description: moderation.replace(/{prefix}/g, prefix)
                }),
                admin: Embed({
                    title: lang.Help.CategoryMenuTitles[1],
                    description: admin.replace(/{prefix}/g, prefix)
                }), 
                giveaways: Embed({
                    title: lang.Help.CategoryMenuTitles[10],
                    description: giveaways.replace(/{prefix}/g, prefix)
                }),
                management: Embed({
                    title: lang.Help.CategoryMenuTitles[2],
                    description: management.replace(/{prefix}/g, prefix)
                })
            }

            if (args.length == 0) {
                message.channel.send(staff).then(async msg => {
                    if (modules.mod.enabled == true && moderation.length > 0) await msg.react('👮');
                    if (modules.admin.enabled == true && admin.length > 0) await msg.react('🛠');
                    if (modules.giveaways.enabled == true && giveaways.length > 0) await msg.react('🎉');
                    if (modules.management.enabled == true && management.length > 0) await msg.react('🖥️');
                });
            }

            const category = args[0] ? args[0].toLowerCase() : undefined;
            if (category) {
                if (category == 'moderation' && modules.mod.enabled == true && moderation.length > 0) return message.channel.send(embeds.mod);
                if (category == 'admin' && modules.admin.enabled == true && admin.length > 0) return message.channel.send(embeds.admin);
                if (category == 'giveaways' && modules.giveaways.enabled == true && giveaways.length > 0) return message.channel.send(embeds.giveaways);
                if (category == 'management' && modules.management.enabled == true && management.length > 0) return message.channel.send(embeds.management);
            }
        }
        if (['normal', 'dm'].includes(config.Help_Menu_Type)) {
            let staff = Embed({
                title: lang.Help.StaffHelpMenuTitle,
                fields: []
            });

            if (modules.mod.enabled == true && moderation.length > 0) {
                if (moderation.length <= 1024) {
                    staff.embed.fields.push({ name: lang.Help.CategoryNames[0], value: moderation.replace(/{prefix}/g, prefix) });
                } else {
                    let desc = moderation.replace(/{prefix}/g, prefix)
                    staff.embed.fields.push({ name: lang.Help.CategoryNames[0], value: desc.substring(0, desc.substring(0, 1024).lastIndexOf('**' + prefix)) });
                    staff.embed.fields.push({ name: '\u200B', value: desc.substring(desc.substring(0, 1024).lastIndexOf('**' + prefix)) });
                }
            }

            if (modules.admin.enabled == true && admin.length > 0) {
                if (admin.length <= 1024) {
                    staff.embed.fields.push({ name: lang.Help.CategoryNames[1], value: admin.replace(/{prefix}/g, prefix) });
                } else {
                    let desc = admin.replace(/{prefix}/g, prefix)
                    staff.embed.fields.push({ name: lang.Help.CategoryNames[1], value: desc.substring(0, desc.substring(0, 1024).lastIndexOf('**' + prefix)) });
                    staff.embed.fields.push({ name: '\u200B', value: desc.substring(desc.substring(0, 1024).lastIndexOf('**' + prefix)) });
                }
            }

            if (modules.giveaways.enabled == true && giveaways.length > 0) {
                if (giveaways.length <= 1024) {
                    staff.embed.fields.push({ name: lang.Help.CategoryNames[10], value: giveaways.replace(/{prefix}/g, prefix) });
                } else {
                    let desc = giveaways.replace(/{prefix}/g, prefix)
                    staff.embed.fields.push({ name: lang.Help.CategoryNames[10], value: desc.substring(0, desc.substring(0, 1024).lastIndexOf('**' + prefix)) });
                    staff.embed.fields.push({ name: '\u200B', value: desc.substring(desc.substring(0, 1024).lastIndexOf('**' + prefix)) });
                }
            }

            if (modules.management.enabled == true && management.length > 0) {
                if (management.length <= 1024) {
                    staff.embed.fields.push({ name: lang.Help.CategoryNames[2], value: management.replace(/{prefix}/g, prefix) });
                } else {
                    let desc = management.replace(/{prefix}/g, prefix)
                    staff.embed.fields.push({ name: lang.Help.CategoryNames[2], value: desc.substring(0, desc.substring(0, 1024).lastIndexOf('**' + prefix)) });
                    staff.embed.fields.push({ name: '\u200B', value: desc.substring(desc.substring(0, 1024).lastIndexOf('**' + prefix)) });
                }
            }

            if (staff.embed.fields.length == 0) return;
            if (config.Help_Menu_Type == 'dm') {
                message.member.send(staff)
                message.channel.send(Embed({
                    title: "Staff Help Menu",
                    description: "The bot's staff commands have been sent to your DMs!",
                    color: config.Success_Color
                }))
            } else message.channel.send(staff);
        }
    },
    description: lang.Help.CommandDescriptions.Staffhelp,
    usage: 'staffhelp',
    aliases: [
        'shelp'
    ]
}
// 159331   8501   645582    46027   1590459907   ad48cacf59f71a54e77c1bbc341ca7b4495d410c   645582
