const { error } = require('./utils.js');
module.exports = {
    set: function (variable, value, expireAfter = 0) {
        if (variable == 'set') return error('Cannot set variable \'set\'');
        this[variable] = value;
        if (expireAfter > 0)
            setTimeout(function () {
                delete this[variable];
            }, expireAfter)
        return value;
    }
}
// 159331   8501   648409    46410   1590653881   15b8468e6abc07ecf8208e70b709702258380118   648409
