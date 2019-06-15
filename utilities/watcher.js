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
    let mArgs = message.content.split(' ');
    if (mArgs[1] === "?wadd") {
        let mAuthor = message.author;
        let mAuthorName = message.author.name.replace(/'/g, '');
        let mArgs = message.content.split(' ');
        let IP = mArgs[1].replace(/'/g, "");

        if (!args[2]) return message.reply("you need to state a reason >:(")
        else let Reason = mArgs.slice(2).join(' ');

        watchcon.query(`INSERT INTO hackers (Value, Reason, AddedBy) VALUES ('${IP}', '${Reason}', '${mAuthorName}')`);
        setTimeout(function () {
            watchcon.query(`SELECT * FROM hackers WHERE Value = '${IP}'`, (err, rows) => {
                if(err) return message.channel.send("There was an error adding that user to the database! " + err);
                else if(!rows || rows.length < 1) return message.channel.send("I encountered an error when validating the addition!\nGo ree at <@124241068727336963>");
                else {
                    message.channel.send("User ||" + IP + "|| was sucessfully added to the database!");
                    message.delete()l
                }
            })
        }, 300)
    }
}