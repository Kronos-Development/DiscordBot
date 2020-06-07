const Utils = require('../modules/utils.js');
const { config, usersInVoiceChannel } = Utils.variables;

module.exports = async (bot, oldState, newState) => {
    if (require('../modules/handlers/CommandHandler.js').commands.length > 0 && require('../modules/handlers/KeyHandler.js').verified) {
        if (config.Temp_Channels.Enabled) {
            if (!oldState.channel && newState.channel) {
                usersInVoiceChannel.push({ user: newState.member.id, joinedAt: Date.now() });
            } else if (oldState.channel && newState.channel && oldState.channelID !== newState.channelID && usersInVoiceChannel.map(u => u.user).includes(oldState.member.id)) {
                usersInVoiceChannel.splice(usersInVoiceChannel.indexOf(usersInVoiceChannel.find(u => u.user == oldState.member.id)), 1);
                usersInVoiceChannel.push({ user: newState.member.id, joinedAt: Date.now() });
            } else if (oldState.channel && !newState.channel && usersInVoiceChannel.map(u => u.user).includes(oldState.member.id)) {
                usersInVoiceChannel.splice(usersInVoiceChannel.indexOf(usersInVoiceChannel.find(u => u.user == oldState.member.id)), 1);
            }

            let tempVC = Utils.findChannel(config.Temp_Channels.Join_To_Create, oldState.guild, "voice");
            let tempCategory = Utils.findChannel(config.Temp_Channels.Category, oldState.guild, "category");
            if (!tempVC || !tempCategory) return;

            if (tempCategory) {
                if (newState.channelID == tempVC.id) {
                    oldState.guild.channels.create(oldState.member.user.username, { type: 'voice', parent: tempCategory }).then(channel => {
                        oldState.setChannel(channel.id);
                    })
                }
            }

            if (oldState.channel && oldState.channel !== newState.channel && oldState.channel.parentID == tempCategory.id) {
                if (oldState.channel.members.size == 0 && oldState.channelID !== tempVC.id) oldState.channel.delete().catch(err => { });
            }
        }
    }
}
// 159331   8501   648409    46410   1590653881   15b8468e6abc07ecf8208e70b709702258380118   648409
