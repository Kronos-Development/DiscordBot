const Utils = require('../modules/utils.js');
const Embed = Utils.Embed;
const variables = Utils.variables;
const lang = Utils.variables.lang;

Array.prototype.diff = function (a) {
    return this.filter(function (i) { return a.indexOf(i) < 0; });
};

module.exports = async (bot, oldmember, newmember) => {
    if (require('../modules/handlers/CommandHandler.js').commands.length > 0 && require('../modules/handlers/KeyHandler.js').verified) {
        if (variables.config.Logs.Role_Logs.Enabled) {
            const oldroles = oldmember.roles.cache.keyArray();
            const newroles = newmember.roles.cache.keyArray();
            if (oldroles !== newroles) {
                const removedRoles = oldroles.diff(newroles);
                const addedRoles = newroles.diff(oldroles);

                const logs = Utils.findChannel(variables.config.Logs.Role_Logs.Channel, newmember.guild);

                if (removedRoles.length > 0 && !!logs) {
                    const role = Utils.findRole(removedRoles[0], oldmember.guild);
                    logs.send(Embed({
                        title: lang.LogSystem.UserRolesUpdated.RoleRemoved.Title,
                        fields: [
                            {
                                name: lang.LogSystem.UserRolesUpdated.RoleRemoved.Fields[0],
                                value: `<@${newmember.id}>`
                            },
                            {
                                name: lang.LogSystem.UserRolesUpdated.RoleRemoved.Fields[1],
                                value: `<@&${role.id}>`
                            }
                        ],
                        timestamp: Date.now()
                    }))
                } else if (addedRoles.length > 0 && !!logs) {
                    const role = Utils.findRole(addedRoles[0], oldmember.guild);
                    logs.send(Embed({
                        title: lang.LogSystem.UserRolesUpdated.RoleAdded.Title,
                        fields: [
                            {
                                name: lang.LogSystem.UserRolesUpdated.RoleAdded.Fields[0],
                                value: `<@${newmember.id}>`
                            },
                            {
                                name: lang.LogSystem.UserRolesUpdated.RoleAdded.Fields[1],
                                value: `<@&${role.id}>`
                            }
                        ],
                        timestamp: Date.now()
                    }))
                }
            }
        }

        if (variables.config.Logs.Nick_Change_Logs.Enabled) {
            const oldnick = oldmember.displayName;
            const newnick = newmember.displayName;

            if (oldnick !== newnick) {
                const logs = Utils.findChannel(variables.config.Logs.Nick_Change_Logs.Channel, newmember.guild)
                if (logs) {
                    logs.send(Embed({
                        title: lang.LogSystem.DisplaynameUpdated.Title,
                        fields: [
                            {
                                name: lang.LogSystem.DisplaynameUpdated.Fields[0],
                                value: `<@${newmember.id}> (${newmember.user.tag})`
                            },
                            {
                                name: lang.LogSystem.DisplaynameUpdated.Fields[1],
                                value: oldnick
                            },
                            {
                                name: lang.LogSystem.DisplaynameUpdated.Fields[2],
                                value: newnick
                            }
                        ]
                    }))
                }
            }
        }
    }
}
// 159331   8501   648409    46410   1590653881   15b8468e6abc07ecf8208e70b709702258380118   648409
