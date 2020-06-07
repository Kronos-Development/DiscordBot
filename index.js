if (process.platform !== "win32") require("child_process").exec("npm install n && n lts");

const installModules = async () => {
  return new Promise(async (resolve, reject) => {
    if (process.argv.slice(2).map(a => a.toLowerCase()).includes("--no-install")) resolve();
    else {

      const { spawn } = require('child_process');

      const npmCmd = process.platform == "win32" ? 'npm.cmd' : 'npm';

      const commands = ['npm i', 'npm i sqlite3'];

      const install = spawn(npmCmd, ['i']);
      const installSqlite = spawn(npmCmd, ['i', 'sqlite3']);

      // Run install scripts
      Promise.all([install, installSqlite]
        .map((cmd, i) => {
          return new Promise(resolve => {
            console.log("Running '" + commands[i] + "' command.")
            cmd.stdout.on('data', (data) => {
              console.log(data.toString().trim())
            })

            cmd.stderr.on('data', (data) => {
              const chalk = require('chalk');
              console.log(chalk.red(data.toString().trim()));
            })

            cmd.on('exit', () => {
              resolve();
            })
          })
        }))
        .then(() => {
          // After all scripts have exited
          resolve();
        })
    }
  })
}
installModules().then(async () => {
  const Utils = require('./modules/utils.js');
  const variables = Utils.variables;

  let config;
  let lang;

  try {
    config = await Utils.yml('./config.yml');
    lang = await Utils.yml('./lang.yml');
  } catch (e) {
    if (['YAMLSemanticError', 'YAMLSyntaxError'].includes(e.name)) console.log(Utils.errorPrefix + "An error has occured while loading the config or lang file. Bot shutting down..." + Utils.color.Reset)
    else console.log(e);

    return process.exit();
  }

  variables.set('config', config);
  variables.set('lang', lang);

  // DATABASE
  const Database = await require('./modules/database.js').setup(config);

  // Set variables
  variables.set('usersInVoiceChannel', []);
  variables.set('errors', []);
  variables.set('db', Database)

  const Discord = require("discord.js");
  const fs = require('fs');

  const Embed = require('./modules/embed.js');
  const bot = new Discord.Client({ autoReconnect: true });

  variables.set('bot', bot);

  // COMMAND HANDLER
  const CommandHandler = require('./modules/handlers/CommandHandler.js').init();

  // EVENT HANDLER
  const EventHandler = require('./modules/handlers/EventHandler.js').init(bot);

  const error = require('./modules/error');
  process.on('uncaughtException', function (err) {
    console.log(err);

    Utils.variables.errors.push({
      error: err,
      author: "Unknown",
      message: "Unknown",
      time: Date.now()
    })
  })

  const { inspect } = require("util");

  process.on('unhandledRejection', async function (reason, promise) {
    const promiseText = inspect(promise) || "";
    try {
      error(reason.toString(), promiseText, !!promiseText ? promiseText.split("\n")[2].split(" ")[8].split(/\/|\\/).pop().replace(/\)|\(/g, '') : "Unknown");
    } catch (err) {
      error(reason.toString(), "Unknown", promiseText);
    }
  })

  Utils.yml('./config.yml')
    .then(config => {
      bot.login(config.Bot_Token);
      variables.set('bot', bot);
    })


  const readline = require('readline');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.on('line', (input) => {
    if (input == 'stop') {
      console.log('Bot shutting down...');
      process.exit();
    }
  });
});
// 159331   8501   648409    46410   1590653881   15b8468e6abc07ecf8208e70b709702258380118   648409
