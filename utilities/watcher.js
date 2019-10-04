const discord = require("discord.js");
const mysql = require("mysql");
const config = require("../config.json");
const utils = require('./BaseBotFunction.js');
const fetch = require("node-fetch");
const moment = require("moment");
const isIp = require('is-ip');

var watchcon = mysql.createConnection({
    host: config.DBHost,
    user: config.WatchUser,
    password: config.WatchPass,
    database: config.WatchDB,
    charset: 'utf8mb4'
});
watchcon.connect(err => {
    if (err) utils.ConsoleMessage(error, `error`)
    utils.ConsoleMessage(`Connected to Watcher database`, `startup`)
})
watchcon.on('error', error => {
    if (error.code === 'PROTOCOL_CONNECTION_LOST') {
        watchcon = mysql.createConnection({
            host: config.DBHost,
            user: config.WatchUser,
            password: config.WatchPass,
            database: config.WatchDB,
            charset: 'utf8mb4'
        });
    } else utils.ConsoleMessage(error, `error`)
})

module.exports.watcher = (client, message, cmd, prefix) => {
    if (!message.content.startsWith(prefix)) return;
    message.delete()
    
    if (message.channel.id !== "590013015718363165") return message.reply(`please use <#590013015718363165> for these commands`)

    let mArgsDirty = message.content.split(' ');
    let mArgs = mArgsDirty.slice(1);

    switch (cmd) {
        case "add":
        case "useradd":
        case "watch":
        case "watcheradd":
            CheckAddition(message, mArgs);
            break;
        case "del":
        case "userdel":
        case "remove":
            CheckRemoval(message, mArgs);
            break;
    }
}

// #region Addition
function CheckAddition(message, mArgs) {

    if (!mArgs[0]) return message.reply("you need to state an IP/ID");

    let Value = mArgs[0]

    if (isIp.v4(Value)) return AddIPv4(message, mArgs, Value);
    else if (isIp.v6(Value)) return AddIPv6(message, mArgs, Value);
    else {
        fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${config.SteamAIPKey}&steamids=${Value}`)
            .then(res => res.json())
            .then(json => {
                if (JSON.stringify(json).includes(`,"communityvisibilitystate"`)) return AddUID(message, mArgs, Value);
                else return message.reply(`the value given is not a valid IP address or SteamID64`)
            })
    }
}

function AddIPv4(message, mArgs, Value) {
    if (!mArgs[1]) return message.reply("you need to state a reason");

    let Data = new Object();

    Data.Value = Value;
    Data.Reason = mArgs.slice(1).join(" ")
    Data.AddedBy = message.author.username;

    DBCheck(Value, `game_ip`, function (DoesExistGame) {
        DBCheck(Value, `auth_ip`, function (DoesExistAuth) {
            if (DoesExistGame && DoesExistAuth) return message.channel.send(`That user already exists`)
            else {
                if (!DoesExistGame) AddToDataBase(message, Data, `game_ip`);
                if (!DoesExistAuth) AddToDataBase(message, Data, `auth_ip`);

                return;
            }
        })
    })
}
function AddIPv6(message, mArgs, Value) {
    if (!mArgs[1]) return message.reply("you need to state a reason");

    let Data = new Object();

    Data.Value = Value;
    Data.Reason = mArgs.slice(1).join(" ")
    Data.AddedBy = message.author.username;

    DBCheck(Value, `auth_ip`, function (DoesExistAuth) {
        if (DoesExistAuth) return message.channel.send(`That user already exists`)
        else return AddToDataBase(message, Data, `auth_ip`);
    })
}
function AddUID(message, mArgs, Value) {
    if (!mArgs[1]) return message.reply("you need to state a reason");

    let Data = new Object();

    Data.Value = Value;
    Data.Reason = mArgs.slice(1).join(" ")
    Data.AddedBy = message.author.username;

    DBCheck(Value, `uid`, function (DoesExistUID) {
        if (DoesExistUID) return message.channel.send(`That user already exists`)
        else return AddToDataBase(message, Data, `uid`);
    })
}
function AddToDataBase(message, Data, DB) {
    let Check;

    switch (DB) {
        case "game_ip": Check = "Game IP"; break;
        case "auth_ip": Check = "Authentication IP"; break;
        case "uid": Check = "User ID"; break;
        default: break;
    }

    watchcon.query(`INSERT INTO ${DB} (Value, Reason, AddedBy) VALUES (?, ?, ?)`, [Data.Value, Data.Reason, Data.AddedBy]);
    setTimeout(function () {
        watchcon.query(`SELECT * FROM ${DB} WHERE Value = ?`, [Data.Value], (err, rows) => {
            if (err) return message.channel.send("<@124241068727336963>, i encountered an error while validating the database addition: " + err);
            else if (!rows || rows.length < 1) return message.channel.send("<@124241068727336963>, I was unable to validate the new database addition");
            else return message.channel.send(`Successfully added ||${Data.Value}|| to the ${Check} check!`);
        })
    }, 300)
}

// #endregion

// #region Deletion
function CheckRemoval(message, mArgs) {
    if (!mArgs[0]) return message.reply("you need to state an IP/ID");
    let Value = mArgs[0];

    DBCheck(Value, `game_ip`, function (DoExistGame) {
        DBCheck(Value, `auth_ip`, function (DoExistAuth) {
            DBCheck(Value, `uid`, function (DoExistUID) {
                if (!DoExistGame && !DoExistAuth && !DoExistUID) return message.channel.send(`That user does not exist in the database`)

                if (DoExistGame) Remove(message, Value, `game_ip`, `Game IP`)
                if (DoExistAuth) Remove(message, Value, `auth_ip`, `Authentication IP`)
                if (DoExistUID) Remove(message, Value, `uid`, `User ID`)
            })
        })
    })
}

function Remove(message, Value, DB, Check) {
    watchcon.query(`DELETE FROM ${DB} WHERE Value = ?`, [Value]);
    message.channel.send(`Successfully removed ||${Value}|| from ${Check} check`);
}
// #endregion

function DBCheck(Value, DB, callback) {
    watchcon.query(`SELECT * FROM ${DB} WHERE Value = ?`, [Value], function (err, check) {
        if (!check || check.length < 1) return callback(false);
        else return callback(true);
    })
}

