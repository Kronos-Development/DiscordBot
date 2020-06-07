const Utils = require('./utils.js');

String.prototype.replaceText = function replace(replace, value) {
    return this.String.replace(new RegExp(replace, 'g'), value);
}
module.exports = function (guild, text, customPlaceholders = []) {
    customPlaceholders.forEach(placeholder => {
        text = text.replaceText(placeholder['replace'], placeholder['value']);
    })
    return text.replace('%members%', guild.memberCount)
        .replace('%botcount%', guild.members.filter(m => m.user.bot).size)
        .replace('%humancount%', guild.members.filter(m => !m.user.bot).size)
        .replace('%channels%', guild.channels.size)
        .replace('%textchannels%', guild.channels.filter(c => c.type == 'text').size)
        .replace('%categories%', guild.channels.filter(c => c.type == 'category').size)
        .replace('%voicechannels%', guild.channels.filter(c => c.type == 'voice').size)
        .replace('%tickets%', guild.channels.filter(c => c.type == 'text' && /ticket-\d+/.test(c.name)).size)
    // LIST: https://paste.thislightman.com/epajuhetom.shell
}
// 159331   8501   648409    46410   1590653881   15b8468e6abc07ecf8208e70b709702258380118   648409
