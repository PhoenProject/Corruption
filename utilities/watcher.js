const discord = require("discord.js");
const mysql = require("mysql");
const config = require("../config.json");
const utils = require('./BaseBotFunction.js');
const fetch = require("node-fetch");
const moment = require("moment");
const momentTimezone = require('moment-timezone');
const isIp = require('is-ip');
const Reader = require('@maxmind/geoip2-node').Reader;

var watchcon = mysql.createConnection({
    host: config.DBHost,
    user: config.WatchUser,
    password: config.WatchPass,
    database: config.WatchDB,
    charset: 'utf8mb4'
});
watchcon.connect(err => {
    if (err) utils.ConsoleMessage(err, `error`)
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
    message.delete();

    if (message.channel.id !== "590013015718363165") return message.reply(`please use <#590013015718363165> for these commands`)

    let mArgsDirty = message.content.split(' ');
    let mArgs = mArgsDirty.slice(1);

    switch (cmd) {
        case "wadd":
        case "wuseradd":
        case "watch":
        case "watcheradd":
            CheckAddition(message, mArgs);
            break;
        case "wdel":
        case "wuserdel":
        case "wremove":
            CheckRemoval(message, mArgs);
            break;
        case "watcherinfo":
        case "wuserinfo":
        case "wipinfo":
        case "wquery":
            CheckInfo(message, mArgs);
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

// #region Info

function CheckInfo(message, mArgs) {

    if (!mArgs[0]) return message.reply("you need to state an IP/ID");

    let Value = mArgs[0]

    if (isIp.v4(Value)) return SendEmbed(message, Value, "game_ip", true);
    else if (isIp.v6(Value)) return SendEmbed(message, Value, "auth_ip", true);
    else {
        fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${config.SteamAIPKey}&steamids=${Value}`)
            .then(res => res.json())
            .then(json => {
                if (JSON.stringify(json).includes(`,"communityvisibilitystate"`)) return SendEmbed(message, Value, "uid", false);
                else return message.reply(`the value given is not a valid IP address or SteamID64`)
            })
    }
}

function SendEmbed(message, Value, DB, IsIP) {
    DBCheck(Value, DB, function (Exists) {
        if (!Exists) return message.channel.send(`That user does not exist in the database`);

        watchcon.query(`SELECT * FROM ${DB} WHERE Value = ?`, [Value], function (err, WatcherInfo) {
            let WatcherObject = new Object();

            WatcherObject.AddedBy = WatcherInfo[0].AddedBy;
            WatcherObject.Reason = WatcherInfo[0].Reason;

            if (IsIP) IpInfo(message, Value, WatcherObject);
            else SteamInfo(message, Value, WatcherObject);
        })
    })
}

function IpInfo(message, Value, WatcherObject) {
    Reader.open(`/usr/share/GeoIP/GeoLite2-Country.mmdb`).then(Country => {
        Reader.open(`/usr/share/GeoIP/GeoLite2-City.mmdb`).then(City => {
            Reader.open(`/usr/share/GeoIP/GeoLite2-ASN.mmdb`).then(ASN => {
                const CountryResponse = Country.country(Value);
                const CityResponse = City.city(Value);
                const ASNResponse = ASN.asn(Value);

                let InfoEmbed = new discord.RichEmbed()
                    .setAuthor(`Info for ${Value}`)
                    .setColor('#e450f4')
                    .setTimestamp()
                    .addField("IP Information",
                        `Country: ${CountryResponse.country.names["en"]} (${CountryResponse.country.isoCode})`
                        + `\nContinent: ${CountryResponse.continent.names["en"]}  (${CountryResponse.continent.code})`
                        + `\nIs in EU: ${CountryResponse.country.isInEuropeanUnion == undefined ? "False" : "True"}`
                        + `\nTimeZone: ${CityResponse.location.timeZone.replace(/_/g, " ")} (${momentTimezone.tz(moment(), CityResponse.location.timeZone).format("Z z")})`
                        + `\nASN: ${ASNResponse.autonomousSystemNumber} (${ASNResponse.autonomousSystemOrganization})`)
                InfoEmbed.addField("Watcher Info", `Added By: ${WatcherObject.AddedBy}`
                    + `\nReason: ${WatcherObject.Reason}`)
                    .setFooter("Information generated using MaxMind GeoLite2 Databases");

                message.channel.send(InfoEmbed);
            })
        })
    })
}
function SteamInfo(message, Value, WatcherObject) {
    fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${config.SteamAIPKey}&steamids=${Value}`)
        .then(res => res.json())
        .then(PlrJson => {

            let InfoEmbed = new discord.RichEmbed()
                .setAuthor(`Steam info for ${Value}`)
                .setDescription(PlrJson.response.players[0].communityvisibilitystate != 3 ? "User's profile is set to private or friends only!" :
                    (PlrJson.response.players[0].gameid != undefined ? `Currently ingame: ${PlrJson.response.players[0].gameextrainfo} (${PlrJson.response.players[0].gameid})` :
                        (PlrJson.response.players[0].personastate != 0 ? "Currently online" : "Currently Offline")))
                .setColor(PlrJson.response.players[0].gameid != undefined ? "#7da10e" : (PlrJson.response.players[0].personastate != 0 ? "#00adee" : "#99aab5"))
                .setTimestamp()
                .setThumbnail(PlrJson.response.players[0].avatarfull)
                .addField("Steam Information Information",
                    `Name: ${PlrJson.response.players[0].personaname}`
                    + `\nCreation Date: ${PlrJson.response.players[0].timecreated != undefined ? `${moment.unix(PlrJson.response.players[0].timecreated).format("MM/DD/YYYY")}` : "Private"}`
                    + `\nLast Online: ${PlrJson.response.players[0].lastlogoff != undefined ? moment.unix(PlrJson.response.players[0].lastlogoff).format("MM/DD/YYYY") : "Private"}`)
                .setFooter("Information generated using Steam web API");

            fetch(`https://api.steampowered.com/ISteamUser/GetPlayerBans/v1/?key=${config.SteamAIPKey}&steamids=${Value}`)
                .then(res => res.json())
                .then(BansJson => {
                    InfoEmbed.addField("Player  Bans", `Vac Bans: ${BansJson.players[0].NumberOfVACBans}`
                        + `\nGame Bans: ${BansJson.players[0].NumberOfGameBans}`
                        + `\nTime since last ban: ${BansJson.players[0].DaysSinceLastBan}`)

                        InfoEmbed.addField("Watcher Info", `Added By: ${WatcherObject.AddedBy}`
                        + `\nReason: ${WatcherObject.Reason}`)
        
                    message.channel.send(InfoEmbed);
                })
        })
}

// #endregion

function DBCheck(Value, DB, callback) {
    watchcon.query(`SELECT * FROM ${DB} WHERE Value = ?`, [Value], function (err, check) {
        if (!check || check.length < 1) return callback(false);
        else return callback(true);
    })
}
