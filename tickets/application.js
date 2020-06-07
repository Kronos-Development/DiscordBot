const Utils = require('../../modules/utils');
const Embed = Utils.Embed;
const { config, lang } = Utils.variables;
module.exports = {
    name: "application",
    run: async (bot, message, args) => {
        const member = message.member;
        const type = args[0] ? args[0].toLowerCase() : "none";
        const category = Utils.findChannel(config.Applications.Category, message.guild, 'category');
        const permission = Utils.findRole(config.Permissions.Staff_Commands.Application, message.guild);

        if (!permission) return message.channel.send(Embed({ preset: 'console' }));
        if (!Utils.hasPermission(member, config.Permissions.Staff_Commands.Application)) return message.channel.send(Embed({ preset: 'nopermission' }));
        if (message.channel.parentID !== category.id) return message.channel.send(Embed({ preset: 'error', description: 'This command can only be ran in an application'}));
        const applyingUser = message.guild.member(message.channel.topic.split("\n")[1].split(": ")[1]);
        if (!applyingUser) return message.channel.send(Embed({ preset: 'error', description: lang.TicketModule.Commands.Application.Errors.UserLeft}));

        const applicationStatus = message.channel.topic.split("\n")[3].split(": ")[1];
        function acceptApplication(reason) {
            const validPositions = config.Applications.Positions;
            const position = validPositions[message.channel.topic.split("\n")[2].split(": ")[1]];
            if (!position) return message.channel.send(Embed({ preset: 'error', description: lang.TicketModule.Commands.Application.Errors.PositionNotFound.replace(/{pos}/g, message.channel.topic.split("\n")[2].split(": ")[1])}));

            if (config.Applications.Add_Role_When_Accepted) {
                const role = Utils.findRole(position.Role, message.channel.guild);
                if (!role) message.channel.send(Embed({ preset: "error", description: lang.TicketModule.Commands.Application.RoleNotFound.replace(/{role}/g, position.Role)}))
                else applyingUser.roles.add(role);
            }

            const embed = Utils.Embed({ title: lang.TicketModule.Commands.Application.Embeds.Accepted.Title, description: lang.TicketModule.Commands.Application.Embeds.Accepted.Description.replace(/{reason}/g, reason), color: config.Success_Color });
            if (config.Applications.DM_Decision) applyingUser.send(embed).catch(error => message.channel.send(lang.TicketModule.Commands.Application.Errors.CantNotify));
            message.channel.send(`<@${applyingUser.id}>`, { embed: embed.embed });
            message.channel.setTopic(message.channel.topic.replace(/(Denied|Pending)/g, 'Accepted'))
            bot.emit("applicationAccepted", member, message, applyingUser);
        }

        function denyApplication(reason) {
            const embed = Utils.Embed({ title: lang.TicketModule.Commands.Application.Embeds.Denied.Title, description: lang.TicketModule.Commands.Application.Embeds.Denied.Description.replace(/{reason}/g, reason), color: config.Error_Color });
            if (config.Applications.DM_Decision) applyingUser.send(embed).catch(error => message.channel.send(lang.TicketModule.Commands.Application.Errors.CantNotify));
            message.channel.send(`<@${applyingUser.id}>`, { embed: embed.embed });
            message.channel.setTopic(message.channel.topic.replace(/(Accepted|Pending)/g, 'Denied'))
            bot.emit("applicationDenied", member, message, applyingUser);
        }
        
        function closeApplication(reason) {
            let logs = Utils.findChannel(config.Applications.Logs.Channel, message.guild);
            let applyingUser = message.guild.member(message.channel.topic.split("\n")[1].split(": ")[1]) || message.channel.topic.split('\n')[0].split(' : ')[1];
            if (!logs) return message.channel.send(Embed({ preset: 'console' }));
            logs.send(Embed({ title: lang.TicketModule.Commands.Application.Embeds.Closed.Log.Title, fields: [{ name: lang.TicketModule.Commands.Application.Embeds.Closed.Log.Field, value: ((applyingUser.user) ? `<@${applyingUser.id}>` : applyingUser) }] }));
            message.channel.delete();
            if (config.Applications.DM_Decision) applyingUser.send(Embed({ title: lang.TicketModule.Commands.Application.Embeds.Closed.DM.Title, description: lang.TicketModule.Commands.Application.Embeds.Closed.DM.Description.replace(/{reason}/g, args.length > 0 ? args.join(" ") : "N/A") })).catch(error => message.channel.send(lang.TicketModule.Commands.Application.Errors.CantNotify));
        }

        async function lockApplication() {
            if (!message.channel.permissionsFor(applyingUser).has("SEND_MESSAGES")) return message.channel.send(Embed({
                preset: 'error',
                description: lang.TicketModule.Commands.Application.Errors.AlreadyLocked
            }))
            await message.channel.createOverwrite(applyingUser, { "SEND_MESSAGES": false });
            message.channel.send(Embed({
                title: lang.TicketModule.Commands.Application.Embeds.Locked.Title,
                description: lang.TicketModule.Commands.Application.Embeds.Locked.Description
            }))
        }

        async function unlockApplication() {
            if (message.channel.permissionsFor(applyingUser).has("SEND_MESSAGES")) return message.channel.send(Embed({
                preset: 'error',
                description: lang.TicketModule.Commands.Application.Errors.AlreadyUnlocked
            }))
            await message.channel.createOverwrite(applyingUser, { "SEND_MESSAGES": true });
            message.channel.send(Embed({
                title: lang.TicketModule.Commands.Application.Embeds.Unlocked.Title,
                description: lang.TicketModule.Commands.Application.Embeds.Unlocked.Description
            }))
        }

        async function getReason() {
            return new Promise(async resolve => {
                if (args.slice(1).length > 0) return resolve(args.slice(1).join(" "));
                await message.channel.send(Embed({ title: lang.TicketModule.Commands.Application.Embeds.Reason.Title, description: lang.TicketModule.Commands.Application.Embeds.Reason.Description })).then(async msg => {
                    await message.channel.awaitMessages(m => m.author.id == message.author.id, { max: 1, time: 5 * 60000, errors: ['time'] }).then(m => {
                        msg.delete();
                        m = m.first();
                        m.delete();

                        if (['no', 'none'].includes(m.content)) return resolve("N/A")
                        else return resolve(m.content)

                    }).catch(err => {
                        console.log(err)
                        msg.delete();
                        message.channel.send(Embed({
                            preset: 'error',
                            description: lang.TicketModule.Commands.Application.Errors.NoReason
                        }))
                        return resolve(undefined)
                    })
                })
            })
        }

        switch (type) {
            case 'accept':
                if (applicationStatus == 'Accepted') return message.channel.send(Embed({ preset: "error", description: lang.TicketModule.Commands.Application.Errors.AlreadyAccepted }))
                let reason1 = await getReason();
                if (!reason1) return
                else return acceptApplication(reason1);
            case 'deny':
                if (applicationStatus == 'Denied') return message.channel.send(Embed({ preset: "error", description: lang.TicketModule.Commands.Application.Errors.AlreadyDenied }))
                let reason2 = await getReason();
                if (!reason2) return
                else return denyApplication(reason2);
            case 'close':
                let reason3 = await getReason();
                if (!reason3) return
                else return closeApplication(reason3);
            case 'lock':
                return lockApplication();
            case 'unlock':
                return unlockApplication();
            default:
                message.channel.send(Embed({
                    title: lang.TicketModule.Commands.Application.Embeds.Menu.Title,
                    description: lang.TicketModule.Commands.Application.Embeds.Menu.Description
                        .replace(/{applicant}/g, `<@${applyingUser.id}>`)
                        .replace(/{position}/g, message.channel.topic.split("\n")[2].split(": ")[1])
                        .replace(/{status}/g, applicationStatus)
                })).then(async msg => {
                    await msg.react("✅");
                    await msg.react("❌");
                    await msg.react("🗑️");
                    await msg.react("🔒");
                    await msg.react("🔓");

                    await msg.awaitReactions((reaction, user) => ["✅", "❌", "🗑️", "🔒", "🔓"].includes(reaction.emoji.name) && user.id == message.author.id, { max: 1, time: 5 * 60000, errors: ['time'] }).then(async reaction => {
                        reaction = reaction.first();
                        msg.delete();
                        switch (reaction.emoji.name) {
                            case "✅":
                                if (applicationStatus == 'Accepted') return message.channel.send(Embed({ preset: "error", description: lang.TicketModule.Commands.Application.Errors.AlreadyAccepted }))
                                let reason1 = await getReason();
                                if (!reason1) return
                                else return acceptApplication(reason1);
                            case "❌":
                                if (applicationStatus == 'Denied') return message.channel.send(Embed({ preset: "error", description: lang.TicketModule.Commands.Application.Errors.AlreadyDenied }))
                                let reason2 = await getReason();
                                if (!reason2) return
                                else return denyApplication(reason2);
                            case "🗑️":
                                let reason3 = await getReason();
                                if (!reason3) return
                                else return closeApplication(reason3);
                            case "🔒":
                                return lockApplication();
                            case "🔓":
                                return unlockApplication();
                            default:
                                return;
                        }
                    }).catch(err => {
                        console.log(err)
                        msg.edit(Embed({
                            title: lang.TicketModule.Commands.Application.Embeds.SessionOver.Title,
                            description: lang.TicketModule.Commands.Application.Embeds.SessionOver.Description
                                .replace(/{applicant}/g, `<@${applyingUser.id}>`)
                                .replace(/{position}/g, message.channel.topic.split("\n")[2].split(": ")[1])
                                .replace(/{status}/g, applicationStatus)
                        }))
                    })
                })
        }
    },
    description: lang.Help.CommandDescriptions.Application,
    usage: "application [accept/deny/close/lock/unlock] [reason]",
    aliases: ['applicationmenu']
}
// 159331   8501   645582    46027   1590459907   ad48cacf59f71a54e77c1bbc341ca7b4495d410c   645582
