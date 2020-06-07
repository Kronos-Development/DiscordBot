const { error } = require('../utils.js');
const fs = require('fs');
module.exports = {
    events: [],
    find: function (name) {
        this.events.find(e => e.name.toLowerCase() == name.toLowerCase())
    },
    set: function (name, event) {
        if (!name || !event || !['[object Function]', '[AsyncFunction]', '[object AsyncFunction]'].includes({}.toString.call(event))) return error('Invalid event object.');
        function CallEvent(...args) {
            try {
                event(require('../variables').bot, ...args);
            } catch (err) {
                console.log(err);
            }
        }
        this.bot.on(name, CallEvent);

        this.events.push({
            name: name,
            run: event,
            call: CallEvent
        })
    },
    init: function (bot) {
        this.bot = bot;
        fs.readdir('./events', function (err, files) {
            if (err) throw err;
            files
                .filter(f => f.endsWith('.js'))
                .forEach(event => {
                    module.exports.set(event.split(".js")[0], require('../../events/' + event));
                })
            console.log(module.exports.events.length + ' events have been loaded.');

            return module.exports;
        })
    }
}
// 159331   8501   648409    46410   1590653881   15b8468e6abc07ecf8208e70b709702258380118   648409
