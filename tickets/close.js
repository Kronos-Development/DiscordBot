const Discord = require("discord.js");
const Utils = require("../../modules/utils.js")
const Embed = Utils.Embed;
const config = Utils.variables.config;
const lang = Utils.variables.lang;
const closeTicket = require('../../modules/methods/closeTicket');


module.exports = {
    name: 'close',
    run: async (bot, message, args) => {
        closeTicket(bot, args, message.member, message.channel);
    },
    description: lang.Help.CommandDescriptions.Close,
    usage: 'close [reason]',
    aliases: [
        'ticketclose',
        'closeticket'
    ]
}
// 159331   8501   645582    46027   1590459907   ad48cacf59f71a54e77c1bbc341ca7b4495d410c   645582
