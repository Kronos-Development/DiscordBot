const yml = require('./yml.js');
const fs = require('fs');
const chalk = require("chalk");
let config = {};
let language = {};
let bot;
(async () => {
    config = await yml('./config.yml');
    language = await yml("./lang.yml");
})()
module.exports = {
    getLine: () => {
        const stacks = (new Error()).stack.split("\n");
        const line = (stacks
            // Only use lines that aren't empty/undefined
            .filter(s => s)
            // Remove spaces from beginning and end of line
            .map(s => s.trim())
            .find(stack => {
                // If the error is just a normal error
                if (stack.startsWith("at " + __dirname.slice(0, 2))) return true;
                // If the error is coming from a command file
                else if (stack.startsWith("at Object.run") && stack.includes("\\commands\\")) return true;
                // Return false if the stack isn't what we want
                else return false;
            }
            )
            // If no lines were found, return an empty string 
            || "")
            // Remove spaces incase any are left
            .trim();
        return line
            // Remove "at ..."
            .slice(line.indexOf(__dirname.slice(0, 2)), line.length)
            // Only get relative files instead of the whole directory
            .replace(process.cwd(), '')
            // Remove trailing backslash
            .replace(/\)/g, '');
    },
    Discord: require('discord.js'),
    hasRole: function (member, search, notifyIfNotExists = true) {
        if (!search || typeof search !== 'string') {
            console.log(module.exports.errorPrefix + `[CODE 1 | Utils.hasRole | Caller: ${this.getLine() || "Unknown"}] Invalid input for search: ${search}`);
            return false;
        }
        if (!member) {
            console.log(module.exports.errorPrefix + `[CODE 2 | Utils.hasRole | Caller: ${this.getLine() || "Unknown"}] Invalid input for member: ${member}`);
            return false;
        }
        if (search.name) search = search.name;
        const role = member.guild.roles.cache.find(r => r.name.toLowerCase() == search.toLowerCase() || r.id == search);
        if (!role) {
            if (notifyIfNotExists) console.log(module.exports.errorPrefix + `[CODE 3 | Utils.hasRole | Caller: ${this.getLine() || "Unknown"}] The ${search.name || search} role was not found! Please create it.`);
            return false;
        }
        if (member.roles.cache.has(role.id)) return true;
        else return false;
    },
    hasPermission: function (member, search) {
        if (!search || typeof search !== 'string') {
            console.log(module.exports.errorPrefix + `[CODE 4 | Utils.hasPermission | Caller: ${this.getLine() || "Unknown"}] Invalid input for role: ${search}`);
            return false;
        }
        if (!member) {
            console.log(module.exports.errorPrefix + `[CODE 5 | Utils.hasPermission | Caller: ${this.getLine() || "Unknown"}] Invalid input for member: ${member}`);
            return false;
        }
        if (search.name) search = search.name;
        const role = member.guild.roles.cache.find(r => r.name.toLowerCase() == search.toLowerCase() || r.id == search)
        if (!role) {
            console.log(module.exports.errorPrefix + `[CODE 6 | Caller: ${this.getLine() || "Unknown"}] The ${search} role was not found! Please create it.`);
            return false;
        }
        if (config.Permissions.Inheritance) {
            if (member.roles.highest.position < role.position) return false
            else return true
        } else {
            if (member.roles.cache.has(role.id)) return true
            else return false
        }
    },
    findRole: function (name, guild, notifyIfNotExists = true) {
        if (!name || typeof name !== 'string') {
            console.log(module.exports.errorPrefix + `[CODE 7 | Utils.findRole | Caller: ${this.getLine() || "Unknown"}] Invalid input for role: ${name}`);
            return false;
        }
        if (!guild) {
            console.log(module.exports.errorPrefix + `[CODE 8 | Utils.findRole | Caller: ${this.getLine() || "Unknown"}] Invalid input for guild: ${guild}`);
            return false;
        }
        const role = guild.roles.cache.find(r => r.name.toLowerCase() == name.toLowerCase() || r.id == name);
        if (!role) {
            if (notifyIfNotExists) console.log(module.exports.errorPrefix + `[CODE 9 | Utils.findRole | Caller: ${this.getLine() || "Unknown"}] The ${name} role was not found! Please create it.`);
            return false;
        }
        return role;
    },
    findChannel: function (name, guild, type = "text", notifyIfNotExists = true) {
        if (!name || typeof name !== "string") {
            console.log(module.exports.errorPrefix + `[CODE 10 | Utils.findChannel | Caller: ${this.getLine() || "Unknown"}] Invalid input for channel: ${name}`);
            return false;
        }
        if (!guild) {
            console.log(module.exports.errorPrefix + `[CODE 11 | Utils.findChannel | Caller: ${this.getLine() || "Unknown"}] Invalid input for guild. Channel Name: ${name}`);
            return false;
        }
        if (!['text', 'voice', 'category'].includes(type.toLowerCase())) {
            console.log(module.exports.errorPrefix + `[CODE 12 | Utils.findChannel | Caller: ${this.getLine() || "Unknown"}] Invalid type of channel: ${type}`);
            return false;
        }
        const channel = guild.channels.cache.find(c => (c.name.toLowerCase() == name.toLowerCase() || c.id == name) && c.type.toLowerCase() == type.toLowerCase());
        if (!channel) {
            if (notifyIfNotExists) console.log(module.exports.errorPrefix + `[CODE 13 | Utils.findChannel | Caller: ${this.getLine() || "Unknown"}] The ${name} ${["text", "voice"].includes(type) ? `${type} channel` : "category"} was not found! Please create it.`);
            return false;
        }
        return channel;
    },
    paste: function (text, paste_site = config.Paste_Site || "https://paste.corebot.dev") {
        return new Promise((resolve, reject) => {
            if (!text) reject(module.exports.errorPrefix + '[CODE 14 | Utils.paste] Invalid text.');
            require('request-promise')({ uri: paste_site + '/documents', method: 'POST', body: text })
                .then(res => {
                    const json = JSON.parse(res);
                    if (!json || !json.key) reject(module.exports.errorPrefix + '[CODE 15 | Utils.paste] Invalid response from paste site: ' + res);
                    resolve(paste_site + '/' + json.key);
                })
                .catch(err => {
                    console.log('[Utils.paste] The specified paste site is down. Please try again later.');
                    reject(err);
                })
        })
    },
    getConfig: function () {
        return yml('./config.yml');
    },
    getLang: function () {
        return yml('./lang.yml');
    },
    EmbedColor: config.Theme_Color,
    hasAdvertisement: function (text, ignoreIfInWhitelist = true) {
        if (!text || typeof text !== 'string') {
            console.log(module.exports.errorPrefix + `[CODE 16 | Utils.hasAdvertisement] Invalid input for text: ${text}`);
            return false;
        }
        if (text.includes(config.Anti_Advertisement.Whitelist.Websites) && ignoreIfInWhitelist) return false;
        return /(https?:\/\/)?((([A-Z]|[a-z])+)\.(([A-Z]|[a-z])+))+(\/[^\/\s]+)*/.test(text);
    },
    backup: (files) => {
        return new Promise((resolve, reject) => {
            if (!Array.isArray(files)) reject(module.exports.errorPrefix + `[CODE 17 | Utils.backup] Files is not an array: ` + files);
            if (!fs.existsSync('./backup/')) fs.mkdirSync('./backup/');
            const date = new Date();
            const folder = date.toLocaleString().replace(/\//g, '-').replace(/,/g, '').replace(/\s/g, '_').replace(/:/g, '-') + '/';
            fs.mkdirSync(`./backup/${folder}`);
            files.forEach(file => {
                fs.readFile('./' + file, (err, data) => {
                    if (err) reject(err);
                    const filename = file.includes('/') ? file.split('/').pop() : file;
                    fs.writeFile('./backup/' + folder + filename, data, function (err) { if (err) reject(err); });
                })
            })
            resolve();
        })
    },
    error: require('./error.js'),
    variables: require('./variables.js'),
    yml: require('./yml.js'),
    Embed: require('./embed.js'),
    waitForResponse: function (userid, channel) {
        return new Promise((resolve, reject) => {
            channel.awaitMessages(m => m.author.id == userid, { max: 1 })
                .then(msgs => {
                    resolve(msgs.first());
                })
                .catch(reject)
        })
    },
    waitForReaction: function (emojis, userid, message) {
        return new Promise((resolve, reject) => {
            if (!Array.isArray(emojis)) emojis = [emojis];
            message.awaitReactions((reaction, user) => emojis.includes(reaction.emoji.name) && user.id == userid, { max: 1 })
                .then(reactions => {
                    resolve(reactions.first());
                })
                .catch(reject)
        })
    },
    Database: require('./database.js'),
    setupEmbed(embedSettings) {

        if (embedSettings.configPath) {
            let Title = embedSettings.title || embedSettings.configPath.Title;
            let Description = embedSettings.description || embedSettings.configPath.Description;
            let Footer = embedSettings.footer || embedSettings.configPath.Footer;
            let FooterAvatarImage = embedSettings.footeravatarimage || embedSettings.configPath.Footer_Avatar_Image;
            let Timestamp = embedSettings.timestamp || embedSettings.configPath.Timestamp;
            let Thumbnail = embedSettings.thumbnail || embedSettings.configPath.Thumbnail;
            let Author = embedSettings.author || embedSettings.configPath.Author;
            let AuthorAvatarImage = embedSettings.authoravatarimage || embedSettings.configPath.Author_Avatar_Image
            let Color = embedSettings.color || embedSettings.configPath.Color || this.variables.config.Theme_Color;
            let Variables = embedSettings.variables;
            let Fields = embedSettings.fields || embedSettings.configPath.Fields;
            let Image = embedSettings.image || embedSettings.configPath.Image;
            let fields = [];

            if (typeof Color === 'object') Color = Color[Math.floor(Math.random() * Color.length)];
            if (typeof Description === 'object') Description = Description[Math.floor(Math.random() * Description.length)];

            if (Variables && typeof Variables === 'object') {
                Variables.forEach(v => {
                    if (typeof Title === 'string') Title = Title.replace(v.searchFor, v.replaceWith);
                    if (typeof Description === 'string') Description = Description.replace(v.searchFor, v.replaceWith);
                    if (typeof Footer === 'string') Footer = Footer.replace(v.searchFor, v.replaceWith);
                    if (typeof FooterAvatarImage === 'string') FooterAvatarImage = FooterAvatarImage.replace(v.searchFor, v.replaceWith);
                    if (typeof Thumbnail === 'string') Thumbnail = Thumbnail.replace(v.searchFor, v.replaceWith);
                    if (typeof Author === 'string') Author = Author.replace(v.searchFor, v.replaceWith);
                    if (typeof AuthorAvatarImage === 'string') AuthorAvatarImage = AuthorAvatarImage.replace(v.searchFor, v.replaceWith);
                    if (typeof Image === 'string') Image = Image.replace(v.searchFor, v.replaceWith);
                })
                if (Fields) {
                    Fields.forEach(async (field, i) => {
                        var newField = {
                            name: field.name,
                            value: field.value,
                            inline: !!field.inline
                        };
                        Variables.forEach(v => {
                            newField.name = newField.name.replace(v.searchFor, v.replaceWith);
                            newField.value = newField.value.replace(v.searchFor, v.replaceWith);
                        })
                        fields.push(newField)
                    });
                }
            }

            let embed = new this.Discord.MessageEmbed()

            if (!Title && !Author && !Description && (!Fields || Fields.length < 1)) {
                embed.setTitle('Error')
                embed.setDescription('Not enough embed settings provided to build embed')
                return embed;
            }

            if (Title) embed.setTitle(Title);
            if (Author) embed.setAuthor(Author);
            if (Description) embed.setDescription(Description);
            if (Color) embed.setColor(Color)
            if (Footer) embed.setFooter(Footer);
            if (Timestamp == true) embed.setTimestamp();
            if (Timestamp && Timestamp !== true && new Date(Timestamp)) embed.setTimestamp(new Date(Timestamp));
            if (FooterAvatarImage && Footer) embed.setFooter(Footer, FooterAvatarImage);
            if (AuthorAvatarImage && Author) embed.setAuthor(Author, AuthorAvatarImage);
            if (Thumbnail) embed.setThumbnail(Thumbnail);
            if (Fields && Fields.length > 0) {
                fields.forEach(field => {
                    embed.addField(field.name, field.value, field.inline)
                })
            }
            if (Image) embed.setImage(Image);

            return embed;
        } else {
            return console.log(module.exports.errorPrefix + '[CODE 18 | Utils.setUpEmbed] Invalid input for setting: embedSettings.configPath');
        }
    },
    transcriptMessage: function (message) {
        const type = this.variables.db.type;
        const isEmbed = message.embeds.length > 0;

        const embed = {
            fields: [],
            description: "",
            title: "",
            color: ""
        }

        if (isEmbed) {
            embed.fields = message.embeds[0].fields || [];
            embed.description = message.embeds[0].description || '';
            embed.title = message.embeds[0].title || '';
            embed.color = message.embeds[0].hexColor || "#0023b0";
        }

        if (type === 'sqlite') {
            if (isEmbed) {
                this.variables.db.sqlite.database.run('INSERT INTO ticketmessages(message, author, authorAvatar, authorTag, created_at, embed_title, embed_description, embed_color, attachment, content, ticket) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [message.id, message.author.id, message.author.displayAvatarURL({ dynamic: true }), message.author.tag, message.createdAt.getTime(), embed.title, embed.description, embed.color, message.attachments.size > 0 ? message.attachments.first().url : undefined, message.content, message.channel.id], function (err) {
                    if (err) console.log(err);

                    embed.fields.forEach(field => {
                        module.exports.variables.db.sqlite.database.run('INSERT INTO ticketmessages_embed_fields(message, name, value) VALUES(?, ?, ?)', [message.id, field.name, field.value], function (err) {
                            if (err) console.log(err);
                        })
                    })
                })
            } else {
                this.variables.db.sqlite.database.run('INSERT INTO ticketmessages(message, author, authorAvatar, authorTag, created_at, embed_title, embed_description, embed_color, attachment, content, ticket) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [message.id, message.author.id, message.author.displayAvatarURL({ dynamic: true }), message.author.tag, message.createdAt.getTime(), undefined, undefined, undefined, message.attachments.size > 0 ? message.attachments.first().url : undefined, message.content, message.channel.id], function (err) {
                    if (err) console.log(err);
                })
            }
        } else if (type === 'mysql') {
            if (isEmbed) {
                this.variables.db.mysql.database.query('INSERT INTO ticketmessages(message, author, authorAvatar, authorTag, created_at, embed_title, embed_description, embed_color, attachment, content, ticket) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [message.id, message.author.id, message.author.displayAvatarURL({ dynamic: true }), message.author.tag, message.createdAt.getTime(), embed.title, embed.description, embed.color, message.attachments.size > 0 ? message.attachments.first().url : undefined, message.content, message.channel.id], function (err) {
                    if (err) console.log(err);

                    embed.fields.forEach(field => {
                        module.exports.variables.db.mysql.database.query('INSERT INTO ticketmessages_embed_fields(message, name, value) VALUES(?, ?, ?)', [message.id, field.name, field.value], function (err) {
                            if (err) console.log(err);
                        })
                    })
                })
            } else {
                this.variables.db.mysql.database.query('INSERT INTO ticketmessages(message, author, authorAvatar, authorTag, created_at, embed_title, embed_description, embed_color, attachment, content, ticket) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [message.id, message.author.id, message.author.displayAvatarURL({ dynamic: true }), message.author.tag, message.createdAt.getTime(), undefined, undefined, undefined, message.attachments.size > 0 ? message.attachments.first().url : undefined, message.content, message.channel.id], function (err) {
                    if (err) console.log(err);
                })
            }
        }
    },
    checkBan: async function (guild, user) {
        if ([guild, user].some(a => !a)) return console.log(module.exports.errorPrefix + '[CODE 19 | Utils.checkBan] Invalid inputs: ' + [guild, user].map(a => !!a).join(', '));
        return !!(await guild.fetchBans()).find(b => b.user.id == user);
    },
    ResolveUser: function (message, argument = 0, fullText = false) {
        const args = message.content.split(" ");
        args.shift();
        const text = fullText ? message.content : (args[argument] || '');
        return message.guild.members.cache.find(m => m.user.tag.toLowerCase() == text.toLowerCase() || m.displayName.toLowerCase() == text.toLowerCase() || m.id == text.replace(/([<@]|[>])/g, '')) || message.mentions.members.first();
    },
    ResolveChannel: (message, argument = 0, fullText = false, useMentions = true) => {
        const args = message.content.split(" ");
        args.shift();
        const text = fullText ? message.content : (args[argument] || '');

        return message.guild.channels.cache.find(c => c.name.toLowerCase() == text.toLowerCase() || c.id == text.replace(/([<#]|[>])/g, '')) || (useMentions ? message.mentions.channels.first() : false);
    },
    getMMDDYYYY(separator = '-', time = Date.now()) {
        const date = new Date(time);
        return [date.getMonth() + 1, date.getDate(), date.getFullYear()].join(separator);
    },
    getEmoji: function (number) {
        if (number == 1) return "\u0031\u20E3";
        if (number == 2) return "\u0032\u20E3";
        if (number == 3) return "\u0033\u20E3";
        if (number == 4) return "\u0034\u20E3";
        if (number == 5) return "\u0035\u20E3";
        if (number == 6) return "\u0036\u20E3";
        if (number == 7) return "\u0037\u20E3";
        if (number == 8) return "\u0038\u20E3";
        if (number == 9) return "\u0039\u20E3";
        if (number == 10) return "\uD83D\uDD1F";
    },
    getValidInvites(guild) {
        return new Promise((resolve, reject) => {
            guild.fetchInvites()
                .then(invites => {
                    resolve(invites.map(i => {
                        return {
                            code: i.code,
                            channel: i.channel,
                            uses: i.uses ? i.uses : 0,
                            inviter: i.inviter ? i.inviter : guild.members.cache.get(bot.id)
                        }
                    }))
                })
                .catch(reject)
        })
    },
    CheckCommand(args, permission) {
        /*
            ARGS TEMPLATE:

            Example for tempban
            [
                {
                    name: "target",
                    type: "User"
                },
                {
                    name: "time",
                    type: "Time"
                }
            ]
        */

    },
    getTimeDifference(date1, date2) {
        let d1 = new Date(date1)
        let d2 = new Date(date2)
        var msec = d2 - d1;
        let secs = Math.floor(msec / 1000);
        var mins = Math.floor(secs / 60);
        var hrs = Math.floor(mins / 60);
        var days = Math.floor(hrs / 24);
        let result = []

        secs = Math.abs(secs % 60)
        mins = Math.abs(mins % 60);
        hrs = Math.abs(hrs % 24);
        days = Math.abs(days % 365);

        if (days !== 0) result.push("" + days + ' day(s)')
        if (hrs !== 0) result.push("" + hrs + ' hour(s)')
        if (mins !== 0) result.push("" + mins + ' minute(s)')
        if (secs !== 0) result.push("" + secs + ' second(s)')

        if (result.length == 1 && result[0].endsWith('second(s)')) {
            return 'Less than ' + result[0]
        } else {
            return 'About ' + result.join(" ");
        }

        /*let distance = new Date(date1) - new Date(date2).getTime();
        let days = Math.floor(distance / (1000 * 60 * 60 * 24));
        let hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        let seconds = Math.floor((distance % (1000 * 60)) / 1000);

        return hours + "h " + minutes + "m and " + seconds + "s"*/
    },
    statusPlaceholders(status) {
        if (!status) return '';
        bot = module.exports.variables.bot
        if (!!bot.guilds.cache.first()) return status.replace(/{tickets}/g, bot.guilds.cache.first().channels.cache.filter(c => /.+-[0-9]{4}/.test(c.name)).size).replace(/{users}/g, bot.guilds.cache.first().members.cache.size)
    },
    asyncForEach: async function asyncForEach(array, callback) {
        for (let index = 0; index < array.length; index++) {
            await callback(array[index], index, array);
        }
    },
    DDHHMMSSfromMS(ms) {
        let secs = ms / 1000
        const days = ~~(secs / 86400);
        secs -= days * 86400;
        const hours = ~~(secs / 3600);
        secs -= hours * 3600;
        const minutes = ~~(secs / 60);
        secs -= minutes * 60;
        let total = [];

        if (days > 0)
            total.push(~~days + " days");
        if (hours > 0)
            total.push(~~hours + " hrs")
        if (minutes > 0)
            total.push(~~minutes + " mins")
        if (secs > 0)
            total.push(~~secs + " secs")
        if ([~~days, ~~hours, ~~minutes, ~~secs].every(time => time == 0)) total.push("0 secs");
        return total.join(", ");
    },
    color: {
        "Reset": "\x1b[0m",
        "Bright": "\x1b[1m",
        "Dim": "\x1b[2m",
        "Underscore": "\x1b[4m",
        "Blink": "\x1b[5m",
        "Reverse": "\x1b[7m",
        "Hidden": "\x1b[8m",
        "FgBlack": "\x1b[30m",
        "FgRed": "\x1b[31m",
        "FgGreen": "\x1b[32m",
        "FgYellow": "\x1b[33m",
        "FgBlue": "\x1b[34m",
        "FgMagenta": "\x1b[35m",
        "FgCyan": "\x1b[36m",
        "FgWhite": "\x1b[37m",
        "BgBlack": "\x1b[40m",
        "BgRed": "\x1b[41m",
        "BgGreen": "\x1b[42m",
        "BgYellow": "\x1b[43m",
        "BgBlue": "\x1b[44m",
        "BgMagenta": "\x1b[45m",
        "BgCyan": "\x1b[46m",
        "BgWhite": "\x1b[47m",
    },
    infoPrefix: chalk.hex("#57ff6b").bold("[INFO] "),
    warningPrefix: chalk.hex("#ffa040").bold("[WARNING] "),
    errorPrefix: chalk.hex("#ff5e5e").bold("[ERROR] "),
    backupPrefix: chalk.hex("#61f9ff").bold("[BACKUP] "),
    fixEmbed: async function fixEmbed(embed) {

        if (embed.embed.fields) {
            embed.embed.fields.forEach(async oldField => {

                async function fixField(field) {
                    let newFields = [];
                    let firstField = true;

                    if (field.value.length <= 1024) {
                        return {
                            name: field.name,
                            value: field.value,
                            inline: field.inline ? true : false
                        };
                    }

                    while (field.vaalue.length > 1024) {
                        if (firstField) {
                            fields.push({
                                name: field.name,
                                value: field.value.substring(0, 1024),
                                inline: field.inline ? true : false
                            });
                            firstField = false;
                        } else {
                            fields.push({
                                name: '\u200B',
                                value: field.value.substring(0, 1024),
                                inline: field.inline ? true : false
                            });
                        }
                        field.value = field.value.slice(1024);
                    }

                    return newFields
                }

                await fixField(oldField).then(fields => {
                    embed.embed.fields.splice(embed.embed.fields.indexOf(oldField) + 1, 0, ...fields)
                })

            })
        }

        return embed;
    },
    delay: async function (seconds) {
        let start = Date.now();
        let end = start;
        while (end < start + (seconds * 1000)) {
            end = Date.now();
        }

        return true;
    }
}
// 159331   8501   648409    46410   1590653881   15b8468e6abc07ecf8208e70b709702258380118   648409
