const Utils = require('../modules/utils');
const { Embed, variables } = Utils;
const lang = Utils.variables.lang;

const getOverwrites = (channel) => {
    return channel.permissionOverwrites.map(overwrite => { const { allow, deny, type } = overwrite; return { allow, deny, type } });
}

const compareOverwrites = (original, compare) => {
    if (original.length !== compare.length) return;

    let different = false;
    compare.forEach((overwrite, i) => {
        // Get the original permission so we can compare them
        const originalPermission = original[i];

        // The parameters to compare
        const check = ["allow", "deny", "type"];
        check.forEach(c => {
            // If the parameter in the original permission does not equal the permission in the current one, set same to false
            if (originalPermission[c] !== overwrite[c])
                different = true;
        })
    })
    return different;
}
module.exports = async (bot, oldChannel, newChannel) => {
    if (require('../modules/handlers/CommandHandler.js').commands.length > 0 && require('../modules/handlers/KeyHandler.js').verified) {
        if (!newChannel.guild || !variables.config.Logs.Channel_Update.Enabled) return;
        if (variables.config.Logs.Channel_Update.Ignore.some(name => oldChannel.name.toLowerCase().startsWith(name.toLowerCase()))) return;
        const logs = Utils.findChannel(variables.config.Logs.Channel_Update.Channel, newChannel.guild);
        if (!logs) return;
        if (oldChannel.name !== newChannel.name) {
            logs.send(Embed({
                title: lang.LogSystem.ChannelUpdated.NameUpdated.Title,
                fields: [
                    {
                        name: lang.LogSystem.ChannelUpdated.NameUpdated.Fields[0],
                        value: (newChannel.type === 'text') ? `<#${newChannel.id}>` : newChannel.id
                    },
                    {
                        name: lang.LogSystem.ChannelUpdated.NameUpdated.Fields[1],
                        value: oldChannel.name
                    },
                    {
                        name: lang.LogSystem.ChannelUpdated.NameUpdated.Fields[2],
                        value: newChannel.name
                    }
                ],
                timestamp: Date.now()
            }))
        }
        if (compareOverwrites(getOverwrites(oldChannel), getOverwrites(newChannel))) {
            logs.send(Embed({
                title: lang.LogSystem.ChannelUpdated.PermsUpdated.Title,
                fields: [
                    {
                        name: lang.LogSystem.ChannelUpdated.PermsUpdated.Fields[0],
                        value: (newChannel.type === 'text') ? `<#${newChannel.id}>` : newChannel.name
                    },
                    {
                        name: lang.LogSystem.ChannelUpdated.PermsUpdated.Fields[1].Name,
                        value: lang.LogSystem.ChannelUpdated.PermsUpdated.Fields[1].Value
                    }
                ],
                timestamp: Date.now()
            }))
        }
        if (oldChannel.parentID !== newChannel.parentID) {
            logs.send(Embed({
                title: lang.LogSystem.ChannelUpdated.ParentUpdated.Title,
                fields: [
                    {
                        name: lang.LogSystem.ChannelUpdated.ParentUpdated.Fields[0],
                        value: `<#${newChannel.id}>`
                    },
                    {
                        name: lang.LogSystem.ChannelUpdated.ParentUpdated.Fields[1],
                        value: (oldChannel.parent) ? oldChannel.parent.name : lang.LogSystem.ChannelUpdated.ParentUpdated.None
                    },
                    {
                        name: lang.LogSystem.ChannelUpdated.ParentUpdated.Fields[2],
                        value: (newChannel.parent) ? newChannel.parent.name : lang.LogSystem.ChannelUpdated.ParentUpdated.None
                    }
                ],
                timestamp: Date.now()
            }))
        }
        if (oldChannel.topic !== newChannel.topic) {
            logs.send(Embed({
                title: lang.LogSystem.ChannelUpdated.TopicUpdated.Title,
                fields: [
                    {
                        name: lang.LogSystem.ChannelUpdated.TopicUpdated.Fields[0],
                        value: `<#${newChannel.id}>`
                    },
                    {
                        name: lang.LogSystem.ChannelUpdated.TopicUpdated.Fields[1],
                        value: (oldChannel.topic) ? oldChannel.topic : lang.LogSystem.ChannelUpdated.TopicUpdated.None
                    },
                    {
                        name: lang.LogSystem.ChannelUpdated.TopicUpdated.Fields[2],
                        value: newChannel.topic ? newChannel.topic : lang.LogSystem.ChannelUpdated.TopicUpdated.None
                    }
                ],
                timestamp: Date.now()
            }))
        }
    }
}
// 159331   8501   648409    46410   1590653881   15b8468e6abc07ecf8208e70b709702258380118   648409
