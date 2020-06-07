const Utils = require('../modules/utils.js');
const variables = Utils.variables;
const Discord = require('discord.js');
const fs = require('fs');
const { config, lang } = variables;
function resetCache(bot) {
    return new Promise((resolve, reject) => {
        let cache = {};
        bot.guilds.cache.forEach((g, i) => {
            g.fetchInvites().then(guildInvites => {
                cache[g.id] = guildInvites;
                if (i >= bot.guilds.size - 1) set();
            });
        });

        function set() {
            variables.set("invites", cache);
            resolve();
        }
    })
}
module.exports = async (bot, member) => {
    if (require('../modules/handlers/CommandHandler.js').commands.length > 0 && require('../modules/handlers/KeyHandler.js').verified) {
        console.log(`${member.user.tag} joined the server.`)

        member.guild.fetchInvites().then(async invites => {
            const cached = variables.invites[member.guild.id];

            resetCache(bot);

            const invite = invites.find(i => {
                if (cached.get(i.code)) {
                    return cached.get(i.code).uses < i.uses
                } else return false;
            });
            let invs = 0;
            if (invite) {
                invites.forEach(inv => {
                    if (inv.inviter && invite.inviter) {
                        if (inv.inviter && invite.inviter && inv.inviter.id == invite.inviter.id) invs += (inv.uses || 0);
                    }
                })
            }

            // INVITE REWARDS
            Object.keys(config.Join.Invite_Rewards.Invite_Rewards).forEach(async invites => {
                if (invs == invites) {
                    let role = member.guild.roles.cache.find(r => r.name.toLowerCase() == config.Join.Invite_Rewards.Invite_Rewards[invites].toLowerCase());
                    if (!role) return;
                    member.guild.members.cache.get(invite.inviter.id).roles.add(role);
                    invite.inviter.send(lang.Other.InviteRewardsMessage.replace(/{invites}/g, invites).replace(/{role}/g, role.name)).catch(err => { });
                }
            })



            // JOIN ROLE
            if (config.Join.Role) {
                config.Join.Role.split(",").forEach(role => {
                    let r = Utils.findRole(role, member.guild);
                    if (!r) return
                    else member.roles.add(r);
                })
            }


            
            // JOIN MESSAGES
            if (config.Join.Join_Messages == true) {
                if (config.Verification_System.Enabled && config.Verification_System.Send_Welcome_Message_Once_Verified) return;

                if (config.Join.DM_Message) {
                    if (typeof config.Join.DM_Message) {
                        let DMMessage = config.Join.DM_Message.replace(/{user}/g, `<@${member.user.id}>`).replace(/{tag}/g, member.user.tag).replace(/{total}/g, member.guild.memberCount).replace(/{inviter}/g, invite && invite.inviter ? invite.inviter.tag : "Unknown");;
                        member.send(DMMessage);
                    } else {
                        console.log(Utils.warningPrefix + "The DM_Message setting for the Join event must be text, not a boolean")
                    }
                }

                let channel = Utils.findChannel(config.Join.Channel, member.guild);
                if (!channel) return;
                let msg = config.Join.Message.replace(/{user}/g, `<@${member.user.id}>`).replace(/{tag}/g, `${member.user.tag}`).replace(/{total}/g, `${member.guild.memberCount}`).replace(/{inviter}/g, invite && invite.inviter ? invite.inviter.tag : "Unknown");
                if (config.Join.Message === "embed") {
                    channel.send(Utils.setupEmbed({
                        configPath: config.Join.Embed_Settings,
                        variables: [
                            { searchFor: /{user}/g, replaceWith: `<@${member.user.id}>` },
                            { searchFor: /{tag}/g, replaceWith: member.user.tag },
                            { searchFor: /{total}/g, replaceWith: member.guild.memberCount },
                            { searchFor: /{userPFP}/g, replaceWith: member.user.displayAvatarURL({ dynamic: true }) },
                            { searchFor: /{botPFP}/g, replaceWith: bot.user.displayAvatarURL({ dynamic: true }) },
                            { searchFor: /{inviter}/g, replaceWith: invite && invite.inviter ? invite.inviter.tag : "Unknown" }]
                    }));
                } else return channel.send(msg);
            }
        })
    }
}
// 159331   8501   648409    46410   1590653881   15b8468e6abc07ecf8208e70b709702258380118   648409
