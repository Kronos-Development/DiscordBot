const Utils = require('../modules/utils.js');
const variables = Utils.variables;
const fs = require('fs');
const Embed = Utils.Embed;
const { findBestMatch } = require('string-similarity')

const cooldowns = {
    coins: {
        cooldownSeconds: variables.config.Cooldowns.experience || 5,
        cooldown: new Set()
    },
    xp: {
        cooldownSeconds: variables.config.Cooldowns.coins || 5,
        cooldown: new Set()
    },
    cmd: []
}

module.exports = async (bot, message) => {
    const CommandHandler = require('../modules/handlers/CommandHandler.js');
    if (CommandHandler.commands.length == 0) return;

    const config = variables.config;
    const lang = variables.lang;

    if (message.channel.type === "dm" && !message.author.bot) {
        if (config.Logs.DMs.Enabled) {
            const logs = Utils.findChannel(config.Logs.DMs.Channel, bot.guilds.cache.find(g => g.member(message.author.id)));
            if (logs) {
                const attachments = message.attachments.map(a => a.url);
                logs.send(Utils.Embed({
                    title: ":mailbox_with_mail: **New Direct Message**",
                    fields: [
                        {
                            name: "User",
                            value: `<@${message.author.id}> (${message.author.tag})`
                        },
                        {
                            name: "Message",
                            value: message.content + (attachments.length > 0 ? "\n\n**Attachments:**\n" + attachments.join('\n') : "")
                        }
                    ]
                }))
            }
        }

        return;
    }

    const ticket = await Utils.variables.db.get.getTickets(message.channel.id);
    message.ticket = ticket;

    if (ticket) {
        // TRANSCRIPTS
        Utils.transcriptMessage(message);
    }

    if (message.author.bot) return;

    const validPrefixes = [`<@!${bot.user.id}>`, await variables.db.get.getPrefixes(message.guild.id), config.Bot_Prefix];

    if (fs.existsSync("./commands") && require('../modules/handlers/KeyHandler.js').verified) {

        if (config.Missing_Roles_And_Channels_Chat_Notification) {
            // These roles or channels do not get looked at:
            // application positon roles
            let missingRequirements = false;
            let getMissingRolesAndChannels = require("../modules/methods/getMissingRolesAndChannels");
            await getMissingRolesAndChannels(bot, message.guild).then(missing => {
                let setupEmbed = new Utils.Discord.MessageEmbed()
                    .setColor(config.Error_Color)
                    .setTitle('⚠️ Missing Channels or Roles ⚠️')
                    .setDescription('**This Discord server is not properly setup for Corebot!**\nThe channels or roles are required for Corebot to function properly. The missing channels and roles are:')
                    .setFooter('Corebot', "https://images-ext-1.discordapp.net/external/XHb2Tugpi3JOSmmCmIsG9vcXJXfYoyJB8DPzwasAW3s/https/image.prntscr.com/image/H9Etwb2SSry_kS8D8zvb1w.png")

                if (missing.channels.categories.length > 0) {
                    setupEmbed.addField('**Missing Categories**', missing.channels.categories.join("\n"))
                }
                if (missing.channels.text.length > 0) {
                    setupEmbed.addField('**Missing Text Channels**', missing.channels.text.join("\n"))
                }
                if (missing.channels.voice.length > 0) {
                    setupEmbed.addField('**Missing Voice Channels**', missing.channels.voice.join("\n"))
                }
                if (missing.roles.length > 0) {
                    setupEmbed.addField('**Missing Roles**', missing.roles.join("\n"))
                }
                if (setupEmbed.fields.length > 0) {
                    missingRequirements = true;
                    setupEmbed.addField('🛠️** How To Resolve:**', 'Create the channels and/or roles to fix the issue, or change the channels and roles in the config to match your server!')
                    return message.channel.send(setupEmbed);
                }
            })
            if (missingRequirements) return;
        }

        // MESSAGE FILTER
        if (await Utils.variables.db.get.getCommands('filter') && (await Utils.variables.db.get.getCommands('filter')).enabled) {
            const Messages_Filter = config.Filter_System.Messages_Filter;
            Object.keys(Messages_Filter).forEach(name => {
                const filter = Messages_Filter[name];
                const hasRole = filter.Role ? (Utils.hasRole(message.member, filter.Role.toLowerCase())) : false;
                const content = message.content || (message.embeds.length > 0 ? message.embeds[0].description : "");
                const RegexResult = filter.regex ? content.test(new RegExp(filter.regex)) : false;
                if (hasRole && (RegexResult || content.toLowerCase() === filter.equals.toLowerCase() || content.toLowerCase().includes(filter.includes.toLowerCase()))) {
                    const channel = message.guild.channels.cache.find(c => c.name.toLowerCase() == filter.channel.toLowerCase());

                    if (channel) {
                        channel.send(Embed({
                            title: lang.FilterSystem.MessageFilter.Title,
                            fields: [
                                {
                                    name: lang.FilterSystem.MessageFilter.Fields[0],
                                    value: name
                                },
                                {
                                    name: lang.FilterSystem.MessageFilter.Fields[1],
                                    value: content
                                },
                                {
                                    name: lang.FilterSystem.MessageFilter.Fields[2],
                                    value: 'https://discordapp.com/channels/' + [message.guild.id, message.channel.id, message.id].join('/')
                                },
                                {
                                    name: lang.FilterSystem.MessageFilter.Fields[3],
                                    value: `<@${message.author.id}> (${message.author.tag} | ${message.author.id})`
                                }
                            ]
                        }))
                    }
                }
            })
        } // END MESSAGE FILTER SYSTEM

        // ANTI ADVERTISEMENT SYSTEM
        if (!message.channel.name.startsWith('ticket')) {
            if (config.Anti_Advertisement.Chat.Enabled && !Utils.hasPermission(message.member, config.Anti_Advertisement.Bypass_Role)) {
                if (config.Anti_Advertisement.Whitelist.Channels && config.Anti_Advertisement.Whitelist.Channels.find(c => {
                    // Find the channel
                    const channel = Utils.findChannel(c, message.guild, "text", false);
                    // If the channel exists, check if it is the current channel
                    if (channel) return message.channel.id == channel.id;
                    else return false;
                })) return;

                if (message.content && Utils.hasAdvertisement(message.content)) {
                    // Message has an advertisement
                    const whitelist = config.Anti_Advertisement.Whitelist.Websites.map(website => website.toLowerCase());
                    if (!whitelist.find(website => message.content.toLowerCase().includes(website))) {
                        // The message does not have a whitelisted website in it
                        message.delete();

                        if (config.Anti_Advertisement.Chat.Logs.Enabled) {
                            const logs = Utils.findChannel(config.Anti_Advertisement.Chat.Logs.Channel, message.guild);

                            if (logs) {
                                logs.send(Embed({
                                    title: ":no_entry_sign: **Advertisement Blocked**",
                                    fields: [
                                        {
                                            name: "User",
                                            value: `<@${message.author.id}> (${message.author.tag})`
                                        },
                                        {
                                            name: "Channel",
                                            value: `<#${message.channel.id}>`
                                        },
                                        {
                                            name: "Message",
                                            value: message.content
                                                .split(" ")
                                                .map(word => {
                                                    if (word && Utils.hasAdvertisement(word)) return `**${word}**`;
                                                    else return word;
                                                })
                                                .join(" ")
                                        }
                                    ]
                                }))
                            }
                        }

                        return message.channel.send(Embed({ title: lang.AntiAdSystem.MessageAdDetected.Title, description: lang.AntiAdSystem.MessageAdDetected.Description.replace(/{user}/g, message.author) })).then(msg => { msg.delete({ timeout: 5000 }) });
                    }
                }
            }
        }
        
        if (['revivenode', 'both'].includes(config.Suggestions.Type.toLowerCase())) {
            if ([message.channel.name, message.channel.id].includes(config.Suggestions.Channels.Suggestions)) {
                message.delete();
                let msg = await message.channel.send(Utils.setupEmbed({
                    configPath: config.Suggestions.Embed_Settings,
                    variables: [
                        { searchFor: /{tag}/g, replaceWith: message.author.tag },
                        { searchFor: /{userPFP}/g, replaceWith: message.author.displayAvatarURL({ dynamic: true }) },
                        { searchFor: /{botPFP}/g, replaceWith: bot.user.displayAvatarURL({ dynamic: true }) },
                        { searchFor: /{suggestion}/g, replaceWith: message.content.replace(await variables.db.get.getPrefixes(message.guild.id) + 'suggest', '') }
                    ]
                }));
                await msg.react(config.Suggestions.Emojis.Upvote);
                await msg.react(config.Suggestions.Emojis.Downvote);
            }
        }

        // COINS SYSTEM
        if (await Utils.variables.db.get.getModules('coins') && (await Utils.variables.db.get.getModules('coins')).enabled) {
            if (config.Commands.Disable_Coins ? !validPrefixes.some(p => message.content.startsWith(p)) : true) {
                if (!cooldowns.coins.cooldown.has(message.author.id)) {
                    let addCoins = ~~(Math.random() * parseInt(config.Coin_System.Coin_Amount)) + 1;
                    if (config.Coin_System.Multipliers.Enabled) {
                        let userMultipliers = []
                        Object.keys(config.Coin_System.Multipliers.Multipliers).forEach(role => {
                            if (Utils.hasPermission(message.member, role)) {
                                userMultipliers.push(config.Coin_System.Multipliers.Multipliers[role])
                            }
                        })
                        if (userMultipliers.length > 0) {
                            let highest = userMultipliers.reduce((a, b) => Math.max(a, b));
                            addCoins *= highest;
                        }
                    }

                    await variables.db.update.coins.updateCoins(message.member, addCoins, 'add');

                    if (!Utils.hasPermission(message.member, config.Cooldown_Bypass)) cooldowns.coins.cooldown.add(message.author.id);
                    setTimeout(function () {
                        if (!Utils.hasPermission(message.member, config.Cooldown_Bypass)) cooldowns.coins.cooldown.delete(message.author.id);
                    }, cooldowns.coins.cooldownSeconds * 1000);
                }
            }
        } // END COIN SYSTEM

        // XP SYSTEM
        if (await Utils.variables.db.get.getModules('exp') && (await Utils.variables.db.get.getModules('exp')).enabled) {
            if ((config.Commands.Disable_XP ? !validPrefixes.some(p => message.content.startsWith(p)) : true) && !(config.Level_System.Blacklisted_Channels.includes(message.channel.name) || config.Level_System.Blacklisted_Channels.includes(message.channel.id))) {
                let { level, xp } = await variables.db.get.getExperience(message.member);
                if (!cooldowns.xp.cooldown.has(message.author.id)) {
                    let amt = ~~(Math.random() * 10) + config.Level_System.Approximate_XP_Per_Message;
                    let xpNeeded = ~~((level * (175 * level) * 0.5)) - amt - xp;
                    if (xpNeeded <= 0) {
                        level++;
                        const embed = Embed({
                            title: lang.XPModule.LevelUp.Title,
                            description: lang.XPModule.LevelUp.Description.replace(/{user}/g, `<@${message.author.id}>`).replace(/{level}/g, level)
                        });
                        if (config.Level_System.Level_Up_Notification) {
                            if (!config.Level_System.Level_Up_Announce_Channel ||
                                !Utils.findChannel(config.Level_System.Level_Up_Announce_Channel, message.guild, 'text', false)
                            ) message.channel.send(embed).then(msg => config.Level_System.Delete_Level_Up_Embed ? msg.delete({ timeout: 5000 }) : '');
                            if (config.Level_System.Level_Up_Announce_Channel &&
                                Utils.findChannel(config.Level_System.Level_Up_Announce_Channel, message.guild)
                            ) Utils.findChannel(config.Level_System.Level_Up_Announce_Channel, message.guild).send(embed)
                        }

                        bot.emit('levelUp', message.member, level, message.channel);

                        const levelRoles = config.Level_System.Level_Roles;
                        if (levelRoles && levelRoles[level]) {
                            const role = Utils.findRole(levelRoles[level], message.guild);
                            if (role) message.member.roles.add(role).catch(console.log);
                        }
                    }
                    await variables.db.update.experience.updateExperience(message.member, level, amt, 'add');

                    if (!Utils.hasPermission(message.member, config.Cooldown_Bypass)) cooldowns.xp.cooldown.add(message.author.id);
                    setTimeout(function () {
                        if (!Utils.hasPermission(message.member, config.Cooldown_Bypass)) cooldowns.xp.cooldown.delete(message.author.id);
                    }, cooldowns.xp.cooldownSeconds * 1000);
                }
            }
        } // END XP SYSTEM

        // FILTER SYSTEM
        if (await Utils.variables.db.get.getCommands('filter') && (await Utils.variables.db.get.getCommands('filter')).enabled) {

            if (!Utils.hasPermission(message.member, config.Filter_System.Bypass_Role.toLowerCase())) {
                const filter = await variables.db.get.getFilter();
                let words = message.content.split(" ");

                words.forEach(word => {
                    if (filter.map(w => w.toLowerCase()).includes(word.toLowerCase())) {
                        message.delete();
                        message.reply(Embed({ title: lang.FilterSystem.Filter.Title, description: lang.FilterSystem.Filter.Description })).then(msg => { msg.delete({ timeout: 5000 }) });
                    }
                })
            }
        }

        if (!config.Logs.Chat_Logs.Blacklisted_Channels.includes(message.channel.name) && config.Logs.Chat_Logs.Enabled == true) {
            await fs.appendFileSync('./logs/' + Utils.getMMDDYYYY() + '-chatlogs.txt', `[${new Date().toISOString()}] [G: ${message.guild.name} (${message.guild.id})] [C: ${message.channel.name} (${message.channel.id})] [A: ${message.author.tag} (${message.author.id})] ${message.content}\n`, function (err) {
                if (err) throw err;
            });
        }

        const responses = config.Auto_Response_System;

        if (responses.Enabled) {
            responses.Auto_Responses.forEach(response => {
                const matches = response.Regex ?
                    new RegExp(response.Text, 'gi').test(message.content) :
                    response.Text.toLowerCase() == message.content.toLowerCase();
                if (matches) {
                    const sentDM = (sent = true) => {
                        if (sent) {
                            response.After_DM.Success ?
                                message.channel.send(Utils.Embed({
                                    title: response.After_DM.Success,
                                    color: config.Success_Color
                                }))
                                : ""
                        } else {
                            response.After_DM.Fail ?
                                message.channel.send(Utils.Embed({
                                    title: response.After_DM.Fail,
                                    color: config.Success_Color
                                }))
                                : ""
                        }
                    }
                    // Text matches
                    if (response.DM) {
                        // DM the message
                        if (response.Type == "text") {
                            // The type of content is text
                            return message.member.send(response.Content)
                                .then(() => {
                                    sentDM()
                                })
                                .catch(() => {
                                    sentDM(false)
                                })
                        } else if (response.Type == "embed") {
                            return message.member.send(Utils.setupEmbed({
                                configPath: response.Embed, variables: [
                                    { searchFor: /{userPFP}/g, replaceWith: message.author.displayAvatarURL({ dynamic: true }) },
                                    { searchFor: /{botPFP}/g, replaceWith: bot.user.displayAvatarURL({ dynamic: true }) },
                                    { searchFor: /{title}/g, replaceWith: response.Title },
                                    { searchFor: /{description}/g, replaceWith: response.Description },
                                    { searchFor: /{tag}/g, replaceWith: message.author.tag },
                                    { searchFor: /{user}/g, replaceWith: '<@' + message.author.id + '>' },
                                    { searchFor: /{username}/g, replaceWith: message.author.username }
                                ]
                            }))
                                .then(() => {
                                    sentDM();
                                })
                                .catch(() => {
                                    sentDM(false);
                                })
                        }
                    } else {
                        if (response.Type == "text") {
                            // The type of content is text
                            return message.channel.send(response.Content);
                        } else if (response.Type == "embed") {
                            // The type is embed
                            return message.channel.send(Utils.setupEmbed({
                                configPath: response.Embed, variables: [
                                    { searchFor: /{userPFP}/g, replaceWith: message.author.displayAvatarURL({ dynamic: true }) },
                                    { searchFor: /{botPFP}/g, replaceWith: bot.user.displayAvatarURL({ dynamic: true }) },
                                    { searchFor: /{title}/g, replaceWith: response.Title },
                                    { searchFor: /{description}/g, replaceWith: response.Description },
                                    { searchFor: /{tag}/g, replaceWith: message.author.tag },
                                    { searchFor: /{user}/g, replaceWith: '<@' + message.author.id + '>' },
                                    { searchFor: /{username}/g, replaceWith: message.author.username }
                                ]
                            }))
                        }
                    }
                }
            })
        }

        const prefixFound = validPrefixes.find(p => message.content.startsWith(p));
        if (!prefixFound) return;

        const args = [];
        message.content.replace(/\s+/g, ' ').trim().split(" ").forEach((arg, i) => {
            // If the prefix is mentioning the bot and the argument is the second (the command)
            if (prefixFound == validPrefixes[0] && i == 1) args[0] += arg;
            else args.push(arg);
        })

        const cmd = args.shift().slice(prefixFound.length);

        const command = CommandHandler.find(cmd, config.Commands.Ignore_Case);

        // COMMANDS/TICKET CREATION CHANNELS
        if (config.Commands.Require_Commands_Channel && !Utils.hasPermission(message.member, config.Commands.Bypass_Commands_Channel)) {
            if (!['install', 'verify'].includes(cmd)) {
                let validChannels = config.Commands.Command_Channels;

                if (config.Ticket_System.Ticket_Creation_Channel !== false) validChannels.push(config.Ticket_System.Ticket_Creation_Channel);
                if (config.Commands.Allow_Commands_In_Tickets && message.channel.name.startsWith('ticket-')) validChannels.push(message.channel.id);

                validChannels = validChannels.filter(channel => {
                    let c = !!Utils.findChannel(channel, message.guild, 'text', true)
                    return c
                })
                validChannels = [...new Set(validChannels)];

                if (!validChannels.includes(message.channel.name) && !validChannels.includes(message.channel.id) && command) {
                    if (validChannels.length == 0) return message.reply(Embed({
                        title: lang.Other.NotCommandsChannel.Title,
                        description: lang.Other.NotCommandsChannel.Descriptions[2]
                    }))
                    message.delete();
                    if (['new', 'ticket'].includes(cmd)) return message.reply(Embed({
                        color: config.Error_Color,
                        title: lang.Other.NotCommandsChannel.Title,
                        description: lang.Other.NotCommandsChannel.Descriptions[0].replace(/{channels}/g, validChannels.map(ch => '<#' + (Utils.findChannel(ch, message.guild)).id + '>').join(", "))
                    })).then(msg => msg.delete({ timeout: 2500 }));
                    else return message.reply(Embed({
                        color: config.Error_Color,
                        title: lang.Other.NotCommandsChannel.Title,
                        description: lang.Other.NotCommandsChannel.Descriptions[1].replace(/{channels}/g, validChannels.map(channel => '<#' + (Utils.findChannel(channel, message.guild)).id + '>').join(", ") + '!')
                    })).then(msg => msg.delete({ timeout: 2500 }));
                }
            }
        }

        if (command && command.enabled) {
            try {
                if (!Utils.hasPermission(message.member, config.Cooldown_Bypass)) {
                    const cooldown = cooldowns.cmd.find(c => c.user == message.author.id && c.cmd == command.command && c.expiresAt > Date.now());

                    if (cooldown) return message.channel.send(Embed({
                        title: lang.Other.Cooldown.Title,
                        color: config.Error_Color,
                        description: lang.Other.Cooldown.Description.replace(/{seconds}/g, Math.round((cooldown.expiresAt - Date.now()) / 1000))
                    }))
                }

                const CommandCooldowns = config.Cooldowns;

                if (Object.keys(CommandCooldowns).find(cd => cd.toLowerCase() == command.command.toLowerCase())) {
                    const cooldownSec = CommandCooldowns[command.command];

                    const cooldownMs = cooldownSec * 1000;

                    const cooldownObject = {
                        user: message.author.id,
                        cmd: command.command,
                        expiresAt: Date.now() + cooldownMs
                    }

                    cooldowns.cmd.push(cooldownObject);
                    setTimeout(function () {
                        cooldowns.cmd.splice(cooldowns.cmd.indexOf(cooldownObject), 1);
                    }, cooldownMs)
                }
                if (config.Commands.Remove_Command_Messages) message.delete();
                await command.run(bot, message, args, { prefixUsed: prefixFound, commandUsed: cmd });
                if (config.Logs.Command_Logs.Enabled == true) {
                    if (Utils.findChannel(config.Logs.Command_Logs.Channel, message.guild)) (Utils.findChannel(config.Logs.Command_Logs.Channel, message.guild)).send(Embed({
                        color: config.Theme_Color,
                        title: lang.LogSystem.CommandLogs.Title,
                        fields: [{
                            name: lang.LogSystem.CommandLogs.Fields[0],
                            value: `<@${message.author.id}>`
                        }, {
                            name: lang.LogSystem.CommandLogs.Fields[1],
                            value: command.command
                        }, {
                            name: lang.LogSystem.CommandLogs.Fields[2],
                            value: message.content
                        }]
                    }));
                }
            } catch (e) {
                variables.errors.push({
                    error: e,
                    author: message.author.tag,
                    message: message.content,
                    time: Date.now()
                });
                require("../modules/error")(e.toString(), `Author: ${message.author.id}\nMessage: ${message.content}`, cmd.toLowerCase());
            }
        } else if (!command && config.Commands.Invalid_Command_Message) {
            commands = []
            CommandHandler.commands.forEach(cmd => {
                commands.push(cmd.command);
                cmd.aliases.forEach(alias => commands.push(alias));
            })
            let bestMatch = findBestMatch(cmd, commands).bestMatch.target
            message.channel.send(Embed({ color: config.Error_Color, title: lang.Other.InvalidCommand.Title, description: lang.Other.InvalidCommand.Description.replace(/{command}/g, prefixFound + bestMatch) }));
        }
    }
}
// 159331   8501   648409    46410   1590653881   15b8468e6abc07ecf8208e70b709702258380118   648409
