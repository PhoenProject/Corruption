const mysql = require("mysql");
const config = require("../config.json");
const fetch = require("node-fetch");

var watchcon = mysql.createConnection({
    host: config.WatchHost,
    user: config.WatchUser,
    password: config.WatchPass,
    database: config.WatchDB,
    charset: 'utf8mb4'
});
watchcon.connect(err => {
    if (err) console.log(err)
    console.log("Connected To Database");
})
watchcon.on('error', error => {
    if (error.code === 'PROTOCOL_CONNECTION_LOST') {
        watchcon = mysql.createConnection({
            host: config.WatchHost,
            user: config.WatchUser,
            password: config.WatchPass,
            database: config.WatchDB,
            charset: 'utf8mb4'
        });
    } else console.log(error)
})

module.exports.watcher = (client, message) => {
    if (message.member.roles.find(role => role.id === "567167097373720598") || message.member.hasPermission("ADMINISTRATOR")) {
        let mArgs = message.content.split(' ');
        let mName = message.author.username.replace(/'/g, '');
        let Value = mArgs[1].replace(/'/g, "");
        if (!mArgs[1]) {
            message.reply("you need to state an IP >:(");
            message.delete();
        }
        else {
            switch (mArgs[0]) {
                case "?widadd":
                    AddUID(message, mArgs, mName, Value);
                    break;
                case "?wgipadd":
                    AddGameIP(message, mArgs, mName, Value);
                    break;
                case "?wauthadd":
                    AddAuthIP(message, mArgs, mName, Value);
                    break;
                case "?widdel":
                    DelUID(message, mArgs, mName, Value);
                    break;
                case "?wgipdel":
                    DelGameIP(message, mArgs, mName, Value);
                    break;
                case "?wauthdel":
                    DelAuthIP(message, mArgs, mName, Value);
                    break;
                case "?widupdate":
                    UpdateUID(message, mArgs, mName, Value);
                    break;
                case "?wgipupdate":
                    UpdateGameIP(message, mArgs, mName, Value);
                    break;
                case "?wauthupdate":
                    UpdateAuthIP(message, mArgs, mName, Value);
                    break;
                default:
                    break;
            }
        }
    }
}

function AddUID(message, mArgs, mName, Value) {

    fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${config.SteamAIPKey}&steamids=${Value}`)
        .then(res => res.json())
        .then(json => {
            if (!JSON.stringify(json).includes(`,"communityvisibilitystate"`)) {
                message.reply(`That is an invalid SteamID`)
                message.delete()
            }
            else {

                watchcon.query(`SELECT * FROM uid WHERE Value = '${Value}'`, (err, check) => {
                    if (!check || check.length < 1) {
                        if (!mArgs[2]) {
                            message.reply("you need to state a reason >:(");
                            message.delete();
                        }
                        else {
                            var Reason = mArgs.slice(2).join(' ').replace(/'/g, "");

                            watchcon.query(`INSERT INTO uid (Value, Reason, AddedBy) VALUES ('${Value}', '${Reason}', '${mName}')`);
                            setTimeout(function () {
                                watchcon.query(`SELECT * FROM uid WHERE Value = '${Value}'`, (err, rows) => {
                                    if (err) return message.channel.send("There was an error adding that user to the database! " + err);
                                    else if (!rows || rows.length < 1) return message.channel.send("I encountered an error when validating the addition!\nGo ree at <@124241068727336963>");
                                    else message.channel.send(`User ||${Value}|| was sucessfully added to the database!`);
                                    message.delete();
                                })
                            }, 300)
                        }
                    }
                    else {
                        message.channel.send("That user is already in the database");
                        message.delete();
                    }
                })
            }
        })
}
function AddGameIP(message, mArgs, mName, Value) {
    watchcon.query(`SELECT * FROM game_ip WHERE Value = '${Value}'`, (err, check) => {
        if (!check || check.length < 1) {
            if (!mArgs[2]) {
                message.reply("you need to state a reason >:(");
                message.delete();
            }
            else {
                var Reason = mArgs.slice(2).join(' ').replace(/'/g, "");

                watchcon.query(`INSERT INTO game_ip (Value, Reason, AddedBy) VALUES ('${Value}', '${Reason}', '${mName}')`);
                setTimeout(function () {
                    watchcon.query(`SELECT * FROM game_ip WHERE Value = '${Value}'`, (err, rows) => {
                        if (err) return message.channel.send("There was an error adding that user to the database! " + err);
                        else if (!rows || rows.length < 1) return message.channel.send("I encountered an error when validating the addition!\nGo ree at <@124241068727336963>");
                        else message.channel.send(`User ||${Value}|| was sucessfully added to the database!`);
                        message.delete();
                    })
                }, 300)
            }
        }
        else {
            message.channel.send("That user is already in the database");
            message.delete();
        }
    })
}
function AddAuthIP(message, mArgs, mName, Value) {
    watchcon.query(`SELECT * FROM auth_ip WHERE Value = '${Value}'`, (err, check) => {
        if (!check || check.length < 1) {
            if (!mArgs[2]) {
                message.reply("you need to state a reason >:(");
                message.delete();
            }
            else {
                var Reason = mArgs.slice(2).join(' ').replace(/'/g, "");

                watchcon.query(`INSERT INTO auth_ip (Value, Reason, AddedBy) VALUES ('${Value}', '${Reason}', '${mName}')`);
                setTimeout(function () {
                    watchcon.query(`SELECT * FROM auth_ip WHERE Value = '${Value}'`, (err, rows) => {
                        if (err) return message.channel.send("There was an error adding that user to the database! " + err);
                        else if (!rows || rows.length < 1) return message.channel.send("I encountered an error when validating the addition!\nGo ree at <@124241068727336963>");
                        else message.channel.send(`User ||${Value}|| was sucessfully added to the database!`);
                        message.delete();
                    })
                }, 300)
            }
        }
        else {
            message.channel.send("That user is already in the database");
            message.delete();
        }
    })
}

function DelUID(message, mArgs, mName, Value) {
    watchcon.query(`SELECT * FROM uid WHERE Value = '${Value}'`, (err, check) => {
        if (!check || check.length < 1) {
            message.channel.send("That user does not exist in the database");
            message.delete();
        }
        else {
            watchcon.query(`DELETE FROM uid WHERE Value = '${Value}'`);

            setTimeout(function () {
                watchcon.query(`SELECT * FROM uid WHERE Value = '${Value}'`, (err, rows) => {
                    if (err) return message.channel.send("There was an error adding that user to the database! " + err);
                    else if (!rows || rows.length < 1) message.channel.send(`User ||${Value}|| was sucessfully removed from the database!`);
                    else return message.channel.send("I encountered an error when validating the removal!\nGo ree at <@124241068727336963>");
                    message.delete();
                })
            }, 300)
        }
    })
}
function DelGameIP(message, mArgs, mName, Value) {
    watchcon.query(`SELECT * FROM game_ip WHERE Value = '${Value}'`, (err, check) => {
        if (!check || check.length < 1) {
            message.channel.send("That user does not exist in the database");
            message.delete();
        }
        else {
            watchcon.query(`DELETE FROM game_ip WHERE Value = '${Value}'`);

            setTimeout(function () {
                watchcon.query(`SELECT * FROM game_ip WHERE Value = '${Value}'`, (err, rows) => {
                    if (err) return message.channel.send("There was an error adding that user to the database! " + err);
                    else if (!rows || rows.length < 1) message.channel.send(`User ||${Value}|| was sucessfully removed from the database!`);
                    else return message.channel.send("I encountered an error when validating the removal!\nGo ree at <@124241068727336963>");
                    message.delete();
                })
            }, 300)
        }
    })
}
function DelAuthIP(message, mArgs, mName, Value) {
    watchcon.query(`SELECT * FROM auth_ip WHERE Value = '${Value}'`, (err, check) => {
        if (!check || check.length < 1) {
            message.channel.send("That user does not exist in the database");
            message.delete();
        }
        else {
            watchcon.query(`DELETE FROM auth_ip WHERE Value = '${Value}'`);

            setTimeout(function () {
                watchcon.query(`SELECT * FROM auth_ip WHERE Value = '${Value}'`, (err, rows) => {
                    if (err) return message.channel.send("There was an error adding that user to the database! " + err);
                    else if (!rows || rows.length < 1) message.channel.send(`User ||${Value}|| was sucessfully removed from the database!`);
                    else return message.channel.send("I encountered an error when validating the removal!\nGo ree at <@124241068727336963>");
                    message.delete();
                })
            }, 300)
        }
    })
}

function UpdateUID(message, mArgs, mName, Value) {
    watchcon.query(`SELECT * FROM uid WHERE Value = '${Value}'`, (err, check) => {
        if (!check || check.length < 1) {
            message.channel.send("That user does not exist in the database");
            message.delete();
        }
        else {
            if (!mArgs[2]) {
                message.reply("you need to state a reason >:(");
                message.delete();
            }
            else {
                var Reason = mArgs.slice(2).join(' ').replace(/'/g, "");

                watchcon.query(`UPDATE uid SET Reason = '${Reason}' WHERE Value = '${Value}'`);

                setTimeout(function () {
                    watchcon.query(`SELECT * FROM uid WHERE Value = '${Value}'`, (err, rows) => {
                        if (err) return message.channel.send("There was an error updating that user on the database! " + err);
                        else if (!rows || rows.length < 1) return message.channel.send("I encountered an error when validating the addition!\nGo ree at <@124241068727336963>");
                        else message.channel.send(`User ||${Value}|| was sucessfully updated!`);
                        message.delete();
                    })
                }, 300)
            }
        }
    })
}
function UpdateGameIP(message, mArgs, mName, Value) {
    watchcon.query(`SELECT * FROM game_ip WHERE Value = '${Value}'`, (err, check) => {
        if (!check || check.length < 1) {
            message.channel.send("That user does not exist in the database");
            message.delete();
        }
        else {
            if (!mArgs[2]) {
                message.reply("you need to state a reason >:(");
                message.delete();
            }
            else {
                var Reason = mArgs.slice(2).join(' ').replace(/'/g, "");

                watchcon.query(`UPDATE game_ip SET Reason = '${Reason}' WHERE Value = '${Value}'`);

                setTimeout(function () {
                    watchcon.query(`SELECT * FROM game_ip WHERE Value = '${Value}'`, (err, rows) => {
                        if (err) return message.channel.send("There was an error updating that user on the database! " + err);
                        else if (!rows || rows.length < 1) return message.channel.send("I encountered an error when validating the addition!\nGo ree at <@124241068727336963>");
                        else message.channel.send(`User ||${Value}|| was sucessfully updated!`);
                        message.delete();
                    })
                }, 300)
            }
        }
    })
}
function UpdateAuthIP(message, mArgs, mName, Value) {
    watchcon.query(`SELECT * FROM auth_ip WHERE Value = '${Value}'`, (err, check) => {
        if (!check || check.length < 1) {
            message.channel.send("That user does not exist in the database");
            message.delete();
        }
        else {
            if (!mArgs[2]) {
                message.reply("you need to state a reason >:(");
                message.delete();
            }
            else {
                var Reason = mArgs.slice(2).join(' ').replace(/'/g, "");

                watchcon.query(`UPDATE auth_ip SET Reason = '${Reason}' WHERE Value = '${Value}'`);

                setTimeout(function () {
                    watchcon.query(`SELECT * FROM auth_ip WHERE Value = '${Value}'`, (err, rows) => {
                        if (err) return message.channel.send("There was an error updating that user on the database! " + err);
                        else if (!rows || rows.length < 1) return message.channel.send("I encountered an error when validating the addition!\nGo ree at <@124241068727336963>");
                        else message.channel.send(`User ||${Value}|| was sucessfully updated!`);
                        message.delete();
                    })
                }, 300)
            }
        }
    })
}