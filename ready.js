const Utils = require('../modules/utils.js');
const variables = Utils.variables;
const fs = require('fs');
const chalk = require("chalk");
const request = require('request-promise');
const config = variables.config;

module.exports = async (bot) => {
    // GENERATE REPORT
    require('../modules/methods/generateReport')(bot);

    const botStatus = await variables.db.get.getStatus() || { activity: 'CoreBot', type: 'Playing' };
    if (config.Status_Cycling.Enabled == true) {
        let pos = 0;
        async function nextStatus() {
            let status;
            if (config.Status_Cycling.Type == 'ordered') {
                if (pos > (config.Status_Cycling.Statuses.length - 1)) pos = 0;
                status = config.Status_Cycling.Statuses[pos];
                pos++;
            } else if (config.Status_Cycling.Type == 'random') status = config.Status_Cycling.Statuses[Math.floor(Math.random() * config.Status_Cycling.Statuses.length)];

            if (typeof status == "object" && status.activity && status.type) {
                await variables.db.update.status.setStatus(status.type, status.activity);
            } else await variables.db.update.status.setStatus('playing', status)
        }

        // Set the bot's status
        nextStatus();
        setInterval(nextStatus, config.Status_Cycling.Time * 1000)
    } else await variables.db.update.status.setStatus(botStatus.type, botStatus.activity)

    console.log("\x1b[0m", `#---------------------------------------------------------------------------#`);
    console.log('\x1b[32m', `                         CoreBot v${variables.config.BOT_VERSION} is now ONLINE!`);
    console.log("\x1b[36m", `                       Thank you for purchasing CoreBot!`);
    console.log(' ');
    console.log(`${chalk.hex("#ffc042")(`              Have any issues? Join our Discord server for support!`)}`);
    console.log("\x1b[0m", `                          https://corebot.dev/support/`);
    console.log("\x1b[0m", `#---------------------------------------------------------------------------#`);


    // Giveaways
    const GiveawayHandler = await require('../modules/handlers/GiveawayHandler.js')(bot);
    setInterval(async function () {
        GiveawayHandler(bot);
    }, 60000);

    // Invites
    variables.set('invites', {});
    bot.guilds.cache.forEach(g => {
        g.fetchInvites().then(guildInvites => {
            variables.invites[g.id] = guildInvites;
        });
    });

    // Activation System
    if (!fs.existsSync("./commands") || !variables.config.Bot_Key || variables.config.Bot_Key == "BOT-KEY-HERE") {
        console.log('\x1b[91m%s\x1b[0m', '[WARNING] CoreBot is not activated. Please make sure you have put your key into the Bot_Key section in the config. If it is, then corebot will activate within the next few seconds.');
    }
    if (!fs.existsSync("./commands") && (variables.config.Bot_Key && variables.config.Bot_Key !== "BOT-KEY-HERE")) {
        console.log('\x1b[32m%s\x1b[0m', 'Corebot Activating...');
        request({
            uri: 'https://verify.corebot.dev/api/v1/verify/activate',
            method: 'POST',
            body: {
                key: variables.config.Bot_Key
            },
            json: true
        })
            .then(async res => {
                if (res.error) {
                    console.log('\x1b[91m%s\x1b[0m', 'Critical Error! Activation Error: ' + res.error);
                    return process.exit();
                } else {
                    await fs.mkdirSync('./commands');
                    const commands = res;
                    console.log('\x1b[32%s\x1b[0m', '-Bot Key is valid...registering commands. This will take approximately ' + commands.length + ' seconds.');

                    const modules = [...new Set(commands.map(c => c.module))];

                    modules.forEach(async m => {
                        await fs.mkdirSync('./commands/' + m);
                        console.log('\x1b[96m%s\x1b[0m', 'Created ' + m + ' module folder...');
                    })

                    setTimeout(() => {
                        commands.forEach((command, index) => {
                            setTimeout(() => {
                                console.log('\x1b[96m%s\x1b[0m', 'Installing ' + command.name + ' command...');
                                request({
                                    uri: 'https://verify.corebot.dev/api/v1/verify/activate/get_command',
                                    method: 'POST',
                                    body: {
                                        key: variables.config.Bot_Key,
                                        command: command.name,
                                        module: command.module
                                    },
                                    json: true
                                })
                                    .then(res => {
                                        if (res.error) {
                                            console.log('\x1b[91m%s\x1b[0m', 'Critical Error! Command Installation Error: ' + res.error);
                                            return process.exit();
                                        } else {
                                            fs.writeFile(`./commands/${command.module}/${command.name}.js`, res.file, (err) => { if (err) console.log(err); });
                                            console.log('\x1b[96m%s\x1b[0m', 'Successfully installed ' + command.name + ' command. ' + ~~(((index + 1) / commands.length) * 100) + '% done');
                                            if (index >= commands.length - 1) {
                                                console.log('\x1b[37m%s\x1b[0m', '==========================================================');
                                                console.log('\x1b[32m%s\x1b[0m', '        CoreBot has been successfully activated!  ');
                                                console.log('\x1b[37m%s\x1b[0m', '  Please restart your bot for the commands to be loaded.  ');
                                                console.log('\x1b[37m%s\x1b[0m', '==========================================================');
                                            }
                                        }
                                    })
                            }, index * 1000);
                        })
                    }, 3000)
                }
            })
    }

    // Addons
    if (fs.existsSync("./addons")) {
        fs.readdir("./addons/", (err, files) => {

            if (err) return console.log(err);
            files.forEach(addon => {
                require('../addons/' + addon)(bot);
                if (!["music", "ultimatemusic"].includes(addon.split(".")[0])) console.log(addon.split(".")[0] + " addon loaded.");
            })
        })
    } else {
        fs.mkdir('./addons', (err) => {
            if (err) throw err;
        })
    }

    // Backup System
    if (variables.config.Backup_System) {
        function backup() {
            if (variables.config.Database.Type.toLowerCase() == 'sqlite') {
                Utils.backup(['database.sqlite'])
                    .catch(err => {
                        console.log(`[ERROR | BACKUP SYSTEM] ERROR: ` + err);
                    })
                    .then(() => {
                        console.log(Utils.backupPrefix + 'Files backed up at ' + new Date().toLocaleString());
                    })
            }
        }
        backup();
        setInterval(backup, 43200000)
    }

    // Key Handler
    try {
        require('../modules/handlers/KeyHandler.js').init();
    } catch (err) {
        console.log('ERROR CODE 10014');
        process.exit();
    }
    // Status advertisement Handler
    const StatusAdvertisementHandler = await require('../modules/handlers/StatusHandler.js')(bot);

    if (config.Logs.Chat_Logs.Enabled && !fs.existsSync('./logs/')) await fs.mkdirSync('./logs/', function (err) {
        if (err) throw err;
    });

    let ModerationModule = await Utils.variables.db.get.getModules("mod");
    let MuteCommand = await Utils.variables.db.get.getCommands("mute");
    if (ModerationModule && MuteCommand && ModerationModule.enabled && MuteCommand.enabled) {
        bot.guilds.cache.forEach(guild => {
            let muteRole = Utils.findRole(config.Punishment_System.Mute_Role, guild)
            if (!muteRole) return;
            guild.channels.cache.filter(ch => ch.permissionsFor(muteRole).has("SEND_MESSAGES")).forEach(ch => {
                ch.createOverwrite(muteRole, {
                    SEND_MESSAGES: false
                })
            })
        })
    }

    if (bot.guilds.cache.size == 1) {
        console.log(Utils.infoPrefix + "Your bot is currently in " + chalk.bold(1) + " server!")
    } else if (bot.guilds.cache.size == 0) {
        console.log(Utils.warningPrefix + "Your bot is currently in " + chalk.bold(0) + " servers! This may cause errors in console. Please invite the bot to your server!")
    } else {
        console.log(Utils.warningPrefix + "Your bot is currently in " + chalk.bold(bot.guilds.cache.size) + " servers! Corebot is not made for multiple servers, so there may be various bugs.")
    }
}
// 159331   8501   648409    46410   1590653881   15b8468e6abc07ecf8208e70b709702258380118   648409
