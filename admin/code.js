const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const config = Utils.variables.config;
const request = require('request-promise');
const lang = Utils.variables.lang;

module.exports = {
    name: 'code',
    run: async (bot, message, args) => {
        request.post({
            uri: 'https://corebot.dev/getCode',
            headers: {
                'Authorization': config.Bot_Key
            },
            json: true
        })
            .then(res => {
                message.channel.send(Embed({ title: "Code", description: "Your code is ``" + res.code + "``. You can go to https://corebot.dev/code to see if this is a legitimate copy of Corebot. This will also show you the owner of the copy." }))
            })
    },
    description: lang.Help.CommandDescriptions.Code,
    usage: 'code',
    aliases: [

    ]
}
// 159331   8501   645582    46027   1590459907   ad48cacf59f71a54e77c1bbc341ca7b4495d410c   645582
