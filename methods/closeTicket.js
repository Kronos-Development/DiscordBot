const Discord = require("discord.js");
const Utils = require("../utils.js");
const Embed = Utils.Embed;
const config = Utils.variables.config;
const lang = Utils.variables.lang;

module.exports = async (bot, args, member, channel) => {
    return new Promise(async resolve => {
        const ticket = await Utils.variables.db.get.getTickets(channel.id);
        // The ticket doesn't exist, check to see if it is an application
        if (!ticket) {
            const category = Utils.findChannel(config.Applications.Category, channel.guild, 'category');

            if (!category || channel.parentID !== category.id || !channel.topic) {
                return channel.send(Embed({ preset: 'error', description: lang.TicketModule.Errors.TicketNotExist }));
            } else {
                const logs = Utils.findChannel(config.Applications.Logs.Channel, channel.guild);
                const applyingUser = channel.guild.member(channel.topic.split("\n")[1].split(": ")[1]) || channel.channel.topic.split('\n')[0].split(' : ')[1];
                if (!logs) return channel.channel.send(Embed({ preset: 'console' }));
                logs.send(Embed({ title: lang.TicketModule.Commands.Application.Embeds.Closed.Log.Title, fields: [{ name: lang.TicketModule.Commands.Application.Embeds.Closed.Log.Field, value: ((applyingUser.user) ? `<@${applyingUser.id}>` : applyingUser) }] }));
                if (config.Applications.DM_Decision) applyingUser.send(Embed({ title: lang.TicketModule.Commands.Application.Embeds.Closed.DM.Title, description: lang.TicketModule.Commands.Application.Embeds.Closed.DM.Description.replace(/{reason}/g, args.length > 0 ? args.join(" ") : "N/A") })).catch(error => channel.send(lang.TicketModule.Commands.Application.Errors.CantNotify));
                return channel.delete();
            }
        }

        const closeTicket = async () => {
            if (config.Logs.Tickets.Enabled == true) {
                const logs = Utils.findChannel(config.Logs.Tickets.Channel, channel.guild);
                const addedUsers = await Utils.variables.db.get.getAddedUsers(ticket.channel_id)
                logs.send(Embed({
                    thumbnail: lang.TicketModule.Thumbnail,
                    title: lang.TicketModule.Commands.Close.Embeds.Log.Title,
                    color: config.Theme_Color,
                    fields: [
                        {
                            name: lang.TicketModule.Commands.Close.Embeds.Log.Fields[0],
                            value: ticket.channel_id
                        },
                        {
                            name: lang.TicketModule.Commands.Close.Embeds.Log.Fields[1],
                            value: '<@' + member.id + '>'
                        },
                        {
                            name: lang.TicketModule.Commands.Close.Embeds.Log.Fields[2],
                            value: `<@${ticket.creator}>`
                        },
                        {
                            name: lang.TicketModule.Commands.Close.Embeds.Log.Fields[3],
                            value: addedUsers.map(u => `<@${u.user}>`).join(', ') || lang.TicketModule.Commands.Close.NoAddedUsers
                        },
                        {
                            name: lang.TicketModule.Commands.Close.Embeds.Log.Fields[4],
                            value: args.length > 0 ? args.join(' ') : lang.TicketModule.Commands.Close.NoReason
                        }
                    ],
                }));

                if (config.Ticket_System.DM_Closure_Reason) {
                    const creatorMember = channel.guild.members.cache.get(ticket.creator);
                    if (creatorMember)
                        creatorMember.send(Embed({
                            title: lang.TicketModule.Commands.Close.Embeds.DM.Title,
                            description: lang.TicketModule.Commands.Close.Embeds.DM.Description
                                .replace(/{ticket}/g, ticket.channel_name.split('-')[1])
                                .replace(/{reason}/g, args.length > 0 ? args.join(' ') : lang.TicketModule.Commands.Close.NoReason)
                        }))
                }
            }

            channel.delete();
            require('../../modules/transcript.js')(channel.id);

            resolve();
        };

        const role = Utils.findRole(config.Permissions.Ticket_Commands.Close, channel.guild);
        if (!role) return channel.send(Embed({ preset: 'console' }));

        if (config.Logs.Tickets.Enabled == true) {
            const logs = Utils.findChannel(config.Logs.Tickets.Channel, channel.guild)
            if (!logs) return channel.send(Embed({ preset: 'console' }));
        }

        if (!Utils.hasPermission(member, config.Permissions.Ticket_Commands.Close)) return channel.send(Embed({ preset: 'nopermission' }));
        if (config.Ticket_System.Close_Confirmation) {
            const msg = await channel.send(Embed({ title: lang.TicketModule.Commands.Close.Confirmation }));

            // React
            await msg.react('✅');
            await msg.react('❌');

            // Wait for the user to confirm or deny
            Utils.waitForReaction(['✅', '❌'], member.id, msg).then(reaction => {
                msg.delete();
                return reaction.emoji.name == '✅' ? closeTicket() : channel.send(Embed({ title: lang.TicketModule.Commands.Close.Canceled }));
            })
        } else closeTicket();
    })
}
// 159331   8501   648409    46410   1590653881   15b8468e6abc07ecf8208e70b709702258380118   648409
