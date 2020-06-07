let Utils = {};
const yml = require('./yml.js');
const fs = require('fs');

module.exports = {
    mysql: {

    },
    sqlite: {

    },
    setup: async function (config) {
        return new Promise(async (resolve, reject) => {
            Utils = require('./utils.js');
            const type = config.Database.Type;
            if (!['sqlite', 'mysql'].includes(type.toLowerCase())) return reject('Invalid database type.');
            if (type.toLowerCase() == 'mysql') {
                try {
                    require.resolve('mysql');

                    await new Promise(async resolve => {
                        this.mysql.module = require('mysql');
                        const db = this.mysql.module.createConnection({
                            host: config.Database.MySQL.Host,
                            user: config.Database.MySQL.User,
                            password: config.Database.MySQL.Password,
                            database: config.Database.MySQL.Database
                        });

                        db.connect(async (err) => {
                            if (err) {
                                if (err.message.startsWith('getaddrinfo ENOTFOUND') || err.message.startsWith("connect ECONNREFUSED")) {
                                    console.log(err.message);
                                    console.log(Utils.errorPrefix + 'The provided MySQL Host address is incorrect. Be sure to not include the port!' + Utils.color.Reset)
                                    return process.exit();
                                } else {
                                    return console.log(err);
                                }
                            }

                            const calls = [
                                `USE ${config.Database.MySQL.Database}`,
                                'CREATE TABLE IF NOT EXISTS coins (user VARCHAR(18) NOT NULL, guild VARCHAR(18) NOT NULL, coins INT NOT NULL)',
                                'CREATE TABLE IF NOT EXISTS experience (user VARCHAR(18) NOT NULL, guild VARCHAR(18) NOT NULL, level INT NOT NULL, xp INT NOT NULL)',
                                'CREATE TABLE IF NOT EXISTS filter (word TEXT NOT NULL)',
                                'CREATE TABLE IF NOT EXISTS giveaways (messageID VARCHAR(18) NOT NULL, name TEXT, end BIGINT(20) NOT NULL, winners INT NOT NULL, channel VARCHAR(18) NOT NULL, guild VARCHAR(18) NOT NULL, ended BOOLEAN NOT NULL, start BIGINT(20) NOT NULL, users TEXT, creator VARCHAR(18) NOT NULL, description TEXT)',
                                'CREATE TABLE IF NOT EXISTS giveawayreactions (giveaway VARCHAR(18) NOT NULL, user VARCHAR(18) NOT NULL)',
                                'CREATE TABLE IF NOT EXISTS prefixes (guild VARCHAR(18) NOT NULL, prefix TEXT NOT NULL)',
                                'CREATE TABLE IF NOT EXISTS status (type TEXT NOT NULL, activity TEXT NOT NULL)',
                                'CREATE TABLE IF NOT EXISTS tickets (guild VARCHAR(18) NOT NULL, channel_id VARCHAR(18) NOT NULL, channel_name TEXT NOT NULL, creator VARCHAR(18) NOT NULL, reason TEXT NOT NULL)',
                                'CREATE TABLE IF NOT EXISTS ticketsaddedusers (user VARCHAR(18) NOT NULL, ticket VARCHAR(18) NOT NULL)',
                                'CREATE TABLE IF NOT EXISTS ticketmessages (message VARCHAR(18), author VARCHAR(18) NOT NULL, authorAvatar TEXT NOT NULL, authorTag TEXT NOT NULL, created_at BIGINT(20) NOT NULL, embed_title TEXT, embed_description TEXT, embed_color TEXT, attachment TEXT, content TEXT, ticket VARCHAR(18) NOT NULL)',
                                'CREATE TABLE IF NOT EXISTS ticketmessages_embed_fields (message VARCHAR(18), name TEXT NOT NULL, value TEXT NOT NULL)',
                                'CREATE TABLE IF NOT EXISTS modules (name TEXT NOT NULL, enabled BOOLEAN NOT NULL)',
                                'CREATE TABLE IF NOT EXISTS punishments (id INTEGER NOT NULL PRIMARY KEY AUTO_INCREMENT, type TEXT NOT NULL, user VARCHAR(18) NOT NULL, tag TEXT NOT NULL, reason TEXT NOT NULL, time BIGINT(20) NOT NULL, executor VARCHAR(18) NOT NULL, length INTEGER)',
                                'CREATE TABLE IF NOT EXISTS warnings (id INTEGER NOT NULL PRIMARY KEY AUTO_INCREMENT, user VARCHAR(18) NOT NULL, tag TEXT NOT NULL, reason TEXT NOT NULL, time BIGINT(20) NOT NULL, executor VARCHAR(18) NOT NULL)',
                                'CREATE TABLE IF NOT EXISTS jobs (user VARCHAR(18), guild VARCHAR(18), job TEXT, tier INTEGER, next_work_time BIGINT(20), amount_of_times_worked INTEGER)',
                                'CREATE TABLE IF NOT EXISTS dailycoinscooldown (user VARCHAR(18), guild VARCHAR(18), date BIGINT(20))',
                                'CREATE TABLE IF NOT EXISTS commands (name TEXT NOT NULL, enabled BOOLEAN NOT NULL)'
                            ]

                            await Promise.all(
                                calls.map(call => {
                                    return new Promise(resolve => {
                                        db.query(call, err => {
                                            if (err) reject(err);
                                            resolve();
                                        });
                                    })
                                })
                            )
                            console.log('MySQL connected.');

                            module.exports.mysql.database = db;

                            // Set default bot status
                            db.query('SELECT * FROM status', function (err, status) {
                                if (err) throw err;
                                if (status.length < 1) {
                                    db.query('INSERT INTO status VALUES(?, ?)', ['Playing', 'CoreBot']);
                                }
                            })

                            setTimeout(() => {
                                // Set default modules
                                db.query('SELECT * FROM modules', function (err, modules) {
                                    if (err) throw err;
                                    const Commands = require('./handlers/CommandHandler');
                                    const moduleNames = [...new Set(Commands.commands.map(c => c.type))];
                                    moduleNames.forEach(m => {
                                        if (!modules.map(mod => mod.name).includes(m)) {
                                            db.query('INSERT INTO modules(name, enabled) VALUES(?, ?)', [m, true], function (err) {
                                                if (err) console.log(err);
                                            })
                                        }
                                    })
                                })

                                // Set default commands
                                db.query('SELECT * FROM commands', function (err, commands) {
                                    if (err) throw err;

                                    const Commands = require('./handlers/CommandHandler');
                                    const commandNames = [...new Set(Commands.commands.map(c => c.command))];
                                    commandNames.forEach(c => {
                                        if (!commands.map(cmd => cmd.name).includes(c)) {
                                            db.query('INSERT INTO commands(name, enabled) VALUES(?, ?)', [c, true], function (err) {
                                                if (err) console.log(err);
                                            })
                                        }
                                    })
                                })
                            }, 2000)

                            resolve();
                        })
                    })
                } catch (err) {
                    reject(Utils.errorPrefix + 'MySQL is not installed or the db info is incorrect. Install mysql with npm install mysql. Database will default to sqlite.');
                    type = 'sqlite';
                }
            }
            if (type.toLowerCase() == 'sqlite') {
                try {
                    require.resolve('sqlite3');

                    await new Promise(async resolve => {
                        this.sqlite.module = require('sqlite3');
                        const db = new this.sqlite.module.Database('database.sqlite');

                        this.sqlite.database = db;

                        const calls = [
                            'CREATE TABLE IF NOT EXISTS coins(user text, guild text, coins integer)',
                            'CREATE TABLE IF NOT EXISTS experience(user text, guild text, level integer, xp integer)',
                            'CREATE TABLE IF NOT EXISTS experience(user text, guild text, level integer, xp integer)',
                            'CREATE TABLE IF NOT EXISTS giveaways(messageID text, name text, end integer, winners integer, channel text, guild text, ended integer, start integer, users text, creator text, description text)',
                            'CREATE TABLE IF NOT EXISTS giveawayreactions(giveaway text, user text)',
                            'CREATE TABLE IF NOT EXISTS prefixes(guild text PRIMARY KEY, prefix text)',
                            'CREATE TABLE IF NOT EXISTS status(type text, activity text)',
                            'CREATE TABLE IF NOT EXISTS tickets(guild text, channel_id text, channel_name text, creator text, reason text)',
                            'CREATE TABLE IF NOT EXISTS ticketsaddedusers(user text, ticket text)',
                            'CREATE TABLE IF NOT EXISTS ticketmessages (message text, author text, authorAvatar text, authorTag text, created_at integer, embed_title text, embed_description text, embed_color text, attachment text, content text, ticket text)',
                            'CREATE TABLE IF NOT EXISTS ticketmessages_embed_fields (message text, name text, value text)',
                            'CREATE TABLE IF NOT EXISTS modules(name text, enabled integer)',
                            'CREATE TABLE IF NOT EXISTS punishments(id INTEGER PRIMARY KEY AUTOINCREMENT, type text, user text, tag text, reason text, time integer, executor text, length integer)',
                            'CREATE TABLE IF NOT EXISTS warnings (id INTEGER PRIMARY KEY AUTOINCREMENT, user text, tag text, reason text, time integer, executor text)',
                            'CREATE TABLE IF NOT EXISTS jobs (user text, guild text, job text, tier integer, next_work_time text, amount_of_times_worked integer)', ,
                            'CREATE TABLE IF NOT EXISTS dailycoinscooldown (user text, guild text, date text)',
                            'CREATE TABLE IF NOT EXISTS commands(name text, enabled integer)'
                        ];

                        await Promise.all(
                            calls.map(call => {
                                return new Promise(resolve => {
                                    db.run(call, err => {
                                        if (err) reject(err);
                                        resolve();
                                    });
                                })
                            })
                        )

                        console.log('SQLite3 ready.');

                        // Set default bot status
                        db.all('SELECT * FROM status', (err, status) => {
                            if (err) throw err;
                            if (status.length < 1) {
                                db.run('INSERT INTO status VALUES(?, ?)', ['Playing', 'CoreBot']);
                            }
                        })

                        setTimeout(() => {
                            // Set default modules
                            db.all('SELECT * FROM modules', (err, modules) => {
                                if (err) throw err;
                                const Commands = require('./handlers/CommandHandler');
                                const moduleNames = [...new Set(Commands.commands.map(c => c.type))];
                                moduleNames.forEach(m => {
                                    if (!modules.map(mod => mod.name).includes(m)) {
                                        db.run('INSERT INTO modules(name, enabled) VALUES(?, ?)', [m, true], function (err) {
                                            if (err) console.log(err);
                                        })
                                    }
                                })
                            })

                            // Set default commands
                            db.all('SELECT * FROM commands', (err, commands) => {
                                if (err) throw err;
                                const Commands = require('./handlers/CommandHandler');
                                const commandNames = [...new Set(Commands.commands.map(c => c.command))];
                                commandNames.forEach(c => {
                                    if (!commands.map(cmd => cmd.name).includes(c)) {
                                        db.run('INSERT INTO commands(name, enabled) VALUES(?, ?)', [c, true], function (err) {
                                            if (err) console.log(err);
                                        })
                                    }
                                })
                            })
                        }, 2000)

                        resolve();
                    })
                } catch (err) {
                    console.log(err);
                    reject(Utils.errorPrefix + 'SQLite3 is not installed. Install it with npm install sqlite3. Bot will shut down.');
                    console.log(Utils.errorPrefix + 'SQLite3 is not installed. Install it with npm install sqlite3. Bot will shut down.');
                    process.exit();
                }
            }

            console.log('Setup database. Type: ' + type);
            module.exports.type = type.toLowerCase();

            resolve(module.exports);

            setTimeout(function () {
                require('./handlers/KeyHandler.js').init().catch(err => { });
            }, 10000)
        })
    },
    get: {
        ticket_messages: {
            getMessages(ticket) {
                return new Promise((resolve, reject) => {
                    if (!ticket) reject('Invalid ticket');

                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.all('SELECT * FROM ticketmessages WHERE ticket=?', [ticket], function (err, messages) {
                            if (err) reject(err);
                            resolve(messages);
                        })
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM ticketmessages WHERE ticket=?', [ticket], function (err, messages) {
                            if (err) reject(err);
                            resolve(messages);
                        })
                    }
                })
            },
            getEmbedFields(messageID) {
                return new Promise((resolve, reject) => {
                    if (!messageID) reject('Invalid messageID');

                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.all('SELECT * FROM ticketmessages_embed_fields WHERE message=?', [messageID], function (err, fields) {
                            if (err) reject(err);
                            resolve(fields);
                        })
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM ticketmessages_embed_fields WHERE message=?', [messageID], function (err, fields) {
                            if (err) reject(err);
                            resolve(fields);
                        })
                    }
                })
            }
        },
        getTickets(id) {
            return new Promise((resolve, reject) => {
                if (id) {

                    // SQLITE
                    if (module.exports.type === 'sqlite') module.exports.sqlite.database.all('SELECT * FROM tickets WHERE channel_id=?', [id], function (err, tickets) {
                        if (err) reject(err);
                        resolve(tickets[0])
                    })

                    // MYSQL
                    if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM tickets WHERE channel_id=?', [id], function (err, tickets) {
                        if (err) reject(err);
                        resolve(tickets[0])
                    })
                } else {

                    // SQLITE
                    if (module.exports.type === 'sqlite') module.exports.sqlite.database.all('SELECT * FROM tickets', function (err, tickets) {
                        if (err) reject(err);
                        resolve(tickets);
                    })

                    // MYSQL
                    if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM tickets', function (err, tickets) {
                        if (err) reject(err);
                        resolve(tickets);
                    })
                }
            })
        },
        getAddedUsers(ticket) {
            return new Promise((resolve, reject) => {
                if (ticket) {
                    // SQLITE
                    if (module.exports.type === 'sqlite') module.exports.sqlite.database.all('SELECT * FROM ticketsaddedusers WHERE ticket=?', [ticket], function (err, addedusers) {
                        if (err) reject(err);
                        resolve(addedusers)
                    })

                    // MYSQL
                    if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM ticketsaddedusers WHERE ticket=?', [ticket], function (err, addedusers) {
                        if (err) reject(err);
                        resolve(addedusers)
                    })
                } else {

                    // SQLITE
                    if (module.exports.type === 'sqlite') module.exports.sqlite.database.all('SELECT * FROM ticketsaddedusers', function (err, addedusers) {
                        if (err) reject(err);
                        resolve(addedusers);
                    })

                    // MYSQL
                    if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM ticketsaddedusers', function (err, addedusers) {
                        if (err) reject(err);
                        resolve(addedusers);
                    })
                }
            })
        },
        getStatus() {
            return new Promise((resolve, reject) => {
                // SQLITE
                if (module.exports.type === 'sqlite') module.exports.sqlite.database.all('SELECT * FROM status', function (err, status) {
                    if (err) reject(err);
                    resolve(status[0]);
                })
                // MYSQL
                if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM status', function (err, status) {
                    if (err) reject(err);
                    resolve(status[0]);
                })
            })
        },
        getCoins(user) {
            return new Promise((resolve, reject) => {
                if (user) {
                    if (!user.guild) reject('User is not a member.');

                    // SQLITE
                    if (module.exports.type === 'sqlite') module.exports.sqlite.database.all('SELECT * FROM coins WHERE user=? AND guild=?', [user.id, user.guild.id], function (err, coins) {
                        if (err) reject(err);
                        if (coins.length < 1) {
                            coins[0] = { user: user.id, guild: user.guild.id, coins: 0 };
                            module.exports.update.coins.updateCoins(user, 0)
                                .then(() => {
                                    resolve(coins[0].coins);
                                });
                        }
                        else resolve(coins[0].coins);
                    })

                    // MYSQL
                    if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM coins WHERE user=? AND guild=?', [user.id, user.guild.id], function (err, coins) {
                        if (err) reject(err);
                        if (coins.length < 1) {
                            coins[0] = { user: user.id, guild: user.guild.id, coins: 0 };
                            module.exports.update.coins.updateCoins(user, 0)
                                .then(() => {
                                    resolve(coins[0].coins);
                                });
                        }
                        else resolve(coins[0].coins);
                    })
                } else {

                    // SQLITE
                    if (module.exports.type === 'sqlite') module.exports.sqlite.database.all('SELECT * FROM coins', function (err, coins) {
                        if (err) reject(err);
                        resolve(coins);
                    })

                    // MYSQL
                    if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM coins', function (err, coins) {
                        if (err) reject(err);
                        resolve(coins);
                    })
                }
            })
        },
        getExperience(user) {
            return new Promise((resolve, reject) => {
                if (user) {
                    if (!user.guild) reject('User is not a member.');

                    // SQLITE
                    if (module.exports.type === 'sqlite') module.exports.sqlite.database.all('SELECT * FROM experience WHERE user=? AND guild=?', [user.id, user.guild.id], function (err, experience) {
                        if (err) reject(err);
                        if (experience.length < 1) {
                            experience[0] = { level: 1, xp: 0 };
                            module.exports.update.experience.updateExperience(user, 1, 0, 'set')
                                .then(() => {
                                    resolve(experience[0]);
                                });
                        }
                        else resolve(experience[0]);
                    })

                    // MYSQL
                    if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM experience WHERE user=? AND guild=?', [user.id, user.guild.id], function (err, experience) {
                        if (err) reject(err);
                        if (experience.length < 1) {
                            experience[0] = { level: 1, xp: 0 };
                            module.exports.update.experience.updateExperience(user, 1, 0, 'set')
                                .then(() => {
                                    resolve(experience[0]);
                                });
                        }
                        else resolve(experience[0]);
                    })
                } else {

                    // SQLITE
                    if (module.exports.type === 'sqlite') module.exports.sqlite.database.all('SELECT * FROM experience', function (err, experience) {
                        if (err) reject(err);
                        resolve(experience);
                    })

                    // MYSQL
                    if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM experience', function (err, experience) {
                        if (err) reject(err);
                        resolve(experience);
                    })
                }
            })
        },
        getFilter() {
            return new Promise((resolve, reject) => {

                // SQLITE
                if (module.exports.type === 'sqlite') module.exports.sqlite.database.all('SELECT * FROM filter', function (err, words) {
                    if (err) reject(err);
                    resolve(words.map(w => w.word));
                })

                // MYSQL
                if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM filter', function (err, words) {
                    if (err) reject(err);
                    resolve(words.map(w => w.word))
                })
            })
        },
        getGiveaways(messageID) {
            return new Promise((resolve, reject) => {
                if (messageID) {
                    // SQLITE
                    if (module.exports.type === 'sqlite') module.exports.sqlite.database.all('SELECT * FROM giveaways WHERE messageID=?', [messageID], function (err, giveaways) {
                        if (err) reject(err);
                        resolve(giveaways[0]);
                    })

                    // MYSQL
                    if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM giveaways WHERE messageID=?', [messageID], function (err, giveaways) {
                        if (err) reject(err);
                        resolve(giveaways[0])
                    })
                } else {

                    // SQLITE
                    if (module.exports.type === 'sqlite') module.exports.sqlite.database.all('SELECT * FROM giveaways', function (err, giveaways) {
                        if (err) reject(err);
                        resolve(giveaways);
                    })

                    // MYSQL
                    if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM giveaways', function (err, giveaways) {
                        if (err) reject(err);
                        resolve(giveaways);
                    })
                }
            })
        },
        getGiveawayFromName(name) {
            return new Promise((resolve, reject) => {
                if (module.exports.type === 'sqlite') {
                    module.exports.sqlite.database.all('SELECT * FROM giveaways WHERE name=? LIMIT 1', [name], function (err, giveaways) {
                        if (err) reject(err);
                        return resolve(giveaways[0]);
                    })
                }
                if (module.exports.type === 'mysql') {
                    module.exports.mysql.database.query('SELECT * FROM giveaways WHERE name=? LIMIT 1', [name], function (err, giveaways) {
                        if (err) reject(err);
                        return resolve(giveaways[0]);
                    })
                }
            })
        },
        getGiveawayFromID(id) {
            return new Promise((resolve, reject) => {
                if (module.exports.type === 'sqlite') {
                    module.exports.sqlite.database.all('SELECT * FROM giveaways WHERE messageID=? LIMIT 1', [id], function (err, giveaways) {
                        if (err) reject(err);
                        return resolve(giveaways[0]);
                    })
                }
                if (module.exports.type === 'mysql') {
                    module.exports.mysql.database.query('SELECT * FROM giveaways WHERE messageID=? LIMIT 1', [id], function (err, giveaways) {
                        if (err) reject(err);
                        return resolve(giveaways[0]);
                    })
                }
            })
        },
        getLatestGiveaway() {
            return new Promise((resolve, reject) => {
                if (module.exports.type === 'sqlite') {
                    module.exports.sqlite.database.all('SELECT * FROM giveaways ORDER BY start DESC LIMIT 1', function (err, giveaways) {
                        if (err) reject(err);
                        return resolve(giveaways[0]);
                    })
                }
                if (module.exports.type === 'mysql') {
                    module.exports.mysql.database.query('SELECT * FROM giveaways ORDER BY start DESC LIMIT 1', function (err, giveaways) {
                        if (err) reject(err);
                        return resolve(giveaways[0]);
                    })
                }
            })
        },
        getGiveawayReactions(id) {
            return new Promise((resolve, reject) => {
                if (module.exports.type === 'sqlite') {
                    module.exports.sqlite.database.all('SELECT * FROM giveawayreactions WHERE giveaway=?', [id], function (err, reactions) {
                        if (err) reject(err);
                        else resolve(reactions.map(r => r.user));
                    })
                }
                if (module.exports.type === 'mysql') {
                    module.exports.mysql.database.query('SELECT * FROM giveawayreactions WHERE giveaway=?', [id], function (err, reactions) {
                        if (err) reject(err);
                        return resolve(reactions.map(r => r.user));
                    })
                }
            })
        },
        getGiveawayWinners(id) {
            return new Promise((resolve, reject) => {
                if (module.exports.type === 'sqlite') {
                    module.exports.sqlite.database.all('SELECT users FROM giveaways WHERE messageID=?', [id], function (err, giveaways) {
                        if (err) reject(err);
                        return resolve(JSON.parse(giveaways[0].users));
                    })
                }
                if (module.exports.type === 'mysql') {
                    module.exports.mysql.database.query('SELECT users FROM giveaways WHERE messageID=?', [id], function (err, giveaways) {
                        if (err) reject(err);
                        return resolve(JSON.parse(giveaways[0].users));
                    })
                }
            })
        },
        getPrefixes(guildID) {
            return new Promise((resolve, reject) => {
                if (guildID) {

                    // SQLITE
                    if (module.exports.type === 'sqlite') module.exports.sqlite.database.all('SELECT * FROM prefixes WHERE guild=?', [guildID], function (err, prefixes) {
                        if (err) reject(err);
                        if (prefixes.length < 1) {
                            prefixes[0] = { prefix: Utils.variables.config.Bot_Prefix };
                            module.exports.update.prefixes.updatePrefix(guildID, Utils.variables.config.Bot_Prefix);
                        }
                        resolve(prefixes[0].prefix)
                    })

                    // MYSQL
                    if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM prefixes WHERE guild=?', [guildID], function (err, prefixes) {
                        if (err) reject(err);
                        if (prefixes.length < 1) {
                            prefixes[0] = { prefix: Utils.variables.config.Bot_Prefix };
                            module.exports.update.prefixes.updatePrefix(guildID, Utils.variables.config.Bot_Prefix);
                        }
                        resolve(prefixes[0].prefix)
                    })
                } else {

                    // SQLITE
                    if (module.exports.type === 'sqlite') module.exports.sqlite.database.all('SELECT * FROM prefixes', function (err, prefixes) {
                        if (err) reject(err);
                        resolve(prefixes);
                    })

                    // MYSQL
                    if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM prefixes', function (err, prefixes) {
                        if (err) reject(err);
                        resolve(prefixes);
                    })
                }
            })
        },
        getPunishments(id) {
            return new Promise((resolve, reject) => {
                if (id) {
                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.all('SELECT * FROM punishments WHERE id=?', [id], function (err, rows) {
                            if (err) reject(err);
                            else resolve(rows);
                        })
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM punishments WHERE id=?', [id], function (err, rows) {
                            if (err) reject(err);
                            else resolve(rows);
                        })
                    }
                } else {
                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.all('SELECT * FROM punishments', function (err, rows) {
                            if (err) reject(err);
                            else resolve(rows);
                        })
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM punishments', function (err, rows) {
                            if (err) reject(err);
                            else resolve(rows);
                        })
                    }
                }
            })
        },
        getPunishmentsForUser(user) {
            return new Promise((resolve, reject) => {
                if (module.exports.type === 'sqlite') {
                    module.exports.sqlite.database.all('SELECT * FROM punishments WHERE user=?', [user], function (err, rows) {
                        if (err) reject(err);
                        else resolve(rows);
                    })
                }
                if (module.exports.type === 'mysql') {
                    module.exports.mysql.database.query('SELECT * FROM punishments WHERE user=?', [user], function (err, rows) {
                        if (err) reject(err);
                        else resolve(rows);
                    })
                }
            })
        },
        getPunishmentID() {
            return new Promise((resolve, reject) => {
                if (module.exports.type === 'sqlite') {
                    module.exports.sqlite.database.all('SELECT id FROM punishments ORDER BY id DESC LIMIT 1', function (err, punishments) {
                        if (err) return reject(err);
                        resolve(punishments[0].id);
                    })
                }
                if (module.exports.type === 'mysql') {
                    module.exports.mysql.database.query('SELECT id FROM punishments ORDER BY id DESC LIMIT 1', function (err, punishments) {
                        if (err) return reject(err);
                        resolve(punishments[0].id);
                    })
                }
            })
        },
        getWarnings(user) {
            return new Promise((resolve, reject) => {
                if (user && user.id) {
                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.all('SELECT * FROM warnings WHERE user=?', [user.id], function (err, warnings) {
                            if (err) reject(err);
                            else resolve(warnings);
                        })
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM warnings WHERE user=?', [user.id], function (err, warnings) {
                            if (err) reject(err);
                            else resolve(warnings);
                        })
                    }
                } else {
                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.all('SELECT * FROM warnings', function (err, warnings) {
                            if (err) reject(err);
                            else resolve(warnings);
                        })
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM warnings', function (err, warnings) {
                            if (err) reject(err);
                            else resolve(warnings);
                        })
                    }
                }
            })
        },
        getWarning(id) {
            return new Promise((resolve, reject) => {
                if (module.exports.type === 'sqlite') {
                    module.exports.sqlite.database.all('SELECT * FROM warnings WHERE id=?', [id], function (err, warnings) {
                        if (err) reject(err);
                        else resolve(warnings[0]);
                    })
                }
                if (module.exports.type === 'mysql') {
                    module.exports.mysql.database.query('SELECT * FROM warnings WHERE id=?', [id], function (err, warnings) {
                        if (err) reject(err);
                        else resolve(warnings[0]);
                    })
                }
            })
        },
        getModules(modulename) {
            return new Promise((resolve, reject) => {
                if (modulename) {
                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.all('SELECT * FROM modules WHERE name=?', [modulename], function (err, rows) {
                            if (err) reject(err);
                            else {
                                if (rows.length > 0) {
                                    resolve({ name: rows[0].name, enabled: !!rows[0].enabled });
                                } else resolve({ name: modulename, enabled: true });
                            }
                        })
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM modules WHERE name=?', [modulename], function (err, rows) {
                            if (err) reject(err);
                            else resolve(rows[0]);
                        })
                    }
                } else {
                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.all('SELECT * FROM modules', function (err, rows) {
                            if (err) reject(err);
                            rows = rows.map(r => {
                                return {
                                    name: r.name,
                                    enabled: !!r.enabled
                                }
                            })
                            resolve(rows);
                        })
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM modules', function (err, rows) {
                            if (err) reject(err);
                            resolve(rows);
                        })
                    }
                }
            })
        },
        getJobs(user) {
            return new Promise((resolve, reject) => {
                if (user) {
                    if (!user.guild) reject('User is not a member.');

                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.all('SELECT * FROM jobs WHERE user=? AND guild=?', [user.id, user.guild.id], function (err, rows) {
                            if (err) reject(err);
                            if (rows.length < 1) resolve(undefined)
                            else resolve({
                                user: rows[0].user,
                                guild: rows[0].guild,
                                job: rows[0].job,
                                tier: rows[0].tier,
                                nextWorkTime: rows[0].next_work_time,
                                amountOfTimesWorked: rows[0].amount_of_times_worked
                            });
                        })
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM jobs WHERE user=? AND guild=?', [user.id, user.guild.id], function (err, rows) {
                            if (err) reject(err);
                            if (rows.length < 1) resolve(undefined)
                            else resolve({
                                user: rows[0].user,
                                guild: rows[0].guild,
                                job: rows[0].job,
                                tier: rows[0].tier,
                                nextWorkTime: rows[0].next_work_time,
                                amountOfTimesWorked: rows[0].amount_of_times_worked
                            });
                        })
                    }
                } else {
                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.all('SELECT * FROM jobs', function (err, rows) {
                            if (err) reject(err);
                            rows = rows.map(r => {
                                return {
                                    user: r.user,
                                    guild: r.guild,
                                    job: r.job,
                                    tier: r.tier,
                                    nextWorkTime: r.next_work_time,
                                    amountOfTimesWorked: r.amount_of_times_worked
                                }
                            })
                            resolve(rows);
                        })
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM jobs', function (err, rows) {
                            if (err) reject(err);
                            rows = rows.map(r => {
                                return {
                                    user: r.user,
                                    guild: r.guild,
                                    job: r.job,
                                    tier: r.tier,
                                    nextWorkTime: r.next_work_time,
                                    amountOfTimesWorked: r.amount_of_times_worked
                                }
                            })
                            resolve(rows);
                        })
                    }
                }
            })
        },
        getDailyCoinsCooldown(user) {
            return new Promise((resolve, reject) => {
                if (user) {
                    if (!user.guild) reject('User is not a member.');

                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.all('SELECT * FROM dailycoinscooldown WHERE user=? AND guild=?', [user.id, user.guild.id], function (err, rows) {
                            if (err) reject(err);
                            if (rows.length < 1) resolve(undefined)
                            else resolve(rows[0].date);
                        })
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM dailycoinscooldown WHERE user=? AND guild=?', [user.id, user.guild.id], function (err, rows) {
                            if (err) reject(err);
                            if (rows.length < 1) resolve(undefined)
                            else resolve(rows[0].date);
                        })
                    }
                } else reject('User required');
            })
        },
        getCommands(commandname) {
            return new Promise((resolve, reject) => {
                if (commandname) {
                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.all('SELECT * FROM commands WHERE name=?', [commandname], function (err, rows) {
                            if (err) reject(err)
                            else if (!rows[0]) resolve(undefined)
                            else resolve({ name: rows[0].name, enabled: !!rows[0].enabled });
                        })
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM commands WHERE name=?', [commandname], function (err, rows) {
                            if (err) reject(err);
                            else resolve(rows[0]);
                        })
                    }
                } else {
                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.all('SELECT * FROM commands', function (err, rows) {
                            if (err) reject(err);
                            rows = rows.map(r => {
                                return {
                                    name: r.name,
                                    enabled: !!r.enabled
                                }
                            })
                            resolve(rows);
                        })
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM commands', function (err, rows) {
                            if (err) reject(err);
                            resolve(rows);
                        })
                    }
                }
            })
        },
    },
    update: {
        prefixes: {
            async updatePrefix(guild, newprefix) {
                return new Promise(async (resolve, reject) => {
                    if ([guild, newprefix].some(t => !t)) reject('Invalid parameters');

                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.all('SELECT * FROM prefixes WHERE guild=?', [guild], function (err, prefixes) {
                            if (err) reject(err);
                            if (prefixes.length > 0) {
                                module.exports.sqlite.database.run('UPDATE prefixes SET prefix=? WHERE guild=?', [newprefix, guild], function (err) {
                                    if (err) reject(err);
                                    resolve();
                                })
                            } else {
                                module.exports.sqlite.database.run('INSERT INTO prefixes(guild, prefix) VALUES(?, ?)', [guild, newprefix], function (err) {
                                    if (err) reject(err);
                                    resolve();
                                })
                            }
                        })
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM prefixes WHERE guild=?', [guild], function (err, prefixes) {
                            if (err) reject(err);
                            if (prefixes.length > 0) {
                                module.exports.mysql.database.query('UPDATE prefixes SET prefix=? WHERE guild=?', [newprefix, guild], function (err) {
                                    if (err) reject(err);
                                    resolve();
                                })
                            } else {
                                module.exports.mysql.database.query('INSERT INTO prefixes(guild, prefix) VALUES(?, ?)', [guild, newprefix], function (err) {
                                    if (err) reject(err);
                                    resolve();
                                })
                            }
                        })
                    }
                })
            }
        },
        tickets: {
            addedUsers: {
                remove(ticket, userid) {
                    if (!userid) return console.log('[Database.js#addedUsers#remove] Invalid inputs');
                    return new Promise((resolve, reject) => {
                        if (module.exports.type === 'sqlite') {
                            module.exports.sqlite.database.run('DELETE FROM ticketsaddedusers WHERE ticket=? AND user=?', [ticket, userid], function (err) {
                                if (err) reject(err);
                                resolve();
                            })
                        }
                        if (module.exports.type === 'mysql') {
                            module.exports.mysql.database.query('DELETE FROM ticketsaddedusers WHERE ticket=? AND user=?', [ticket, userid], function (err) {
                                if (err) reject(err);
                                resolve();
                            })
                        }
                    })
                },
                add(ticket, userid) {
                    if (Object.values(arguments).some(a => !a)) return console.log('[Database.js#addedUsers#add] Invalid inputs');
                    return new Promise((resolve, reject) => {
                        if (module.exports.type === 'sqlite') {
                            module.exports.sqlite.database.run('INSERT INTO ticketsaddedusers(user, ticket) VALUES(?, ?)', [userid, ticket], function (err) {
                                if (err) reject(err);
                                resolve();
                            })
                        }
                        if (module.exports.type === 'mysql') {
                            module.exports.mysql.database.query('INSERT INTO ticketsaddedusers(user, ticket) VALUES(?, ?)', [userid, ticket], function (err) {
                                if (err) reject(err);
                                resolve();
                            })
                        }
                    })
                }
            },
            createTicket(data) {
                if (Object.values(arguments).some(a => !a)) return console.log('[Database.js#createTicket] Invalid inputs');
                return new Promise((resolve, reject) => {
                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.run('INSERT INTO tickets(guild, channel_id, channel_name, creator, reason) VALUES(?, ?, ?, ?, ?)', [data.guild, data.channel_id, data.channel_name, data.creator, data.reason], function (err) {
                            if (err) reject(err);
                            resolve();
                        })
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('INSERT INTO tickets(guild, channel_id, channel_name, creator, reason) VALUES(?, ?, ?, ?, ?)', [data.guild, data.channel_id, data.channel_name, data.creator, data.reason], function (err) {
                            if (err) reject(err);
                            resolve();
                        })
                    }
                })
            },
            removeTicket(id) {
                if (Object.values(arguments).some(a => !a)) return console.log('[Database.js#removeTicket] Invalid inputs');
                return new Promise((resolve, reject) => {
                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.run('DELETE FROM tickets WHERE channel_id=?', [id], function (err) {
                            if (err) reject(err);
                            resolve();
                        })
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('DELETE FROM tickets WHERE channel_id=?', [id], function (err) {
                            if (err) reject(err);
                            resolve();
                        })
                    }
                })
            },
        },
        status: {
            setStatus(type, activity) {
                return new Promise((resolve, reject) => {
                    const bot = Utils.variables.bot;

                    if (activity !== '') bot.user.setActivity(Utils.statusPlaceholders(activity), { type: type.toUpperCase() });
                    else bot.user.setActivity()
                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.run('UPDATE status SET type=?, activity=?', [type, activity], function (err) {
                            if (err) reject(err);
                            resolve();
                        })
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('UPDATE status SET type=?, activity=?', [type, activity], function (err) {
                            if (err) reject(err);
                            resolve();
                        })
                    }
                })
            }
        },
        coins: {
            updateCoins(user, amt, action) {
                return new Promise(async (resolve, reject) => {
                    if ([user, user.guild].some(t => !t)) reject('Invalid parameters in updateCoins');
                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.all('SELECT * FROM coins WHERE user=? AND guild=?', [user.id, user.guild.id], function (err, coins) {
                            if (err) reject(err);
                            let newcoins;
                            if (coins.length > 0) {
                                if (action == 'add') newcoins = coins[0].coins + amt;
                                if (action == 'remove') newcoins = coins[0].coins - amt;
                                if (action == 'set') newcoins = amt;
                                module.exports.sqlite.database.run('UPDATE coins SET coins=? WHERE user=? AND guild=?', [newcoins, user.id, user.guild.id], function (err) {
                                    if (err) reject(err);
                                    resolve();
                                })
                            } else {
                                if (action == 'add') newcoins = amt;
                                if (action == 'remove') newcoins = 0 - amt;
                                if (action == 'set') newcoins = amt;
                                module.exports.sqlite.database.run('INSERT INTO coins(user, guild, coins) VALUES(?, ?, ?)', [user.id, user.guild.id, newcoins], function (err) {
                                    if (err) reject(err);
                                    resolve();
                                })
                            }
                        })
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM coins WHERE user=? AND guild=?', [user.id, user.guild.id], function (err, coins) {
                            if (err) reject(err);
                            let newcoins;
                            if (coins.length > 0) {
                                if (action == 'add') newcoins = coins[0].coins + amt;
                                if (action == 'remove') newcoins = coins[0].coins - amt;
                                if (action == 'set') newcoins = amt;
                                module.exports.mysql.database.query('UPDATE coins SET coins=? WHERE user=? AND guild=?', [newcoins, user.id, user.guild.id], function (err) {
                                    if (err) reject(err);
                                    resolve();
                                })
                            } else {
                                if (action == 'add') newcoins = amt;
                                if (action == 'remove') newcoins = 0 - amt;
                                if (action == 'set') newcoins = amt;
                                module.exports.mysql.database.query('INSERT INTO coins(user, guild, coins) VALUES(?, ?, ?)', [user.id, user.guild.id, newcoins], function (err) {
                                    if (err) reject(err);
                                    resolve();
                                })
                            }
                        })
                    }
                })
            },
            setUserJob(user, job, tier) {
                return new Promise(async (resolve, reject) => {
                    //if ([user, user.guild, job, tier].some(t => !t)) reject('Invalid parameters in setUserJob');

                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.all('SELECT * FROM jobs WHERE user=? AND guild=?', [user.id, user.guild.id], function (err, rows) {
                            if (err) reject(err);
                            if (!rows[0]) {
                                module.exports.sqlite.database.run('INSERT INTO jobs(user, guild, job, tier, amount_of_times_worked) VALUES(?, ?, ?, ?, ?)', [user.id, user.guild.id, job, tier, 0], function (err) {
                                    if (err) reject(err);
                                    resolve();
                                })
                            } else {
                                module.exports.sqlite.database.run('UPDATE jobs SET tier=? WHERE user=? AND guild=?', [tier, user.id, user.guild.id], function (err) {
                                    if (err) reject(err);
                                    resolve();
                                })
                            }
                        })
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM jobs WHERE user=? AND guild=?', [user.id, user.guild.id], function (err, rows) {
                            if (err) reject(err);
                            if (!rows[0]) {
                                module.exports.mysql.database.query('INSERT INTO jobs(user, guild, job, tier, amount_of_times_worked) VALUES(?, ?, ?, ?, ?)', [user.id, user.guild.id, job, tier, 0], function (err) {
                                    if (err) reject(err);
                                    resolve();
                                })
                            } else {
                                module.exports.mysql.database.query('UPDATE jobs SET tier=? WHERE user=? AND guild=?', [tier, user.id, user.guild.id], function (err) {
                                    if (err) reject(err);
                                    resolve();
                                })
                            }
                        })
                    }
                })
            },
            setNextWorkTime(user, date) {
                return new Promise(async (resolve, reject) => {
                    if ([user, user.guild, date].some(t => !t)) reject('Invalid parameters in setNextWorkTime');

                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.all('SELECT * FROM jobs WHERE user=? AND guild=?', [user.id, user.guild.id], function (err, row) {
                            if (err) reject(err);
                            module.exports.sqlite.database.run('UPDATE jobs SET next_work_time=? WHERE user=? AND guild=?', [date, user.id, user.guild.id], function (err) {
                                if (err) reject(err);
                                resolve();
                            })
                        })
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM jobs WHERE user=? AND guild=?', [user.id, user.guild.id], function (err, row) {
                            if (err) reject(err);
                            module.exports.mysql.database.query('UPDATE jobs SET next_work_time=? WHERE user=? AND guild=?', [date, user.id, user.guild.id], function (err) {
                                if (err) reject(err);
                                resolve();
                            })
                        })
                    }
                })
            },
            setAmountOfTimesWorked(user, times) {
                return new Promise(async (resolve, reject) => {
                    if ([user, user.guild, times].some(t => !t)) reject('Invalid parameters in setAmountOfTimesWorked');

                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.all('SELECT * FROM jobs WHERE user=? AND guild=?', [user.id, user.guild.id], function (err, row) {
                            if (err) reject(err);
                            module.exports.sqlite.database.run('UPDATE jobs SET amount_of_times_worked=? WHERE user=? AND guild=?', [times, user.id, user.guild.id], function (err) {
                                if (err) reject(err);
                                resolve();
                            })
                        })
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM jobs WHERE user=? AND guild=?', [user.id, user.guild.id], function (err, row) {
                            if (err) reject(err);
                            module.exports.mysql.database.query('UPDATE jobs SET amount_of_times_worked=? WHERE user=? AND guild=?', [times, user.id, user.guild.id], function (err) {
                                if (err) reject(err);
                                resolve();
                            })
                        })
                    }
                })
            },
            removeUserJob(user) {
                return new Promise(async (resolve, reject) => {
                    if ([user, user.guild].some(t => !t)) reject('Invalid parameters in removeUserJob');

                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.all('SELECT * FROM jobs WHERE user=? AND guild=?', [user.id, user.guild.id], function (err, rows) {
                            if (err) reject(err);
                            module.exports.sqlite.database.run('DELETE FROM jobs WHERE user=? AND guild=?', [user.id, user.guild.id], function (err) {
                                if (err) reject(err);
                                resolve();
                            })
                        })
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM jobs WHERE user=? AND guild=?', [user.id, user.guild.id], function (err, rows) {
                            if (err) reject(err);
                            module.exports.mysql.database.query('DELETE FROM jobs WHERE user=? AND guild=?', [user.id, user.guild.id], function (err) {
                                if (err) reject(err);
                                resolve();
                            })
                        })
                    }
                })
            },
            setNextDailyCoinsTime(user, date) {
                return new Promise(async (resolve, reject) => {
                    if ([user, user.guild, date].some(t => !t)) reject('Invalid parameters in setNextDailyCoinsTime');

                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.all('SELECT * FROM dailycoinscooldown WHERE user=? AND guild=?', [user.id, user.guild.id], function (err, rows) {
                            if (err) reject(err);
                            if (rows.length > 0) {
                                module.exports.sqlite.database.run('UPDATE dailycoinscooldown SET date=? WHERE user=? AND guild=?', [date, user.id, user.guild.id], function (err) {
                                    if (err) reject(err);
                                    resolve();
                                })
                            } else {
                                module.exports.sqlite.database.run('INSERT INTO dailycoinscooldown(user, guild, date) VALUES(?,?,?)', [user.id, user.guild.id, date], function (err) {
                                    if (err) reject(err);
                                    resolve()
                                })
                            }
                        })
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM dailycoinscooldown WHERE user=? AND guild=?', [user.id, user.guild.id], function (err, rows) {
                            if (err) reject(err);
                            if (rows.length > 0) {
                                module.exports.mysql.database.query('UPDATE dailycoinscooldown SET date=? WHERE user=? AND guild=?', [date, user.id, user.guild.id], function (err) {
                                    if (err) reject(err);
                                    resolve();
                                })
                            } else {
                                module.exports.mysql.database.query('INSERT INTO dailycoinscooldown(user, guild, date) VALUES(?,?,?)', [user.id, user.guild.id, date], function (err) {
                                    if (err) reject(err);
                                    resolve();
                                })
                            }
                        })
                    }
                })
            },
        },
        experience: {
            updateExperience(user, level, xp, action) {
                return new Promise(async (resolve, reject) => {
                    if ([user, user.guild].some(t => !t) || isNaN(level) || isNaN(xp)) reject('Invalid parameters in updateExperience');

                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.all('SELECT * FROM experience WHERE user=? AND guild=?', [user.id, user.guild.id], function (err, experience) {
                            if (err) reject(err);
                            let newxp;
                            if (experience.length > 0) {
                                if (action == 'add') newxp = experience[0].xp + xp;
                                if (action == 'remove') newxp = experience[0].xp - xp;
                                if (action == 'set') newxp = xp;
                                module.exports.sqlite.database.run('UPDATE experience SET level=?, xp=? WHERE user=? AND guild=?', [level, newxp, user.id, user.guild.id], function (err) {
                                    if (err) reject(err);
                                    resolve();
                                })
                            } else {
                                if (action == 'add') newxp = experience[0].xp + xp;
                                if (action == 'remove') newxp = 0 - xp;
                                if (action == 'set') newxp = xp;
                                module.exports.sqlite.database.run('INSERT INTO experience(user, guild, level, xp) VALUES(?, ?, ?, ?)', [user.id, user.guild.id, level, newxp], function (err) {
                                    if (err) reject(err);
                                    resolve();
                                })
                            }
                        })
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM experience WHERE user=? AND guild=?', [user.id, user.guild.id], function (err, experience) {
                            if (err) reject(err);
                            let newxp;
                            if (experience.length > 0) {
                                if (action == 'add') newxp = experience[0].xp + xp;
                                if (action == 'remove') newxp = experience[0].xp - xp;
                                if (action == 'set') newxp = xp;
                                module.exports.mysql.database.query('UPDATE experience SET level=?, xp=? WHERE user=? AND guild=?', [level, newxp, user.id, user.guild.id], function (err) {
                                    if (err) reject(err);
                                    resolve();
                                })
                            } else {
                                if (action == 'add') newxp = experience[0].xp + xp;
                                if (action == 'remove') newxp = 0 - xp;
                                if (action == 'set') newxp = xp;
                                module.exports.mysql.database.query('INSERT INTO experience(user, guild, level, xp) VALUES(?, ?, ?, ?)', [user.id, user.guild.id, level, newxp], function (err) {
                                    if (err) reject(err);
                                    resolve();
                                })
                            }
                        })
                    }
                })
            }
        },
        filter: {
            addWord(word) {
                return new Promise((resolve, reject) => {
                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.run('INSERT INTO filter(word) VALUES(?)', [word], function (err) {
                            if (err) reject(err);
                            resolve();
                        })
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('INSERT INTO filter(word) VALUES(?)', [word], function (err) {
                            if (err) reject(err);
                            resolve();
                        })
                    }
                })
            },
            removeWord(word) {
                return new Promise((resolve, reject) => {
                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.run('DELETE FROM filter WHERE word=?', [word], function (err) {
                            if (err) reject(err);
                            resolve();
                        })
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('DELETE FROM filter WHERE word=?', [word], function (err) {
                            if (err) reject(err);
                            resolve();
                        })
                    }
                })
            }
        },
        giveaways: {
            addGiveaway(data) {
                return new Promise((resolve, reject) => {
                    if (['messageID', 'name', 'channel', 'guild', 'winners', 'end', 'creator', 'description'].some(d => !data[d]) || isNaN(data.end) || isNaN(data.winners) || data.ended !== false) return reject('Invalid data.');

                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.run('INSERT INTO giveaways(messageID, name, end, winners, channel, guild, ended, start, users, creator, description) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [data.messageID, data.name, data.end, data.winners, data.channel, data.guild, 0, Date.now(), '[]', data.creator, data.description], function (err) {
                            if (err) console.log(err);
                            resolve();
                        })
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('INSERT INTO giveaways(messageID, name, end, winners, channel, guild, ended, start, users, creator, description) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [data.messageID, data.name, data.end, data.winners, data.channel, data.guild, false, Date.now(), '[]', data.creator, data.description], function (err) {
                            if (err) console.log(err);
                            resolve();
                        })
                    }
                })
            },
            deleteGiveaway(id) {
                return new Promise((resolve, reject) => {
                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.run('DELETE FROM giveaways WHERE messageID=?', [id], function (err) {
                            if (err) reject(err);
                            else resolve();
                        })
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('DELETE FROM giveaways WHERE messageID=?', [id], function (err) {
                            if (err) reject(err);
                            else resolve();
                        })
                    }
                })
            },
            setToEnded(id) {
                return new Promise((resolve, reject) => {
                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.run('UPDATE giveaways SET ended=? WHERE messageID=?', [1, id], function (err) {
                            if (err) reject(err);
                            else resolve();
                        })
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('UPDATE giveaways SET ended=? WHERE messageID=?', [true, id], function (err) {
                            if (err) reject(err);
                            else resolve();
                        })
                    }
                })
            },
            setWinners(winners, id) {
                return new Promise((resolve, reject) => {
                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.run('UPDATE giveaways SET users=? WHERE messageID=?', [winners, id], function (err) {
                            if (err) reject(err);
                            else resolve();
                        })
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('UPDATE giveaways SET users=? WHERE messageID=?', [winners, id], function (err) {
                            if (err) reject(err);
                            else resolve();
                        })
                    }
                })
            },
            reactions: {
                addReaction(giveaway, user) {
                    return new Promise((resolve, reject) => {
                        if (!giveaway || !user) return reject('Invalid giveaway or user.');

                        if (module.exports.type === 'sqlite') {
                            module.exports.sqlite.database.run('INSERT INTO giveawayreactions(giveaway, user) VALUES(?, ?)', [giveaway, user], function (err) {
                                if (err) reject(err);
                                resolve();
                            })
                        }
                        if (module.exports.type === 'mysql') {
                            module.exports.mysql.database.query('INSERT INTO giveawayreactions(giveaway, user) VALUES(?, ?)', [giveaway, user], function (err) {
                                if (err) reject(err);
                                resolve();
                            })
                        }
                    })
                },
                removeReaction(giveaway, user) {
                    return new Promise((resolve, reject) => {
                        if (!giveaway || !user) return reject('Invalid giveaway or user.');

                        if (module.exports.type === 'sqlite') {
                            module.exports.sqlite.database.run('DELETE FROM giveawayreactions WHERE giveaway=? AND user=?', [giveaway, user], function (err) {
                                if (err) reject(err);
                                resolve();
                            })
                        }
                        if (module.exports.type === 'mysql') {
                            module.exports.mysql.database.query('DELETE FROM giveawayreactions WHERE giveaway=? AND user=?', [giveaway, user], function (err) {
                                if (err) reject(err);
                                resolve();
                            })
                        }
                    })
                }
            }
        },
        punishments: {
            addPunishment(data) {
                return new Promise((resolve, reject) => {
                    if (['type', 'user', 'tag', 'reason', 'time', 'executor'].some(a => !data[a])) return reject('Invalid arguments for addPunishment');

                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.run('INSERT INTO punishments(type, user, tag, reason, time, executor, length) VALUES(?, ?, ?, ?, ?, ?, ?)', [data.type, data.user, data.tag, data.reason, data.time, data.executor, data.length], function (err) {
                            if (err) reject(err);
                            else resolve();
                        })
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('INSERT INTO punishments(type, user, tag, reason, time, executor, length) VALUES(?, ?, ?, ?, ?, ?, ?)', [data.type, data.user, data.tag, data.reason, data.time, data.executor, data.length], function (err) {
                            if (err) reject(err);
                            else resolve();
                        })
                    }
                })
            },
            removePunishment(id) {
                return new Promise((resolve, reject) => {
                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.run('DELETE FROM punishments WHERE id=?', [id], function (err) {
                            if (err) reject(err);
                            else resolve();
                        })
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('DELETE FROM punishments WHERE id=?', [id], function (err) {
                            if (err) reject(err);
                            else resolve();
                        })
                    }
                })
            },
            addWarning(data) {
                return new Promise((resolve, reject) => {
                    if (['user', 'tag', 'reason', 'time', 'executor'].some(a => !data[a])) return reject('Invalid arguments for addWarning');

                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.run('INSERT INTO warnings(user, tag, reason, time, executor) VALUES(?, ?, ?, ?, ?)', [data.user, data.tag, data.reason, data.time, data.executor], function (err) {
                            if (err) reject(err);
                            else resolve();
                        })
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('INSERT INTO warnings(user, tag, reason, time, executor) VALUES(?, ?, ?, ?, ?)', [data.user, data.tag, data.reason, data.time, data.executor], function (err) {
                            if (err) reject(err);
                            else resolve();
                        })
                    }
                })
            },
            removeWarning(id) {
                return new Promise((resolve, reject) => {
                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.run('DELETE FROM warnings WHERE id=?', [id], function (err) {
                            if (err) reject(err);
                            else resolve(err);
                        })
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('DELETE FROM warnings WHERE id=?', [id], function (err) {
                            if (err) reject(err);
                            else resolve(err);
                        })
                    }
                })
            }
        },
        modules: {
            setModule(modulename, enabled) {
                return new Promise((resolve, reject) => {
                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.run('UPDATE modules SET enabled=? WHERE name=?', [enabled ? 1 : 0, modulename], function (err) {
                            if (err) reject(err);
                            else resolve();
                        })
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('UPDATE modules SET enabled=? WHERE name=?', [enabled, modulename], function (err) {
                            if (err) reject(err);
                            else resolve();
                        })
                    }
                })
            }
        },
        commands: {
            setCommand(commandname, enabled) {
                return new Promise((resolve, reject) => {
                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.run('UPDATE commands SET enabled=? WHERE name=?', [enabled ? 1 : 0, commandname], function (err) {
                            if (err) reject(err);
                            else resolve();
                        })
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('UPDATE commands SET enabled=? WHERE name=?', [enabled, commandname], function (err) {
                            if (err) reject(err);
                            else resolve();
                        })
                    }
                })
            }
        }
    }
}
// 159331   8501   648409    46410   1590653881   15b8468e6abc07ecf8208e70b709702258380118   648409
