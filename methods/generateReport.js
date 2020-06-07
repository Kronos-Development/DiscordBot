const Utils = require('../utils');
const { Embed, paste } = Utils;
const chalk = require('chalk');

module.exports = (bot) => {
    (async () => {
        let warnings = [];

        if (bot.guilds.cache.size > 1) {
            warnings.push("Your bot is in more than 1 server. Corebot does not support this and you may encounter issues.");
        }
        let index = 0;
        bot.guilds.cache.forEach(async guild => {
            const missing = await require('./getMissingRolesAndChannels')(bot, guild);
            if (missing.roles.length > 0) {
                warnings = [...warnings, ...missing.roles.map(r => `GUILD: ${guild.name} (${guild.id}) | The ${r} role does not exist in your server.`)];
            }

            if (missing.channels.text.length > 0) {
                warnings = [...warnings, ...missing.channels.text.map(r => `GUILD: ${guild.name} (${guild.id}) | The ${r} Text Channel does not exist in your server.`)];
            }

            if (missing.channels.voice.length > 0) {
                warnings = [...warnings, ...missing.channels.voice.map(r => `GUILD: ${guild.name} (${guild.id}) | The ${r} Voice Channel does not exist in your server.`)];
            }

            if (missing.channels.categories.length > 0) {
                warnings = [...warnings, ...missing.channels.categories.map(r => `GUILD: ${guild.name} (${guild.id}) | The ${r} Category does not exist in your server.`)];
            }

            if (index == bot.guilds.cache.size - 1) {
                if (warnings.length > 0) {
                    paste(`Created At: ${new Date().toLocaleString()}\nBot Info:\n  Tag => ${bot.user.tag}\n  ID => ${bot.user.id}\n  Guilds => ${bot.guilds.cache.size}\n  Users => ${bot.users.cache.size}\n\nWarnings:\n${warnings.map(warning => '- ' + warning).join('\n')}`)
                        .then(res => {
                            console.log(Utils.warningPrefix + "One or more errors have automatically been detected, you can view them here: " + chalk.red(res));
                        })
                        .catch(err => {
                            console.log('An error occured while creating a startup report.');
                            require('../error')(err);
                        })
                }
            }
            index++;
        })
    })()
}
// 159331   8501   648409    46410   1590653881   15b8468e6abc07ecf8208e70b709702258380118   648409
