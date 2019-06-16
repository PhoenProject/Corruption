const Discord = require("discord.js");
const mysql = require("mysql");
const utils = require("./utils.js");
const moment = require("moment");
const fetch = require('node-fetch');
const SteamAPI = require('steamapi');
const config = require("../config.json");
const bot = require('../CorruptionBot.js')
const steam = new SteamAPI(config.SteamAIPKey);

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
        if (mArgs[0] === "?wadd") {
            if (!mArgs[1]) return message.reply("you need to state an IP >:(");
            if (!mArgs[2]) return message.reply("you need to state a reason >:(");

            var IP = mArgs[1].replace(/'/g, "");

            watchcon.query(`SELECT * FROM hackers WHERE Value = '${IP}'`, (err, rows) => {
                if (err) return message.channel.send("There was an error adding that user to the database! " + err);
                else if (!rows || rows.length < 1) AddUser(message, IP, watchcon, mArgs)
                else return message.reply("that user already exists in the database. Perhaps try `?wupdate` instead...");
            })
        }
        else if (mArgs[0] === "?wremove") {
            if (!mArgs[1]) return message.reply("you need to state an IP >:(");

            var IP = mArgs[1].replace(/'/g, "");

            message.channel.send(IP);

            watchcon.query(`SELECT * FROM hackers WHERE Value = '${IP}'`, (err, rows) => {
                if (err) return message.channel.send("There was an error removing that user to the database! " + err);
                else if (!rows || rows.length < 1) message.reply("that user does not exist in the database!");
                else RemoveUser(message, IP, watchcon)
            })
        }
        else if (mArgs[0] === "?wupdate") {
            if (!mArgs[1]) return message.reply("you need to state an IP >:(");
            if (!mArgs[2]) return message.reply("you need to state a reason >:(");

            var IP = mArgs[1].replace(/'/g, "");

            watchcon.query(`SELECT * FROM hackers WHERE Value = '${IP}'`, (err, rows) => {
                if (err) return message.channel.send("There was an error removing that user to the database! " + err);
                else if (!rows || rows.length < 1) message.reply("that user does not exist in the database!");
                else UpdateUser(message, IP, watchcon, mArgs)
            })
        }
    }
}

function AddUser(message, IP, watchcon, mArgs) {
    var mAuthor = message.author;
    var mAuthorName = message.author.username.replace(/'/g, '');
    var Reason = mArgs.slice(2).join(' ').replace(/'/g, "");

    watchcon.query(`INSERT INTO hackers (Value, Reason, AddedBy) VALUES ('${IP}', '${Reason}', '${mAuthorName}')`);
    setTimeout(function () {
        watchcon.query(`SELECT * FROM hackers WHERE Value = '${IP}'`, (err, rows) => {
            if (err) return message.channel.send("There was an error adding that user to the database! " + err);
            else if (!rows || rows.length < 1) return message.channel.send("I encountered an error when validating the addition!\nGo ree at <@124241068727336963>");
            else message.channel.send("User ||" + IP + "|| was sucessfully added to the database!");
        })
    }, 300)
}

function RemoveUser(message, IP, watchcon) {
    watchcon.query(`DELETE FROM hackers WHERE Value = '${IP}'`);

    setTimeout(function () {
        watchcon.query(`SELECT * FROM hackers WHERE Value = '${IP}'`, (err, rows) => {
            if (err) return message.channel.send("There was an error adding that user to the database! " + err);
            else if (!rows || rows.length < 1) message.channel.send("User ||" + IP + "|| was sucessfully removed from the database!");
            else return message.channel.send("I encountered an error when validating the removal!\nGo ree at <@124241068727336963>");
        })
    }, 300)
}

function UpdateUser(message, IP, watchcon, mArgs) {
    var mAuthor = message.author;
    var mAuthorName = message.author.username.replace(/'/g, '');
    var Reason = mArgs.slice(2).join(' ').replace(/'/g, "");

    watchcon.query(`UPDATE hackers SET Reason = '${Reason}' WHERE Value = '${IP}'`);

    setTimeout(function () {
        watchcon.query(`SELECT * FROM hackers WHERE Value = '${IP}'`, (err, rows) => {
            if (err) return message.channel.send("There was an error updating that user on the database! " + err);
            else if (!rows || rows.length < 1) return message.channel.send("I encountered an error when validating the addition!\nGo ree at <@124241068727336963>");
            else message.channel.send("User ||" + IP + "|| was sucessfully updated!");
        })
    }, 300)
}