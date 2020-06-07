const Utils = require('../modules/utils.js');
const Embed = Utils.Embed;
const fs = require("fs");
const lang = Utils.variables.lang;
const events = {
    MESSAGE_REACTION_ADD: 'messageReactionAdd',
    MESSAGE_REACTION_REMOVE: 'messageReactionRemove'
};
const commands = require('../modules/handlers/CommandHandler').commands;

let general = "";
let moderation = "";
let tickets = "";
let admin = "";
let management = "";
let other = "";
let coins = "";
let exp = "";
let minecraft = "";
let fun = "";
let giveaways = "";
let music = "";
async function setupHelpMenu() {
    general = "";
    moderation = "";
    tickets = "";
    admin = "";
    management = "";
    other = "";
    coins = "";
    exp = "";
    fun = "";
    minecraft = "";
    giveaways = "";
    music = "";
    await Utils.asyncForEach(commands, async command => {
        if (await Utils.variables.db.get.getCommands(command.command) && (await Utils.variables.db.get.getCommands(command.command)).enabled == false) return;
        if (command.type == "general") {
            general += `**{prefix}${command.command}** - ${command.description}\n`
        } else if (command.type == "other") {
            other += `**{prefix}${command.command}** - ${command.description}\n`
        } else if (command.type == "coins") {
            coins += `**{prefix}${command.command}** - ${command.description}\n`
        } else if (command.type == "tickets") {
            tickets += `**{prefix}${command.command}** - ${command.description}\n`
        } else if (command.type == "exp") {
            exp += `**{prefix}${command.command}** - ${command.description}\n`
        } else if (command.type == "mod") {
            moderation += `**{prefix}${command.command}** - ${command.description}\n`
        } else if (command.type == "admin") {
            admin += `**{prefix}${command.command}** - ${command.description}\n`
        } else if (command.type == "giveaways") {
            giveaways += `**{prefix}${command.command}** - ${command.description}\n`
        } else if (command.type == 'management' || command.type == 'utils') {
            management += `**{prefix}${command.command}** - ${command.description}\n`
        } else if (command.type == "minecraft") {
            minecraft += `**{prefix}${command.command}** - ${command.description}\n`
        } else if (command.type == "fun") {
            fun += `**{prefix}${command.command}** - ${command.description}\n`
        } else if (command.type == "music") {
            music += `**{prefix}${command.command}** - ${command.description}\n`
        }
    })
}
module.exports = async (bot, event) => {
    await setupHelpMenu();
    if (!events.hasOwnProperty(event.t)) return;
    const { d: data } = event;
    const user = bot.users.cache.get(data.user_id);
    const channel = bot.channels.cache.get(data.channel_id);
    const message = await channel.messages.fetch(data.message_id);
    if (message.channel.type == 'dm') return;
    const emojiKey = (data.emoji.id) ? data.emoji.id : data.emoji.name;
    const member = message.guild.members.cache.get(user.id);
    const config = Utils.variables.config;
    const prefix = await Utils.variables.db.get.getPrefixes(message.guild.id);
    if (user.bot) return;

    if (require('../modules/handlers/CommandHandler.js').commands.length > 0 && require('../modules/handlers/KeyHandler.js').verified) {

        // GIVEAWAYS
        if (await Utils.variables.db.get.getModules('giveaways') && (await Utils.variables.db.get.getModules('giveaways')).enabled) {
            if (event.t == "MESSAGE_REACTION_ADD") {
                const Giveaway = await Utils.variables.db.get.getGiveaways(message.id);
                if (emojiKey == config.Giveaway_System.Emoji_Unicode && Giveaway && !user.bot && !Giveaway.ended) {
                    bot.emit("giveawayJoined", member, message, Giveaway);
                    Utils.variables.db.update.giveaways.reactions.addReaction(message.id, user.id);
                }
            }
            if (event.t == "MESSAGE_REACTION_REMOVE") {
                const Giveaway = await Utils.variables.db.get.getGiveaways(message.id);
                if (emojiKey == config.Giveaway_System.Emoji_Unicode && Giveaway && !user.bot && !Giveaway.ended) {
                    bot.emit("giveawayLeft", member, message, Giveaway);
                    Utils.variables.db.update.giveaways.reactions.removeReaction(message.id, user.id);
                }
            }
        }

        // ROLE MENU
        if (await Utils.variables.db.get.getCommands('rolemenu') && (await Utils.variables.db.get.getCommands('rolemenu')).enabled) {
            if (message.embeds.length > 0 && message.embeds[0].title && message.embeds[0].title.startsWith(lang.AdminModule.Commands.Rolemenu.Embeds.Rolemenu.Title)) {
                const menu = message.embeds[0].title.split(lang.AdminModule.Commands.Rolemenu.Embeds.Rolemenu.Title)[1];
                const configMenu = config.Role_Menu.Menus[menu];

                const filteredMenu = Object.assign({}, configMenu);
                if (filteredMenu['description']) delete filteredMenu['description'];
                if (filteredMenu['onlyOne']) delete filteredMenu['onlyOne'];

                if (configMenu) {
                    Object.keys(filteredMenu).forEach(async roleEmoji => {
                        if (emojiKey == roleEmoji) {
                            const role = Utils.findRole(configMenu[roleEmoji], message.guild);
                            if (!role) return member.send(Embed({ color: config.Error_Color, description: lang.AdminModule.Commands.Rolemenu.RoleNotExist.replace(/{role}/g, configMenu[roleEmoji]) }))
                            if (member.roles.cache.has(role.id)) {
                                bot.emit("roleMenuRoleRemoved", member, message, role);
                                await member.roles.remove(role);
                                await member.send(Embed({ description: lang.AdminModule.Commands.Rolemenu.RoleRemoved.replace(/{role}/g, configMenu[roleEmoji]) }))
                            } else {
                                if (configMenu.onlyOne) {
                                    if (Object.values(filteredMenu).some(role => Utils.hasRole(member, role, false))) {
                                        let roleName = Object.values(filteredMenu).find(role => Utils.hasRole(member, role, false));
                                        message.reactions.cache.get(Object.keys(configMenu)[Object.values(configMenu).indexOf(roleName)]).users.remove(member)
                                    }
                                }
                                bot.emit("roleMenuRoleAdded", member, message, role);
                                await member.roles.add(role);
                                await member.send(Embed({ description: lang.AdminModule.Commands.Rolemenu.RoleAdded.replace(/{role}/g, configMenu[roleEmoji]) }))
                            }
                        }
                    })
                }
            }
        }

        // VERIFICATION
        if (config.Verification_System.Enabled == true
            && event.t == "MESSAGE_REACTION_ADD"
            && config.Verification_System.Type == 'reaction'
            && message.id == config.Verification_System.Reaction.Message_ID
            && emojiKey == config.Verification_System.Reaction.Emoji) {

            message.react(config.Verification_System.Reaction.Emoji);

            if (config.Verification_System.Verified_Role.split(",").filter(r => !!Utils.findRole(r, message.guild, false)).every(r => Utils.hasPermission(member, r))) return;
            message.reactions.cache.find(reaction => reaction.emoji.name == emojiKey || reaction.emoji.id == emojiKey).users.remove(user);

            if (config.Verification_System.Send_Welcome_Message_Once_Verified && config.Join.Join_Messages) {
                if (config.Join.DM_Message) {
                    if (typeof config.Join.DM_Message == 'string') {
                        let DMMessage = config.Join.DM_Message.replace(/{user}/g, `<@${member.user.id}>`).replace(/{tag}/g, member.user.tag).replace(/{total}/g, member.guild.memberCount).replace(/{inviter}/g, "Unknown");;
                        member.send(DMMessage);
                    } else {
                        console.log(Utils.warningPrefix + "The DM_Message setting for the Join event must be text, not a boolean")
                    }
                }

                let channel = Utils.findChannel(config.Join.Channel, member.guild);
                if (!channel) return;
                let msg = config.Join.Message.replace(/{user}/g, `<@${member.user.id}>`).replace(/{tag}/g, `${member.user.tag}`).replace(/{total}/g, `${member.guild.memberCount}`).replace(/{inviter}/g, "Unknown");
                if (config.Join.Message === "embed") {
                    channel.send(Utils.setupEmbed({
                        configPath: config.Join.Embed_Settings,
                        variables: [
                            { searchFor: /{user}/g, replaceWith: `<@${member.user.id}>` },
                            { searchFor: /{tag}/g, replaceWith: member.user.tag },
                            { searchFor: /{total}/g, replaceWith: member.guild.memberCount },
                            { searchFor: /{userPFP}/g, replaceWith: member.user.displayAvatarURL({ dynamic: true }) },
                            { searchFor: /{botPFP}/g, replaceWith: bot.user.displayAvatarURL({ dynamic: true }) },
                            { searchFor: /{inviter}/g, replaceWith: "Unknown" }]
                    }));
                } else return channel.send(msg);
            }

            if (config.Join.Role) {
                config.Join.Role.split(",").forEach(role => {
                    let r = Utils.findRole(role, member.guild);
                    if (!r) return
                    else member.roles.remove(r);
                })
            }

            config.Verification_System.Verified_Role.split(",").forEach(role => {
                let r = Utils.findRole(role, member.guild);
                if (!r) return
                else member.roles.add(r);
            })
        }

        // SUGGESTIONS
        if (config.Suggestions.Enabled == true && event.t == "MESSAGE_REACTION_ADD") {
            if (!Utils.findRole(config.Permissions.Staff_Commands.Accept_Deny_Suggestions, message.guild) || !Utils.hasPermission(member, config.Permissions.Staff_Commands.Accept_Deny_Suggestions)) return;
            let channels = [config.Suggestions.Channels.Suggestions, config.Suggestions.Channels.AcceptedSuggestions, config.Suggestions.Channels.DeniedSuggestions]
            if (channels.includes(channel.id) || channels.includes(channel.name)) {
                if (message.embeds.length > 0) {
                    let embed = message.embeds[0];
                    let settings = {};
                    if (emojiKey == config.Suggestions.Emojis.Deny) settings = { newTitle: lang.GeneralModule.Commands.Suggest.DeniedSuffix, ch: Utils.findChannel(`${config.Suggestions.Denied_Suggestions_Channel}`, message.guild, 'text', false), color: config.Error_Color };
                    else if (emojiKey == config.Suggestions.Emojis.Accept) settings = { newTitle: lang.GeneralModule.Commands.Suggest.AcceptedSuffix, ch: Utils.findChannel(`${config.Suggestions.Accepted_Suggestions_Channel}`, message.guild, 'text', false), color: config.Success_Color };
                    else if (emojiKey == config.Suggestions.Emojis.Reset) settings = { newTitle: '', ch: Utils.findChannel(`${config.Suggestions.Channel}`, message.guild, 'text', false), color: config.Theme_Color, react: true };
                    else if (emojiKey == config.Suggestions.Emojis.Upvote && embed.footer.text.replace('From: ', '') == member.user.tag) return message.channel.send(Embed({ preset: 'error', description: lang.GeneralModule.Commands.Suggest.ReactToOwnSuggestion })).then(msg => { msg.delete({ timeout: 2500 }); message.reactions.cache.find(reaction => reaction.emoji.name == emojiKey || reaction.emoji.id == emojiKey).users.remove(user); });
                    else if (emojiKey == config.Suggestions.Emojis.Downvote && embed.footer.text.replace('From: ', '') == member.user.tag) return message.channel.send(Embed({ preset: 'error', description: lang.GeneralModule.Commands.Suggest.ReactToOwnSuggestion })).then(msg => { msg.delete({ timeout: 2500 }); message.reactions.cache.find(reaction => reaction.emoji.name == emojiKey || reaction.emoji.id == emojiKey).users.remove(user); });
                    else return;

                    message.reactions.cache.find(reaction => reaction.emoji.name == emojiKey || reaction.emoji.id == emojiKey).users.remove(user);
                    let title = `${embed.title ? embed.title.replace(lang.GeneralModule.Commands.Suggest.DeniedSuffix, '').replace(lang.GeneralModule.Commands.Suggest.AcceptedSuffix, '') : ''} ${settings.newTitle}`.replace(/\s+/g, ' ').trim();

                    if (!!embed.title) embed.title = title;
                    embed.color = settings.color;

                    if (settings.ch && channel.name !== settings.ch.name) {
                        message.delete();
                        message = await settings.ch.send(embed);
                    } else await message.edit(embed)

                    if (settings.react) {
                        await message.react(config.Suggestions.Emojis.Upvote)
                        await message.react(config.Suggestions.Emojis.Downvote)
                    }
                    return;
                }
            }
        }

        // HELP MENU
        let helpCMD = await Utils.variables.db.get.getCommands('help');
        if (helpCMD && helpCMD.enabled && event.t == "MESSAGE_REACTION_ADD") {

            let embeds = {
                mod: Embed({
                    title: lang.Help.StaffHelpMenuTitle + ' - ' + lang.Help.CategoryMenuTitles[0],
                    description: moderation.replace(/{prefix}/g, prefix)
                }),
                admin: Embed({
                    title: lang.Help.StaffHelpMenuTitle + ' - ' + lang.Help.CategoryMenuTitles[1],
                    description: admin.replace(/{prefix}/g, prefix)
                }),
                management: Embed({
                    title: lang.Help.StaffHelpMenuTitle + ' - ' + lang.Help.CategoryMenuTitles[2],
                    description: management.replace(/{prefix}/g, prefix)
                }),
                general: Embed({
                    title: lang.Help.HelpMenuTitle + ' - ' + lang.Help.CategoryMenuTitles[3],
                    description: general.replace(/{prefix}/g, prefix)
                }),
                tickets: Embed({
                    title: lang.Help.HelpMenuTitle + ' - ' + lang.Help.CategoryMenuTitles[4],
                    description: tickets.replace(/{prefix}/g, prefix)
                }),
                coins: Embed({
                    title: lang.Help.HelpMenuTitle + ' - ' + lang.Help.CategoryMenuTitles[5],
                    description: coins.replace(/{prefix}/g, prefix)
                }),
                exp: Embed({
                    title: lang.Help.HelpMenuTitle + ' - ' + lang.Help.CategoryMenuTitles[6],
                    description: exp.replace(/{prefix}/g, prefix)
                }),
                other: Embed({
                    title: lang.Help.HelpMenuTitle + ' - ' + lang.Help.CategoryMenuTitles[7],
                    description: other.replace(/{prefix}/g, prefix)
                }),
                help: Embed({
                    title: lang.Help.HelpMenuTitle,
                    fields: []
                }),
                staff: Embed({
                    title: lang.Help.StaffHelpMenuTitle,
                    fields: []
                }),
                fun: Embed({
                    title: lang.Help.HelpMenuTitle + ' - ' + lang.Help.CategoryMenuTitles[8],
                    description: fun.replace(/{prefix}/g, prefix)
                }),
                minecraft: Embed({
                    title: lang.Help.HelpMenuTitle + ' - ' + lang.Help.CategoryMenuTitles[9],
                    description: minecraft.replace(/{prefix}/g, prefix)
                }),
                giveaways: Embed({
                    title: lang.Help.StaffHelpMenuTitle + ' - ' + lang.Help.CategoryMenuTitles[10],
                    description: giveaways.replace(/{prefix}/g, prefix)
                }),
                music: Embed({
                    title: lang.Help.HelpMenuTitle + ' - ' + "Music Commands",
                    description: music.replace(/{prefix}/g, prefix)
                }),
            }
            let modules = {
                mod: await Utils.variables.db.get.getModules('mod'),
                admin: await Utils.variables.db.get.getModules('admin'),
                management: await Utils.variables.db.get.getModules('management'),
                general: await Utils.variables.db.get.getModules('general'),
                tickets: await Utils.variables.db.get.getModules('tickets'),
                coins: await Utils.variables.db.get.getModules('coins'),
                exp: await Utils.variables.db.get.getModules('exp'),
                other: await Utils.variables.db.get.getModules('other'),
                fun: await Utils.variables.db.get.getModules('fun'),
                minecraft: await Utils.variables.db.get.getModules('minecraft'),
                giveaways: await Utils.variables.db.get.getModules('giveaways'),
                music: await Utils.variables.db.get.getModules('music')
            }

            if (modules.mod.enabled == true) embeds.staff.embed.fields.push({ name: lang.Help.CategoryNames[0], value: `${prefix}staffhelp moderation`, inline: true });
            if (modules.admin.enabled == true) embeds.staff.embed.fields.push({ name: lang.Help.CategoryNames[1], value: `${prefix}staffhelp admin`, inline: true });
            if (modules.giveaways.enabled == true) embeds.staff.embed.fields.push({ name: lang.Help.CategoryNames[10], value: `${prefix}staffhelp giveaways`, inline: true });
            if (modules.management.enabled == true) embeds.staff.embed.fields.push({ name: lang.Help.CategoryNames[2], value: `${prefix}staffhelp management`, inline: true });
            if (modules.general.enabled == true) embeds.help.embed.fields.push({ name: lang.Help.CategoryNames[3], value: `${prefix}help general`, inline: true });
            if (modules.tickets.enabled == true) embeds.help.embed.fields.push({ name: lang.Help.CategoryNames[4], value: `${prefix}help tickets`, inline: true });
            if (modules.coins.enabled == true) embeds.help.embed.fields.push({ name: lang.Help.CategoryNames[5], value: `${prefix}help coins`, inline: true });
            if (modules.exp.enabled == true) embeds.help.embed.fields.push({ name: lang.Help.CategoryNames[6], value: `${prefix}help xp`, inline: true });
            if (modules.fun.enabled == true) embeds.help.embed.fields.push({ name: lang.Help.CategoryNames[8], value: `${prefix}help fun`, inline: true });
            if (modules.minecraft.enabled == true) embeds.help.embed.fields.push({ name: lang.Help.CategoryNames[9], value: `${prefix}help minecraft`, inline: true });
            if (modules.music && modules.music.enabled == true) embeds.help.embed.fields.push({ name: ":musical_note: Music", value: `${prefix}help music`, inline: true });
            if (modules.other.enabled == true) embeds.help.embed.fields.push({ name: lang.Help.CategoryNames[7], value: `${prefix}help other`, inline: true });

            let normalHelpMenuCategories = lang.Help.CategoryMenuTitles.slice(3)
            normalHelpMenuCategories.splice(7, 1);
            normalHelpMenuCategories.push("Music")
            if (message.embeds.length > 0 && message.embeds[0].title && (normalHelpMenuCategories.some(catTitle => message.embeds[0].title == lang.Help.HelpMenuTitle + ' - ' + catTitle) || message.embeds[0].title == lang.Help.HelpMenuTitle)) {
                if (emojiKey == '🙂' && (await Utils.variables.db.get.getModules('general')).enabled == true && general.length > 0) {
                    message.reactions.cache.get('🙂').users.remove(user);
                    await message.react('🔙');
                    return message.edit(embeds.general);
                }
                if (emojiKey == '🎟️' && (await Utils.variables.db.get.getModules('tickets')).enabled == true && tickets.length > 0) {
                    message.reactions.cache.get('🎟️').users.remove(user);
                    await message.react('🔙');
                    return message.edit(embeds.tickets);
                }
                if (emojiKey == '💰' && (await Utils.variables.db.get.getModules('coins')).enabled == true && coins.length > 0) {
                    message.reactions.cache.get('💰').users.remove(user);
                    await message.react('🔙');
                    return message.edit(embeds.coins);
                }
                if (emojiKey == '🗂️' && (await Utils.variables.db.get.getModules('other')).enabled == true && other.length > 0) {
                    message.reactions.cache.get('🗂️').users.remove(user);
                    await message.react('🔙');
                    return message.edit(embeds.other);
                }
                if (emojiKey == '✨' && (await Utils.variables.db.get.getModules('exp')).enabled == true && exp.length > 0) {
                    message.reactions.cache.get('✨').users.remove(user);
                    await message.react('🔙');
                    return message.edit(embeds.exp);
                }
                if (emojiKey == '🎮' && (await Utils.variables.db.get.getModules('fun')).enabled == true && fun.length > 0) {
                    message.reactions.cache.get('🎮').users.remove(user);
                    await message.react('🔙');
                    return message.edit(embeds.fun);
                }
                if (emojiKey == '⛏️' && (await Utils.variables.db.get.getModules('minecraft')).enabled == true && minecraft.length > 0) {
                    message.reactions.cache.get('⛏️').users.remove(user);
                    await message.react('🔙');
                    return message.edit(embeds.minecraft);
                }
                if (emojiKey == '🎵' && await Utils.variables.db.get.getModules('music') && (await Utils.variables.db.get.getModules('music')).enabled == true && music.length > 0) {
                    message.reactions.cache.get('🎵').users.remove(user);
                    await message.react('🔙');
                    return message.edit(embeds.music);
                }
                if (emojiKey == '🔙') {
                    message.reactions.cache.get('🔙').users.remove(user);
                    return message.edit(embeds.help);
                }
            }
            let staffHelpMenuCategories = lang.Help.CategoryMenuTitles.slice(0, 3);
            staffHelpMenuCategories.push(lang.Help.CategoryMenuTitles[10])
            if (message.embeds.length > 0 && message.embeds[0].title && (staffHelpMenuCategories.some(catTitle => message.embeds[0].title == lang.Help.StaffHelpMenuTitle + ' - ' + catTitle) || message.embeds[0].title == lang.Help.StaffHelpMenuTitle)) {
                if (emojiKey == '👮' && (await Utils.variables.db.get.getModules('mod')).enabled == true && moderation.length > 0) {
                    message.reactions.cache.get('👮').users.remove(user);
                    await message.react('🔙');
                    return message.edit(embeds.mod);
                }
                if (emojiKey == '🛠' && (await Utils.variables.db.get.getModules('admin')).enabled == true && admin.length > 0) {
                    message.reactions.cache.get('🛠').users.remove(user);
                    await message.react('🔙');
                    return message.edit(embeds.admin);
                }
                if (emojiKey == '🎉' && (await Utils.variables.db.get.getModules('giveaways')).enabled == true && giveaways.length > 0) {
                    message.reactions.cache.get('🎉').users.remove(user);
                    await message.react('🔙');
                    return message.edit(embeds.giveaways);
                }
                if (emojiKey == '🖥️' && (await Utils.variables.db.get.getModules('management')).enabled == true && management.length > 0) {
                    message.reactions.cache.get('🖥️').users.remove(user);
                    await message.react('🔙');
                    return message.edit(embeds.management);
                }

                if (emojiKey == '🔙') {
                    message.reactions.cache.get('🔙').users.remove(user);
                    return message.edit(embeds.staff);
                }
            }
        }

        // APPLY
        /*if (await Utils.variables.db.get.getCommands('apply') && (await Utils.variables.db.get.getCommands('apply')).enabled) {
            let lastMessage = await channel.messages.fetch(channel.lastMessageID);
            if (lastMessage.embeds.length > 0 && lastMessage.embeds[0].title == lang.Other.OtherCommands.Apply.Embeds.Accepted.Title) return;
            const applications_category = Utils.findChannel(config.Applications.Category, message.guild, 'category');
            if (channel.parentID == (applications_category ? applications_category.id : 0) && message.embeds.length > 0 && event.t == "MESSAGE_REACTION_ADD") {
                const messageEmbed = message.embeds[0];
                if (messageEmbed.title == config.Applications.Application_Complete.Title && messageEmbed.description == config.Applications.Application_Complete.Description) {
                    if (!Utils.hasPermission(member, config.Applications.Reviewer_Role)) {
                        message.reactions.cache.get(emojiKey).users.remove(member.id);
                    } else {
                        const applyingUser = message.guild.member(channel.topic.split("\n")[1].split(": ")[1]);
                        // Be sure the user is still in the server
                        if (!applyingUser) return message.channel.send(lang.Other.OtherCommands.Apply.Errors.UserLeft);

                        let lastMessage = await channel.messages.fetch(channel.lastMessageID);
                        if (emojiKey == "❌") {
                            if (lastMessage.embeds.length > 0 && lastMessage.embeds[0].title == lang.Other.OtherCommands.Apply.Embeds.Denied.Title) return;
                            const embed = Utils.Embed({ title: lang.Other.OtherCommands.Apply.Embeds.Denied.Title, description: lang.Other.OtherCommands.Apply.Embeds.Denied.Description, color: config.Error_Color });
                            if (config.Applications.DM_Decision) applyingUser.send(embed).catch(error => message.channel.send(lang.Other.OtherCommands.Apply.Errors.CantNotify));
                            channel.send(`<@${applyingUser.id}>`, { embed: embed.embed });

                            bot.emit("applicationDenied", member, message, applyingUser);
                        } else if (emojiKey == "✅") {
                            if (lastMessage.embeds.length > 0 && lastMessage.embeds[0].title == lang.Other.OtherCommands.Apply.Embeds.Accepted.Title) return;
                            const applyingUser = message.guild.member(channel.topic.split("\n")[1].split(": ")[1]);
                            // Be sure the user is still in the server
                            if (!applyingUser) return message.channel.send(lang.Other.OtherCommands.Apply.Errors.UserLeft);

                            // Get all positions
                            const validPositions = config.Applications.Positions;

                            const position = validPositions[channel.topic.split("\n")[2].split(": ")[1]];

                            // Cancel if the position no longer exists
                            if (!position) return message.channel.send(lang.Other.OtherCommands.Apply.Errors.PositionNotFound.replace(/{pos}/g, channel.topic.split("\n")[2].split(": ")[1] + "``"));

                            if (config.Applications.Add_Role_When_Accepted) {
                                // Find the role
                                const role = Utils.findRole(position.Role, channel.guild);

                                if (!role) message.channel.send(lang.Other.OtherCommands.Apply.RoleNotFound.replace(/{role}/g, position.Role))
                                else applyingUser.roles.add(role);
                            }

                            const embed = Utils.Embed({ title: lang.Other.OtherCommands.Apply.Embeds.Accepted.Title, description: lang.Other.OtherCommands.Apply.Embeds.Accepted.Description, color: config.Success_Color });
                            if (config.Applications.DM_Decision) applyingUser.send(embed).catch(error => message.channel.send(lang.Other.OtherCommands.Apply.Errors.CantNotify));
                            channel.send(`<@${applyingUser.id}>`, { embed: embed.embed });

                            bot.emit("applicationAccepted", member, message, applyingUser);
                        } else if (emojiKey == "🗑️") {
                            let logs = Utils.findChannel(config.Applications.Logs.Channel, message.guild);
                            let applyingUser = message.guild.member(channel.topic.split("\n")[1].split(": ")[1]) || channel.topic.split('\n')[0].split(' : ')[1];
                            if (!logs) return message.channel.send(Embed({ preset: 'console' }));
                            logs.send(Embed({ title: lang.Other.OtherCommands.Apply.Embeds.Closed.Title, fields: [{ name: lang.Other.OtherCommands.Apply.Embeds.Closed.Field, value: ((applyingUser.user) ? `<@${applyingUser.id}>` : applyingUser) }] }));
                            channel.delete();
                        }
                    }
                }
            }
        }*/
    }
}
// 159331   8501   648409    46410   1590653881   15b8468e6abc07ecf8208e70b709702258380118   648409
