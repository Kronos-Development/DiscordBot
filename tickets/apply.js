const Discord = require('discord.js');
const Utils = require('../../modules/utils.js');
const lang = Utils.variables.lang;
const Embed = Utils.Embed;
module.exports = {
    name: 'apply',
    run: async (bot, message, args) => {
        if (!Utils.hasPermission(message.member, Utils.variables.config.Permissions.User_Commands.Apply)) return message.channel.send(Embed({ preset: 'nopermission' }));
        const settings = Utils.variables.config.Applications;
        const reviewerRole = Utils.findRole(settings.Reviewer_Role, message.guild);
        const parent = Utils.findChannel(settings.Category, message.guild, 'category');
        if (!reviewerRole || !parent) return message.channel.send(Embed({ preset: 'console' }));

        message.guild.channels.create(settings.Channel_Format.replace(/%username%/g, message.author.username).replace(/%id%/g, message.author.id).replace(/%tag%/g, message.author.tag), {
            type: 'text',
            parent: parent,
            permissionOverwrites: [
                {
                    id: message.author.id,
                    allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY']
                },
                {
                    id: reviewerRole.id,
                    allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY']
                },
                {
                    id: message.guild.id,
                    deny: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY']
                }
            ]
        }).then(async channel => {

            message.channel.send(Embed({ title: lang.TicketModule.Commands.Apply.Embeds.Created.Title, description: lang.TicketModule.Commands.Apply.Embeds.Created.Description.replace(/{channel}/g, channel) }));

            channel.send(Embed({ title: settings.New_Embed.Title, description: settings.New_Embed.Description.replace(/%ping%/g, '<@' + message.author.id + '>') }));

            if (settings.Mention_Reviewer_Role) channel.send('<@&' + reviewerRole.id + '>');

            const Positions = settings.Positions;
            const Position_Keys = Object.keys(Positions);

            channel.send(Embed({ title: settings.Position_Embed.Title, description: settings.Position_Embed.Description.replace(/%positions%/g, Position_Keys.join(', ')) }));

            async function done(positionChosen) {
                if (!positionChosen) return channel.send(Embed());
                const position = Positions[positionChosen];
                channel.setTopic(`User: ${message.author.tag}\nUser ID: ${message.author.id}\nApplying for: ${positionChosen}\nStatus: Pending`);

                const answers = [];

                for (let i = 0; i < position.Questions.length; i++) {
                    const question = position.Questions[i];
                    const text = typeof question == 'object' ? question.Question : question;
                    let m = await channel.send(Embed({ description: (typeof question == 'object' && question.Options) ? text + question.Options.map((o, i) => ((i == 0) ? "\n" : "") + "\n" + Utils.getEmoji(i + 1) + " **" + o + "**").join("") : text }));
                    async function waitForResponse() {
                        if (typeof question == 'object' && question.Options) {
                            let OptionsToEmojis = {}
                            question.Options.forEach(async (option, i) => {
                                OptionsToEmojis[`${option}`] = Utils.getEmoji(i + 1);
                                await m.react(Utils.getEmoji(i + 1));
                            })


                            await Utils.waitForReaction(Object.values(OptionsToEmojis), message.author.id, m)
                                .then(async reaction => {
                                    answers.push(Object.keys(OptionsToEmojis)[Object.values(OptionsToEmojis).indexOf(reaction.emoji.name)])
                                })
                        } else {
                            await Utils.waitForResponse(message.author.id, channel)
                                .then(async response => {
                                    if (typeof question == 'object' && question.RegExp) {
                                        if (!new RegExp(question.RegExp).test(response.content)) {
                                            channel.send(Embed({ title: question.Failed_RegExp || lang.TicketModule.Commands.Apply.Errors.FailedRegExp, color: Utils.variables.config.Error_Color }));
                                            await waitForResponse();
                                        } else answers.push(response.content);
                                    } else answers.push(response.content);
                                });
                        }

                    }
                    await waitForResponse();
                }

                if (settings.Delete_Embeds_And_Send_Answers) channel.bulkDelete(100);

                channel.send(Embed({ title: settings.Application_Complete.Title, description: settings.Application_Complete.Description, color: Utils.variables.config.Success_Color }))

                if (settings.Delete_Embeds_And_Send_Answers) {
                    let embed = Utils.Embed({ title: lang.TicketModule.Commands.Apply.Embeds.Answers.Title, fields: [{ name: lang.TicketModule.Commands.Apply.Embeds.Answers.Field, value: `${message.member} (${message.author.id})` }] });
                    answers.forEach((answer, i) => {
                        if (answer.length >= 1024) {
                            embed.embed.fields.push({ name: position.Questions.map(q => q.Question || q)[i], value: answer.substring(0, 1000) + '-' });
                            embed.embed.fields.push({ name: '\u200B', value: '-' + answer.substring(1000) });
                        } else embed.embed.fields.push({ name: position.Questions.map(q => q.Question || q)[i], value: answer });
                    })

                    const Haste = await Utils.paste(`Applicant: ${message.author.tag} (${message.author.id})\nFinished At: ${new Date().toLocaleString()}\n\nAnswers:\n\n${answers.map((ans, i) => `Question:\n${position.Questions.map(q => q.Question || q)[i]}\n\nAnswer:\n${ans}`).join('\n\n')}`, Utils.variables.config.Applications.Logs.Paste_Site);
                    channel.send(embed).catch(err => {
                        channel.send(Embed({
                            title: lang.TicketModule.Commands.Apply.Embeds.Answers.Title,
                            fields: [{ name: lang.TicketModule.Commands.Apply.Embeds.Answers.Field, value: `${message.member} (${message.author.id})` }, { name: "Answers", value: "The application was too long, so it has been uploaded here:\n" + Haste }]
                        }))
                    })

                    if (Utils.variables.config.Applications.Logs.Enabled) {
                        const channel = Utils.findChannel(Utils.variables.config.Applications.Logs.Channel, message.guild);
                        if (channel) channel.send(Embed({ title: lang.TicketModule.Commands.Apply.Embeds.ApplicationLog.Title, url: Haste, description: lang.TicketModule.Commands.Apply.Embeds.ApplicationLog.Description, fields: [{ name: lang.TicketModule.Commands.Apply.Embeds.ApplicationLog.Field, value: `${message.member} (${message.author.id})` }] }))
                    }
                }
            }
            async function getPosition() {
                Utils.waitForResponse(message.author.id, channel)
                    .then((response) => {
                        if (!Position_Keys.map(p => p.toLowerCase()).includes(response.content.toLowerCase())) {
                            channel.send(Embed({ color: Utils.variables.config.Error_Color, title: lang.TicketModule.Commands.Apply.Errors.InvalidPosition }));
                            return getPosition();
                        }
                        done(Position_Keys.find(p => p.toLowerCase() == response.content.toLowerCase()));
                    })
            }
            getPosition();
        })
    },
    description: lang.Help.CommandDescriptions.Apply,
    usage: 'apply',
    aliases: [
        'application'
    ]
}
// 159331   8501   645582    46027   1590459907   ad48cacf59f71a54e77c1bbc341ca7b4495d410c   645582
