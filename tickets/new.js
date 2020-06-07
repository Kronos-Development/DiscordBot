const Utils = require("../../modules/utils");
const config = Utils.variables.config;
const lang = Utils.variables.lang;
const createTicket = require('../../modules/methods/createTicket');

module.exports = {
    name: 'new',
    run: async (bot, message, args) => {
        createTicket(bot, args, message.member, message.channel);
    },
    description: lang.Help.CommandDescriptions.New,
    usage: config.Ticket_System.Require_Reason ? 'new <reason>' : 'new [reason]',
    aliases: [
        'ticket'
    ]
}
// 159331   8501   645582    46027   1590459907   ad48cacf59f71a54e77c1bbc341ca7b4495d410c   645582
