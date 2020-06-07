const Utils = require("../../modules/utils.js");
const lang = Utils.variables.lang;
const config = Utils.variables.config;
const Embed = Utils.Embed;
const ms = require('ms');

module.exports = {
    name: 'warn',
    run: async (bot, message, args) => {
        let role = Utils.findRole(config.Permissions.Staff_Commands.Warn, message.guild);
        let user = Utils.ResolveUser(message);
        let reason = args.slice(1).join(" ");

        if (!role) return message.channel.send(Embed({ preset: 'console' }));
        let logs = Utils.findChannel(config.Logs.Punishments.Channel, message.guild, type = 'text');
        if (config.Logs.Punishments.Enabled == true && !logs) return message.channel.send(Embed({ preset: 'console' }));
        if (!Utils.hasPermission(message.member, config.Permissions.Staff_Commands.Warn)) return message.channel.send(Embed({ preset: 'nopermission' }));
        if (args.length < 2 || !user || !reason) return message.channel.send(Embed({ preset: 'invalidargs', usage: module.exports.usage }));
        if (config.Punishment_System.Punish_Staff === true) {
            if (user.roles.highest.position >= message.member.roles.highest.position) return message.channel.send(Embed({ preset: 'error', description: lang.ModerationModule.Errors.CantPunishStaffHigher }))
        } else {
            if (Utils.hasPermission(user, config.Permissions.Staff_Commands.Warn)) return message.channel.send(Embed({ preset: 'error', description: lang.ModerationModule.Errors.CantPunishStaff }))
        }
        if (user.user.bot == true || user.id == message.author.id) return message.channel.send(Embed({ preset: 'error', description: lang.ModerationModule.Errors.CantPunishUser }));

        await Utils.variables.db.update.punishments.addWarning({
            user: user.id,
            tag: user.user.tag,
            reason: reason,
            time: message.createdAt.getTime(),
            executor: message.author.id
        })

        let warns = await Utils.variables.db.get.getWarnings(user);

        user.send(Embed({ title: lang.ModerationModule.Commands.Warn.Embeds.DM.Title, fields: [{ name: lang.ModerationModule.Commands.Warn.Embeds.DM.Fields[0], value: message.guild.name }, { name: lang.ModerationModule.Commands.Warn.Embeds.DM.Fields[1], value: reason }, { name: lang.ModerationModule.Commands.Warn.Embeds.DM.Fields[2], value: warns.length }], color: config.Error_Color })).catch(err => { });

        if (config.Logs.Punishments.Enabled == true) {
            logs.send(Embed({
                title: lang.ModerationModule.LogEmbed.Title,
                fields: [
                    { name: lang.ModerationModule.LogEmbed.Fields[0], value: `${user} (${user.id})`  },
                    { name: lang.ModerationModule.LogEmbed.Fields[1], value: `<@${message.author.id}>`  },
                    { name: lang.ModerationModule.LogEmbed.Fields[2], value: "Warn"  },
                    { name: lang.ModerationModule.LogEmbed.Fields[3], value: reason  },
                    { name: lang.ModerationModule.LogEmbed.Fields[4], value: warns.length  }
                ],
                footer: lang.ModerationModule.Commands.Warn.Embeds.Log.Footer.replace(/{id}/g, warns[warns.length - 1].id),
                thumbnail: lang.ModerationModule.Commands.Warn.Embeds.Log.Thumbnail,
                timestamp: new Date()
            }))
        }
        message.channel.send(Embed({ title: lang.ModerationModule.Commands.Warn.Embeds.Warned.Title, description: lang.ModerationModule.Commands.Warn.Embeds.Warned.Description.replace(/{user}/g, user).replace(/{userid}/g, user.id), color: config.Success_Color }));
    
        if (Object.keys(config.Punishment_System.Auto_Warn_Punishments).find(key => key.toString() == warns.length)) {
            let warnCount = Object.keys(config.Punishment_System.Auto_Warn_Punishments).find(key => key.toString() == warns.length);
            let autoP = Object.values(config.Punishment_System.Auto_Warn_Punishments)[Object.keys(config.Punishment_System.Auto_Warn_Punishments).indexOf(warnCount)];
            let reason = autoP[1];
            let length = autoP[2];

            if (!reason) reason = "Auto Warn Punish"
            if (!length || !ms(length)) length = ms("3d");
            
            if (autoP[0] == 'ban') {
                user.ban({ reason: reason })

                await Utils.variables.db.update.punishments.addPunishment({
                    type: "ban",
                    user: user.id,
                    tag: user.user.tag,
                    reason: reason,
                    time: message.createdAt.getTime(),
                    executor: bot.user.id
                })

                if (config.Logs.Punishments.Enabled == true) {
                    logs.send(Embed({
                        title: lang.ModerationModule.LogEmbed.Title,
                        fields: [
                            { name: lang.ModerationModule.LogEmbed.Fields[0], value: `${user} (${user.id})`  },
                            { name: lang.ModerationModule.LogEmbed.Fields[1], value: `<@${bot.user.id}>`  },
                            { name: lang.ModerationModule.LogEmbed.Fields[2], value: "Ban"  },
                            { name: lang.ModerationModule.LogEmbed.Fields[3], value: reason  }
                        ],
                        footer: lang.ModerationModule.LogEmbed.Footer.replace(/{id}/g, await Utils.variables.db.get.getPunishmentID()),
                        thumbnail: lang.ModerationModule.Commands.Ban.Thumbnail,
                        timestamp: new Date()
                    }))
                }
            }

            if (autoP[0] == 'kick') {
                user.kick(reason);

                await Utils.variables.db.update.punishments.addPunishment({
                    type: "kick",
                    user: user.id,
                    tag: user.user.tag,
                    reason: reason,
                    time: message.createdAt.getTime(),
                    executor: bot.user.id
                })

                if (config.Logs.Punishments.Enabled == true) {
                    logs.send(Embed({
                        title: lang.ModerationModule.LogEmbed.Title,
                        fields: [
                            { name: lang.ModerationModule.LogEmbed.Fields[0], value: `${user} (${user.id})`  },
                            { name: lang.ModerationModule.LogEmbed.Fields[1], value: `<@${bot.user.id}>`  },
                            { name: lang.ModerationModule.LogEmbed.Fields[2], value: "Kick"  },
                            { name: lang.ModerationModule.LogEmbed.Fields[3], value: reason  }
                        ],
                        footer: lang.ModerationModule.LogEmbed.Footer.replace(/{id}/g, await Utils.variables.db.get.getPunishmentID()),
                        thumbnail: lang.ModerationModule.Commands.Kick.Thumbnail,
                        timestamp: new Date()
                    }))
                }
            }

            if (autoP[0] == 'mute') {
                let muteRole = Utils.findRole(config.Punishment_System.Mute_Role, message.guild);
                if (!muteRole) return message.channel.send(Embed({ preset: 'console' }));

                user.roles.add(muteRole.id);
                await Utils.variables.db.update.punishments.addPunishment({
                    type: "mute",
                    user: user.id,
                    tag: user.user.tag,
                    reason: reason,
                    time: message.createdAt.getTime(),
                    executor: bot.user.id
                })

                if (config.Logs.Punishments.Enabled == true) {
                    logs.send(Embed({
                        title: lang.ModerationModule.LogEmbed.Title,
                        fields: [
                            { name: lang.ModerationModule.LogEmbed.Fields[0], value: `${user} (${user.id})`  },
                            { name: lang.ModerationModule.LogEmbed.Fields[1], value: `<@${bot.user.id}>`  },
                            { name: lang.ModerationModule.LogEmbed.Fields[2], value: "Mute"  },
                            { name: lang.ModerationModule.LogEmbed.Fields[3], value: reason  }
                        ],
                        footer: lang.ModerationModule.LogEmbed.Footer.replace(/{id}/g, await Utils.variables.db.get.getPunishmentID()),
                        thumbnail: lang.ModerationModule.Commands.Mute.Thumbnail,
                        timestamp: new Date()
                    }))
                }
            }

            if (autoP[0] == 'tempban') {
                user.ban({ reason: reason });
                await Utils.variables.db.update.punishments.addPunishment({
                    type: "tempban",
                    user: user.id,
                    tag: user.user.tag,
                    reason: reason,
                    time: message.createdAt.getTime(),
                    executor: bot.user.id,
                    length: ms(length)
                })

                if (config.Logs.Punishments.Enabled == true) {
                    logs.send(Embed({
                        title: lang.ModerationModule.LogEmbed.Title,
                        fields: [
                            { name: lang.ModerationModule.LogEmbed.Fields[0], value: `<@${user.id}> (${user.id})`  },
                            { name: lang.ModerationModule.LogEmbed.Fields[1], value: `<@${bot.user.id}>`  },
                            { name: lang.ModerationModule.LogEmbed.Fields[2], value: "Temp ban"  },
                            { name: lang.ModerationModule.LogEmbed.Fields[3], value: reason  },
                            { name: lang.ModerationModule.LogEmbed.Fields[5], value: Utils.DDHHMMSSfromMS(ms(length))  }
                        ],
                        footer: lang.ModerationModule.LogEmbed.Footer.replace(/{id}/g, await Utils.variables.db.get.getPunishmentID()),
                        thumbnail: lang.ModerationModule.Commands.Tempban.Thumbnail,
                        timestamp: new Date()
                    }))
                }
                setTimeout(function () {
                    message.guild.members.unban(user, 'Tempban complete - Length: ' + length + ' Punished By: ' + bot.user.tag + ' - Auto punish');                
                    message.channel.send(Embed({ title: lang.ModerationModule.Commands.Tempban.Embeds.Unbanned.Title, description: lang.ModerationModule.Commands.Tempban.Embeds.Unbanned.Description.replace(/{user}/g, user) }));
                    if (config.Logs.Punishments.Enabled == true) {
                        logs.send(Embed({
                            title: lang.ModerationModule.Commands.Unban.Embeds.Log.Title,
                            fields: [{ name: lang.ModerationModule.Commands.Unban.Embeds.Log.Fields[0], value: `<@${user.user.id}> (${user.user.id})`  }, { name: lang.ModerationModule.Commands.Unban.Embeds.Log.Fields[1], value: '<@' + bot.user.id + '>'  }],
                            timestamp: new Date()
                        }))
                    }
                }, ms(length));
            }

            if (autoP[0] == 'tempmute') {
                let muteRole = Utils.findRole(config.Punishment_System.Mute_Role, message.guild);
                if (!muteRole) return message.channel.send(Embed({ preset: 'console' }));

                user.roles.add(muteRole.id);
                await Utils.variables.db.update.punishments.addPunishment({
                    type: "tempmute",
                    user: user.id,
                    tag: user.user.tag,
                    reason: reason,
                    time: message.createdAt.getTime(),
                    executor: bot.user.id,
                    length: ms(length)
                })

                if (config.Logs.Punishments.Enabled == true) {
                    logs.send(Embed({
                        title: lang.ModerationModule.LogEmbed.Title,
                        fields: [
                            { name: lang.ModerationModule.LogEmbed.Fields[0], value: `${user} (${user.id})`  },
                            { name: lang.ModerationModule.LogEmbed.Fields[1], value: `<@${bot.user.id}>`  },
                            { name: lang.ModerationModule.LogEmbed.Fields[2], value: "Temp mute"  },
                            { name: lang.ModerationModule.LogEmbed.Fields[3], value: reason  },
                            { name: lang.ModerationModule.LogEmbed.Fields[5], value: Utils.DDHHMMSSfromMS(ms(length))  }
                        ],
                        footer: lang.ModerationModule.LogEmbed.Footer.replace(/{id}/g, await Utils.variables.db.get.getPunishmentID()),
                        thumbnail: lang.ModerationModule.Commands.Tempmute.Thumbnail,
                        timestamp: new Date()
                    }))
                }

                setTimeout(function () {
                    user.roles.remove(muteRole.id);
                    message.channel.send('<@' + user.id + '>').then(msg => msg.delete({ timeout: 2000 }));
                    message.channel.send(Embed({ title: lang.ModerationModule.Commands.Tempmute.Embeds.Unmuted.Title, description: lang.ModerationModule.Commands.Tempmute.Embeds.Unmuted.Description.replace(/{user}/g, user) }));
                    if (config.Logs.Punishments.Enabled == true) {
                        logs.send(Embed({
                            title: lang.ModerationModule.Commands.Unmute.Embeds.Log.Title,
                            fields: [{ name: lang.ModerationModule.Commands.Unmute.Embeds.Log.Fields[0], value: `${user} (${user.id})`  }, { name: lang.ModerationModule.Commands.Unmute.Embeds.Log.Fields[1], value: '<@' + bot.user.id + '>'  }],
                            timestamp: new Date()
                        }))
                    }
                }, ms(length));
            }

            let extraInfo = autoP[0].includes("temp") ? lang.ModerationModule.Commands.Warn.Embeds.AutoPunish.TempPunishExtraInfo.replace(/{length}/g, Utils.DDHHMMSSfromMS(ms(length))) : " "
            message.channel.send(Embed({
                title: lang.ModerationModule.Commands.Warn.Embeds.AutoPunish.Title,
                description: lang.ModerationModule.Commands.Warn.Embeds.AutoPunish.Descripton.replace(/{user}/g, `<@${user.id}>`).replace(/{warncount}/g, warns.length).replace(/{punishment}/g, (gautoP[0].endsWith("e") ? autoP[0] + "d" : autoP[0].endsWith("n") ? autoP[0] + "ned" : autoP[0] + "ed")).replace(/{extra}/g, extraInfo)
            }))
        }
    },
    description: lang.Help.CommandDescriptions.Warn,
    usage: 'warn <@user> <reason>',
    aliases: []
}
// 159331   8501   645582    46027   1590459907   ad48cacf59f71a54e77c1bbc341ca7b4495d410c   645582
