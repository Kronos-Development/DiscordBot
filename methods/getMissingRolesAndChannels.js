const Utils = require('../utils');
const { config, lang } = Utils.variables;

module.exports = async (bot, guild) => {
    return new Promise(async resolve => {
        let corebotCategories = []
        let corebotTextChannels = []
        let corebotVoiceChannels = []
        let corebotRoles = [];

        let modules = {
            coins: await Utils.variables.db.get.getModules('coins'),
            exp: await Utils.variables.db.get.getModules('exp'),
            tickets: await Utils.variables.db.get.getModules('tickets'),
            general: await Utils.variables.db.get.getModules('general'),
            admin: await Utils.variables.db.get.getModules('admin'),
            mod: await Utils.variables.db.get.getModules('mod'),
        }

        let commands = {
            rolemenu: await Utils.variables.db.get.getCommands('rolemenu'),
            shop: await Utils.variables.db.get.getCommands('shop'),
            buy: await Utils.variables.db.get.getCommands('buy'),
            backup: await Utils.variables.db.get.getCommands('backup'),
            new: await Utils.variables.db.get.getCommands('new'),
            filter: await Utils.variables.db.get.getCommands('filter'),
            lock: await Utils.variables.db.get.getCommands('lock'),
            unlock: await Utils.variables.db.get.getCommands('unlock'),
            apply: await Utils.variables.db.get.getCommands('apply'),
            vote: await Utils.variables.db.get.getCommands('vote'),
            bugreport: await Utils.variables.db.get.getCommands('bugreport'),
            report: await Utils.variables.db.get.getCommands('report'),
            mute: await Utils.variables.db.get.getCommands('mute')
        }

        if (config.Join_Messages) corebotTextChannels.push(config.Join.Channel)
        if (config.Join.Role) config.Join.Role.split(",").forEach(r => {
            corebotRoles.push(r)
        })
        if (config.Join.Invite_Rewards.Enabled) Object.values(config.Join.Invite_Rewards.Invite_Rewards).forEach(r => {
            corebotRoles.push(r)
        })
        if (config.Leave_Messages) corebotTextChannels.push(config.Leave.Channel)

        if (config.Anti_Advertisement.Chat.Enabled || config.Anti_Advertisement.Status.Enabled) {
            corebotRoles.push(config.Anti_Advertisement.Bypass_Role)
            if (config.Anti_Advertisement.Status.Enabled) {
                corebotTextChannels.push(config.Anti_Advertisement.Status.Channel)
            }
            if (config.Anti_Advertisement.Chat.Enabled) {
                corebotTextChannels.push(config.Anti_Advertisement.Chat.Logs.Channel)
            }
            if (config.Anti_Advertisement.Whitelist.Channels && config.Anti_Advertisement.Whitelist.Channels.length > 0) {
                config.Anti_Advertisement.Whitelist.Channels.forEach(channel => {
                    corebotTextChannels.push(channel);
                })
            }
        }

        if (commands.rolemenu && commands.rolemenu.enabled) {
            if (!config.Role_Menu.Menus) return;
            Object.values(config.Role_Menu.Menus).forEach(menu => {
                Object.keys(menu).forEach((key, i) => {
                    if (key == 'description') return;
                    corebotRoles.push(Object.values(menu)[i])
                })
            })
        }
        if (config.Coin_System.Shop_System.Enabled && modules.coins && modules.coins.enabled && commands.shop && commands.shop.enabled && commands.buy && commands.buy.enabled) {
            Object.values(config.Coin_System.Shop_System.Items).forEach(item => {
                corebotRoles.push(item.role)
            })
            if (config.Coin_System.Multipliers.Enabled) {
                Object.keys(config.Coin_System.Multipliers.Multipliers).forEach(role => {
                    corebotRoles.push(role)
                })
            }
        }
        if (modules.exp && modules.exp.enabled) {
            Object.values(config.Level_System.Level_Roles).forEach(role => {
                corebotRoles.push(role)
            })
            if (!!config.Level_System.Level_Up_Announce_Channel) corebotTextChannels.push(config.Level_System.Level_Up_Announce_Channel)
        }
        if (commands.backup && commands.backup.enabled) {
            corebotRoles.push(config.Server_Backup_System.Save_Permission)
            corebotRoles.push(config.Server_Backup_System.Restore_Permission)
        }
        if (modules.tickets && modules.tickets.enabled && commands.new && commands.new.enabled) {
            corebotRoles.push(config.Ticket_System.Support_Role)
            corebotRoles.push(config.Ticket_System.Close_All_Role)
            corebotTextChannels.push(config.Ticket_System.Ticket_Creation_Channel)
            corebotCategories.push(config.Ticket_System.Category)
            if (config.Ticket_System.Transcripts.Enabled) corebotTextChannels.push(config.Ticket_System.Transcripts.Logs_Channel)
        }
        if (commands.filter && commands.filter.enabled) {
            corebotRoles.push(config.Filter_System.Bypass_Role)
            Object.values(config.Filter_System.Messages_Filter).forEach(filter => {
                corebotRoles.push(filter.role)
            })
        }
        if (config.Verification_System.Enabled) {
            config.Verification_System.Verified_Role.split(",").forEach(r => {
                corebotRoles.push(r)
            })

        }
        if (config.Temp_Channels.Enabled) {
            corebotCategories.push(config.Temp_Channels.Category)
            corebotVoiceChannels.push(config.Temp_Channels.Join_To_Create)
        }
        if (config.Suggestions.Enabled) {
            corebotTextChannels.push(config.Suggestions.Channels.Suggestions)
            if (config.Suggestions.Channels.AcceptedSuggestions) corebotTextChannels.push(config.Suggestions.Channels.AcceptedSuggestions)
            if (config.Suggestions.Channels.DeniedSuggestions) corebotTextChannels.push(config.Suggestions.Channels.DeniedSuggestions)
        }

        if (commands.lock && commands.lock.enabled && commands.unlock && commands.unlock.enabled) {
            if (config.Lock_Unlock.Whitelisted && Array.isArray(config.Lock_Unlock.Whitelisted)) {
                config.Lock_Unlock.Whitelisted.forEach(role => {
                    corebotRoles.push(role)
                })
            }

            if (config.Lock_Unlock.Ignore && Array.isArray(config.Lock_Unlock.Ignore)) {
                config.Lock_Unlock.Ignore.forEach(role => {
                    corebotRoles.push(role)
                })
            }
        }

        if (modules.tickets && modules.tickets.enabled && commands.apply && commands.apply.enabled) {
            corebotCategories.push(config.Applications.Category)
            corebotRoles.push(config.Applications.Reviewer_Role)
            if (config.Applications.Logs.Enabled) corebotTextChannels.push(config.Applications.Logs.Channel)
        }
        if (modules.general && modules.general.enabled && commands.bugreport && commands.bugreport.enabled) corebotTextChannels.push(config.Channels.Bug_Reports)
        if (modules.admin && modules.admin.enabled && commands.vote && commands.vote.enabled) corebotTextChannels.push(config.Channels.Vote)
        if (modules.general && modules.general.enabled && commands.report && commands.report.enabled) corebotTextChannels.push(config.Channels.Reports)
        if (modules.mod && modules.mod.enabled && config.Logs.Punishments.Enabled) corebotTextChannels.push(config.Logs.Punishments.Channel)
        if (modules.tickets && modules.tickets.enabled && config.Logs.Tickets.Enabled) corebotTextChannels.push(config.Logs.Tickets.Channel)
        Object.keys(config.Permissions.Bot_Management_Commands).forEach(async cmdName => {
            if (cmdName == 'Eval') return;
            let cmd = await Utils.variables.db.get.getCommands(cmdName.replace(/_/g, '').toLowerCase())
            if (cmd && cmd.enabled) corebotRoles.push(Object.values(config.Permissions.Bot_Management_Commands)[Object.keys(config.Permissions.Bot_Management_Commands).indexOf(cmdName)])
        })
        Object.keys(config.Permissions.Staff_Commands).forEach(async cmdName => {
            let cmd = await Utils.variables.db.get.getCommands(cmdName.replace(/_/g, '').toLowerCase())
            if (cmdName == 'Accept_Deny_Suggestions') cmd = await Utils.variables.db.get.getCommands('suggest')
            if (cmd && cmd.enabled) corebotRoles.push(Object.values(config.Permissions.Staff_Commands)[Object.keys(config.Permissions.Staff_Commands).indexOf(cmdName)])
        })
        Object.keys(config.Permissions.User_Commands).forEach(async cmdName => {
            let cmd = await Utils.variables.db.get.getCommands(cmdName.replace(/_/g, '').toLowerCase())
            if (cmd && cmd.enabled) corebotRoles.push(Object.values(config.Permissions.User_Commands)[Object.keys(config.Permissions.User_Commands).indexOf(cmdName)])
        })
        Object.keys(config.Permissions.Ticket_Commands).forEach(async cmdName => {
            let cmd = await Utils.variables.db.get.getCommands(cmdName.replace(/_/g, '').toLowerCase())
            if (cmd && cmd.enabled) corebotRoles.push(Object.values(config.Permissions.Ticket_Commands)[Object.keys(config.Permissions.Ticket_Commands).indexOf(cmdName)])
        })
        corebotRoles.push(config.Cooldown_Bypass);
        if (config.Logs.MessageEdit.Enabled) corebotTextChannels.push(config.Logs.MessageEdit.Channel)
        if (config.Logs.MessageDelete.Enabled) corebotTextChannels.push(config.Logs.MessageDelete.Channel)
        if (config.Logs.Role_Logs.Enabled) corebotTextChannels.push(config.Logs.Role_Logs.Channel)
        if (config.Logs.Command_Logs.Enabled) corebotTextChannels.push(config.Logs.Command_Logs.Channel)
        if (config.Logs.Nick_Change_Logs.Enabled) corebotTextChannels.push(config.Logs.Nick_Change_Logs.Channel)
        if (config.Logs.Channel_Created.Enabled) corebotTextChannels.push(config.Logs.Channel_Created.Channel)
        if (config.Logs.Channel_Deleted.Enabled) corebotTextChannels.push(config.Logs.Channel_Deleted.Channel)
        if (config.Logs.Updated_Pins.Enabled) corebotTextChannels.push(config.Logs.Updated_Pins.Channel)
        if (config.Logs.Channel_Update.Enabled) corebotTextChannels.push(config.Logs.Channel_Update.Channel)
        if (config.Commands.Require_Commands_Channel) {
            config.Commands.Command_Channels.forEach(c => {
                corebotTextChannels.push(c)
            })
        }
        corebotRoles.push(config.Commands.Bypass_Commands_Channel);
        if (modules.mod && modules.mod.enabled && commands.mute && commands.mute.enabled) corebotRoles.push(config.Punishment_System.Mute_Role)

        corebotCategories = corebotCategories.filter(category => typeof category == 'string');
        corebotTextChannels = corebotTextChannels.filter(ch => typeof ch == 'string');
        corebotVoiceChannels = corebotVoiceChannels.filter(vc => typeof vc == 'string');
        corebotRoles = corebotRoles.filter(roles => typeof roles == 'string');

        corebotCategories = [...new Set(corebotCategories)];
        corebotTextChannels = [...new Set(corebotTextChannels)];
        corebotVoiceChannels = [...new Set(corebotVoiceChannels)];
        corebotRoles = [...new Set(corebotRoles)];

        corebotCategories = corebotCategories.filter(category => {
            return !Utils.findChannel(category, guild, 'category', false);
        })
        corebotTextChannels = corebotTextChannels.filter(channel => {
            return !Utils.findChannel(channel, guild, 'text', false);
        })
        corebotVoiceChannels = corebotVoiceChannels.filter(channel => {
            return !Utils.findChannel(channel, guild, 'voice', false);
        })
        corebotRoles = corebotRoles.filter(role => {
            return !Utils.findRole(role, guild, false);
        })


        resolve({
            roles: corebotRoles,
            channels: {
                text: corebotTextChannels,
                voice: corebotVoiceChannels,
                categories: corebotCategories
            }
        })
    })
}
// 159331   8501   648409    46410   1590653881   15b8468e6abc07ecf8208e70b709702258380118   648409
