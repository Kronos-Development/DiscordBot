const Utils = require('../utils.js');
const { error } = Utils;
const fs = require('fs');

module.exports = {
  commands: [],
  find: function (message, ignoreCase = true) {
    if (ignoreCase) message = message.toLowerCase();
    return this.commands.find(c => {
      // If the actual command equals the query 
      return (ignoreCase ? c.command.toLowerCase() : c.command) == message ||
        // If the aliases has the query
        c.aliases.map(a =>
          // If ignoreCase, set the alias to lower case
          ignoreCase ? a.toLowerCase() : a
        )
          .includes(message)
    })
  },
  set: function (command, folder) {
    if (['name', 'run', 'description', 'usage', 'aliases'].some(p => !command[p])) {
      return error('Command object does not have all properties needed.\nCurrent Properties: ' + Object.values(command).filter(p => !!p).map((p, i) => {
        let propertyName = Object.keys(command).filter(pName => !!Object.values(command)[Object.keys(command).indexOf(pName)])[i]
        if (propertyName == "run") {
          return `run: Async Function`
        } else {
          return `${propertyName}: ${p}`
        }
      }).join(", ") + '\nMissing Properties: ' + ['name', 'run', 'description', 'usage', 'aliases'].filter(p => !command[p]).join(', '));
    }
    const { cmds, modules } = module.exports;
    const cmdDisabled = !(
      cmds.find(c => c.name == command.name) ||
      // Default to true if it's not in the list for some reason
      { enabled: true }
    ).enabled;
    const moduleName = folder || command.type || "Other"
    const moduleDisabled = !!modules.find(m => !m.enabled && m.name.toLowerCase() == moduleName.toLowerCase());

    this.commands.push({
      command: command.name,
      run: command.run,
      description: command.description,
      usage: command.usage,
      aliases: command.aliases,
      type: moduleName,
      enabled: !(cmdDisabled || moduleDisabled)
    })
  },
  init: async () => {
    fs.readdir('./commands', async function (err, files) {
      if (err) {
        if (err.message.startsWith("ENOENT: no such file or directory, scandir")) return console.log('\x1b[91m%s\x1b[0m', 'The commands folder could not be found. 0 commands have been loaded.\nIf your bot key is valid, corebot will install the commands shortly...')
        else throw err;
      }
      const modules = await Utils.variables.db.get.getModules();
      module.exports.modules = modules;
      const cmds = await Utils.variables.db.get.getCommands();
      module.exports.cmds = cmds || [];

      // For each category
      files.filter(f => !f.includes(".")).forEach(category => {
        // Get the commands for the category
        fs.readdir('./commands/' + category, (err, files) => {
          if (err) {
            if (err.message.startsWith("ENOENT: no such file or directory, scandir"));
            else throw err;
          }
          files
            .filter(f => f.endsWith('.js'))
            .forEach(command => {
              module.exports.set(require('../../commands/' + category + '/' + command), category);
            })
        })
      })

      setTimeout(() => {
        console.log(module.exports.commands.length + ' commands have been loaded.');
      }, 1500)
      return module.exports;
    })
  }
}
// 159331   8501   648409    46410   1590653881   15b8468e6abc07ecf8208e70b709702258380118   648409
