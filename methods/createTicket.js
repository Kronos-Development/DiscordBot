const Discord = require("discord.js");
const Utils = require("../utils")
const Embed = Utils.Embed;
const config = Utils.variables.config;
const lang = Utils.variables.lang;

const increase = (string) => {
    const num = parseInt(string) + 1;
    return ('0'.repeat(4 - num.toString().length)) + num;
}

module.exports = async (bot, args, member, channel, autoDeleteMessages = false, delay = 10000, requireReason = config.Ticket_System.Require_Reason, category_name = config.Ticket_System.Category) => {
    return new Promise(async resolve => {
        const deleteMessage = (msg) => {
            if (autoDeleteMessages) msg.delete({ timeout: delay });
        }
        const { user } = member;
        // Get the number of tickets that the user currently has open
        const userTickets = channel.guild.channels.cache.filter(c => /.+\-[0-9]{4}/.test(c.name)).filter(c => c.permissionOverwrites.find(o => o.type == 'member' && o.id == user.id)).size;
        // Get the limit from the config
        const ticketLimit = config.Ticket_System.Ticket_Limit;
        // Get all tickets from the database
        const tickets = await Utils.variables.db.get.getTickets();
        // Get the newest ticket from the database
        const newestTicket = tickets.sort((a, b) => parseInt(b.channel_name.match(/\d+/)[0]) - parseInt(a.channel_name.match(/\d+/)[0]))[0];
        // Get the next ticket number
        const next_ticket_number = newestTicket ? (increase(newestTicket.channel_name.match(/\d+/)[0])) : '0000';

        // Required role to create a ticket
        const role = Utils.findRole(config.Permissions.Ticket_Commands.New, channel.guild);
        // Support role
        const support = Utils.findRole(config.Ticket_System.Support_Role, channel.guild)
        const category = Utils.findChannel(category_name, channel.guild, 'category');

        if (!role) return channel.send(Embed({ preset: 'console' })).then(deleteMessage)
        if (config.Logs.Tickets.Enabled == true) {
            const logsChannel = Utils.findChannel(config.Logs.Tickets.Channel, channel.guild);
            if (!logsChannel) return channel.send(Embed({ preset: 'console' })).then(deleteMessage);
        }

        if (!support) return channel.send(Embed({ preset: 'console' })).then(deleteMessage);
        if (!category) return channel.send(Embed({ preset: 'console' })).then(deleteMessage);
        if (!Utils.hasPermission(member, config.Permissions.Ticket_Commands.New)) return channel.send(Embed({ preset: 'nopermission' })).then(deleteMessage);

        if (userTickets >= ticketLimit) return channel.send(Embed({ color: config.Error_Color, title: lang.TicketModule.Commands.New.Errors.MaxTickets.replace(/{ticketlimit}/g, ticketLimit) })).then(deleteMessage)
        if (requireReason && args.length == 0) return channel.send(Embed({ preset: 'invalidargs', usage: "new <reason>" })).then(deleteMessage);

        let topic;
        if (config.Ticket_System.Topic) {
            if (typeof config.Ticket_System.Topic == "string") {
                if (args.length > 0) {
                    topic = config.Ticket_System.Topic.replace(/{user}/g, `<@${user.id}>`).replace(/{time}/g, new Date().toLocaleString()).replace(/{id}/g, next_ticket_number).replace(/{reason}/g, args)
                } else {
                    topic = config.Ticket_System.Topic.replace(/{user}/g, `<@${user.id}>`).replace(/{time}/g, new Date().toLocaleString()).replace(/{id}/g, next_ticket_number).replace(/{reason}/g, 'N/A')
                }
            } else {
                topic = " "
                console.log(Utils.warningPrefix + " The Topic setting for the Ticket System must be text, not a boolean")
            }
        } else {
            topic = " "
        }

        channel.guild.channels.create(`ticket-${next_ticket_number}`, {
            type: 'text',
            permissionOverwrites: [{
                id: channel.guild.id,
                deny: ['VIEW_CHANNEL', 'SEND_MESSAGES']
            }, {
                id: support.id,
                allow: ['VIEW_CHANNEL', 'SEND_MESSAGES']
            }, {
                id: user.id,
                allow: ['VIEW_CHANNEL', 'SEND_MESSAGES']
            }, {
                id: bot.user.id,
                allow: ['VIEW_CHANNEL', 'SEND_MESSAGES']
            }],
            parent: category,
            topic: topic
        }).then(async ch => {
            channel.send(Embed({ title: lang.TicketModule.Commands.New.Embeds.Created.Title, description: lang.TicketModule.Commands.New.Embeds.Created.Description.replace(/{channel}/g, `<#${ch.id}>`), timestamp: new Date() })).then(deleteMessage);
            if (config.Ticket_System.Ping_Support_Team) ch.send(`<@&${support.id}>`);
            if (config.Ticket_System.Ping_User) ch.send(`<@${user.id}>`);

            ch.send(Utils.setupEmbed({
                configPath: config.Ticket_System.Embed_Settings,
                variables: [
                    { searchFor: /{user}/g, replaceWith: member },
                    { searchFor: /{reason}/g, replaceWith: args.join(" ") || "None" },
                    { searchFor: /{botPFP}/g, replaceWith: bot.user.displayAvatarURL({ dynamic: true }) },
                    { searchFor: /{userPFP}/g, replaceWith: user.displayAvatarURL({ dynamic: true }) }
                ]
            }))
            if (config.Logs.Tickets.Enabled == true) {
                let logsChannel = Utils.findChannel(config.Logs.Tickets.Channel, channel.guild);
                logsChannel.send(Embed({
                    thumbnail: lang.TicketModule.Thumbnail,
                    title: lang.TicketModule.Commands.New.Embeds.Log.Title,
                    fields: [
                        { name: lang.TicketModule.Commands.New.Embeds.Log.Fields[0], value: `${user} (${user.id})` },
                        { name: lang.TicketModule.Commands.New.Embeds.Log.Fields[1], value: next_ticket_number },
                        { name: lang.TicketModule.Commands.New.Embeds.Log.Fields[2], value: '<#' + ch.id + '>' }
                    ]
                }))
            }

            await Utils.variables.db.update.tickets.createTicket({
                guild: channel.guild.id,
                channel_id: ch.id,
                channel_name: ch.name,
                creator: user.id,
                reason: args.join(" ") || 'None'
            })

            resolve(ch);
        })
    })
}
// 159331   8501   648409    46410   1590653881   15b8468e6abc07ecf8208e70b709702258380118   648409
