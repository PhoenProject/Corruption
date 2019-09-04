const discord = require("discord.js");
const mysql = require("mysql");
const config = require("../config.json");
const fetch = require("node-fetch");
const moment = require("moment");
const geoip = require("geoip-lite");

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
        let mName = message.author.username;
        let Value = mArgs[1];

        switch (mArgs[0]) {

            //#region Addition
            case "?widadd":
                AddToDataBase(message, mArgs, mName, Value, "uid");
                break;
            case "?wgipadd":
                AddToDataBase(message, mArgs, mName, Value, "game_ip");
                setTimeout(function () {
                    message.channel.bulkDelete(1);
                    AddToDataBase(message, mArgs, mName, Value, "auth_ip");
                }, 150)
                break;
            case "?wauthadd":
                AddToDataBase(message, mArgs, mName, Value, "auth_ip");
                break;
            //#endregion

            //#region Deletion commands
            case "?widdel":
                DelFromDataBase(message, mArgs, Value, "uid");
                break;
            case "?wgipdel":
                DelFromDataBase(message, mArgs, Value, "game_ip");
                break;
            case "?wauthdel":
                DelFromDataBase(message, mArgs, Value, "auth_ip");
                break;
            //#endregion

            //#region Update commands
            case "?widupdate":
                UpdateDateBase(message, mArgs, Value, "uid");
                break;
            case "?wgipupdate":
                UpdateDateBase(message, mArgs, Value, "game_ip");
                break;
            case "?wauthupdate":
                UpdateDateBase(message, mArgs, Value, "auth_ip");
                break;
            //#endregion

            //#region Info commands
            case "?widinfo":
                GetInfo(message, mArgs, Value, "uid")
                break;
            case "?wgipinfo":
                GetInfo(message, mArgs, Value, "game_ip")
                break;
            case "?wauthinfo":
                GetInfo(message, mArgs, Value, "auth_ip")
                break;
            //#endregion

            case "?wasnadd":
                ASNCheckDB(message, mArgs, Value)
                break;

            default:
                break;
        }
    }
}

function AddToDataBase(message, mArgs, mName, Value, DB) {
    message.delete().catch(O_o => { });

    if (!mArgs[1]) return message.reply("you need to state an IP/ID >:(");
    if (!mArgs[2]) return message.reply("you need to state a reason >:(");

    let Reason = mArgs.slice(2).join(' ');

    //Checks if the data is valid
    CheckIsValid(Value, DB, function (isValid) {

        if (isValid != true) return message.channel.send(isValid);

        //Checks if the data already exists in the database
        CheckDB(Value, DB, function (doesExist) {
            if (doesExist) return message.channel.send("That user already exists!");

            watchcon.query(`INSERT INTO ${DB} (Value, Reason, AddedBy) VALUES (?, ?, ?)`, [Value, Reason, mName]);
            setTimeout(function () {
                watchcon.query(`SELECT * FROM ${DB} WHERE Value = ?`, [Value], (err, rows) => {
                    if (err) return message.channel.send("There was an error adding that user to the database! " + err);
                    else if (!rows || rows.length < 1) return message.channel.send("I encountered an error when validating the addition!\nGo ree at <@124241068727336963>");
                    else return message.channel.send(`Sucessfully added ||${Value}|| to the database!`);
                })
            }, 300)
        })
    })

}
function DelFromDataBase(message, mArgs, Value, DB) {
    message.delete();

    if (!mArgs[1]) return message.reply("you need to state an IP/ID >:(");

    //Checks if the data is valid
    CheckIsValid(Value, DB, function (isValid) {

        if (isValid != true) return message.channel.send(isValid);

        //Checks if the data already exists in the database
        CheckDB(Value, DB, function (doesExist) {
            if (!doesExist) return message.channel.send("That user does not exist!");

            watchcon.query(`DELETE FROM ${DB} WHERE Value = ?`, [Value]);
            setTimeout(function () {
                watchcon.query(`SELECT * FROM ${DB} WHERE Value = ?`, [Value], (err, rows) => {
                    if (err) return message.channel.send("There was an error removing that user from the database! " + err);
                    else if (!rows || rows.length < 1) return message.channel.send(`Sucessfully removed ||${Value}|| from the database!`);
                    else return message.channel.send("I encountered an error when validating the removal!\nGo ree at <@124241068727336963>");
                })
            }, 300)
        })
    })
}

function UpdateDateBase(message, mArgs, Value, DB) {
    message.delete();

    if (!mArgs[1]) return message.reply("you need to state an IP/ID >:(");
    if (!mArgs[2]) return message.reply("you need to state a reason >:(");

    let Reason = mArgs.slice(2).join(' ');

    //Checks if the data is valid
    CheckIsValid(Value, DB, function (isValid) {
        if (isValid != true) return message.channel.send(isValid);

        //Checks if the data already exists in the database
        CheckDB(Value, DB, function (doesExist) {
            if (doesExist == false) return message.channel.send("That user does not exist!");

            watchcon.query(`UPDATE ${DB} SET Reason = ? WHERE Value = ?`, [Reason, Value]);
            setTimeout(function () {
                watchcon.query(`SELECT * FROM ${DB} WHERE Value = ?`, [Value], (err, rows) => {
                    if (err) return message.channel.send("There was an error updating that user on the database! " + err);
                    else if (!rows || rows.length < 1) return message.channel.send("I encountered an error when validating the update!\nGo ree at <@124241068727336963>");
                    else message.channel.send(`Sucessfully updated ||${Value}|| on the database!`);
                })
            }, 300)
        });
    });
}
function GetInfo(message, mArgs, Value, DB) {
    message.delete();

    if (!mArgs[1]) return message.reply("you need to state an IP/ID >:(");

    //Checks if the data is valid
    var isValid = CheckIsValid(Value, DB);
    if (isValid != true) return message.channel.send(isValid);

    //Checks if the data already exists in the database
    var doesExist = CheckDB(Value, DB);
    if (doesExist == false) return message.channel.send("That user does not exist!");

    if (DB === "uid") GetSteamData(message, Value, DB);
    else if (DB === "game_ip" || DB === "auth_ip"); GetIPData(message, Value, DB, DataObject)
}

function SendEmbed(message, Value, DB, DataObject) {
    let DataEmbed = new discord.RichEmbed()
    if (DataObject.Type == "Steam") {

        DataEmbed.setAuthor(DataObject.Name, DataObject.Thumbnail, DataObject.URL)
        DataEmbed.setThumbnail(DataObject.Thumbnail)
        DataEmbed.setDescription(DataObject.Description)
        DataEmbed.setColor(DataObject.Embedcolour)
        DataEmbed.addField("Steam Data", `SteamID: ${DataObject.SteamID}`
            + `\nCreation date: ${DataObject.Created}`
            + `\nLast logged off: ${DataObject.Logoff}`)
        DataEmbed.addField("Ban Data", `VAC bans: ${DataObject.VacBans}`
            + `\nGame bans: ${DataObject.GameBans}`
            + `\nDays since last ban: ${DataObject.SinceLastBan}`)
        DataEmbed.addField("Watcher Data", `Added by: ${DataObject.AddedBy}`
            + `\nReason: ${DataObject.Reason}`)
        DataEmbed.setFooter("Information generated via the Steam web API");
    }
    else if (DataObject.Type == "IP") {
        DataEmbed.setAuthor("IP info for " + DataObject.IP)
        DataEmbed.setThumbnail(`https://www.countryflags.io/${DataObject.CountryCode}/flat/64.png`)
        DataEmbed.addField("IP Data", `City: ${DataObject.City}`
            + `\nRegion: ${DataObject.Region}`
            + `\nCountry: ${DataObject.Country} (${DataObject.CountryCode})`
            + `\nASN: ${DataObject.ASN} (${DataObject.Org})`)
        DataEmbed.addField("Watcher Data", `Added by: ${DataObject.AddedBy}`
            + `\nReason: ${DataObject.Reason}`)
        DataEmbed.setFooter("Information generated using `https://ipapi.co/`");
    }
    message.channel.send(DataEmbed);
}

//#region General data functions
function CheckIsValid(Value, DB, callback) {
    if (DB === "uid") {
        let Result = fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${config.SteamAIPKey}&steamids=${Value}`)
            .then(res => res.json())
            .then(json => {
                if (!JSON.stringify(json).includes(`,"communityvisibilitystate"`)) return callback("That is an invalid SteamID");
                else return callback(true);
            })
    }
    else {
        var ipLookup = geoip.lookup(Value);
        if (ipLookup == null) return callback("That is an invalid IP");
        else return callback(true)
    }

    return
}
function CheckDB(Value, DB, callback) {
    watchcon.query(`SELECT * FROM ${DB} WHERE Value = ?`, [Value], function (err, check) {
        if (!check || check.length < 1) return callback(false);
        else return callback(true);
    })
}
function GetDBData(message, Value, DB, DataObject) {
    watchcon.query(`SELECT * FROM ${DB} WHERE Value = ?`, [Value], (err, check) => {
        if (!check || check.length < 1) return
        else {
            DataObject.AddedBy = check[0].AddedBy;
            DataObject.Reason = check[0].Reason;

            SendEmbed(message, Value, DB, DataObject);
        }
    })
}
function GetSteamData(message, Value, DB) {
    let DataObject = new Object();
    DataObject.Type = "Steam";
    fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${config.SteamAIPKey}&steamids=${Value}`)
        .then(res => res.json())
        .then(json => {
            DataObject.SteamID = json.response.players[0].steamid;
            DataObject.URL = json.response.players[0].profileurl;
            DataObject.Name = json.response.players[0].personaname;
            DataObject.Thumbnail = json.response.players[0].avatarfull;
            DataObject.Footer = "Data generated via the Steam web API"

            if (json.response.players[0].communityvisibilitystate == 1 || json.response.players[0].communityvisibilitystate == 2) {
                DataObject.Description = "User's profile is set to private or friends only!"
                DataObject.Created = "Private";
                DataObject.Logoff = "Private";
                DataObject.Embedcolour = "#800000";
            }
            else {
                DataObject.Created = moment.unix(json.response.players[0].timecreated).format("MM/DD/YYYY");
                DataObject.Logoff = moment.unix(json.response.players[0].lastlogoff).format("MM/DD/YYYY");

                if (json.response.players[0].gameid != undefined) {
                    DataObject.Embedcolour = "#7da10e";
                    DataObject.Description = `Currently ingame: ${json.response.players[0].gameextrainfo} (${json.response.players[0].gameid})`;
                }
                else {
                    if (json.response.players[0].personastate != 0) {
                        DataObject.Embedcolour = "#00adee";
                        DataObject.Description = `Currently online`;
                    }
                    else {
                        DataObject.Embedcolour = "#99aab5";
                        DataObject.Description = `Currently offline`;
                    }

                    fetch(`https://api.steampowered.com/ISteamUser/GetPlayerBans/v1/?key=${config.SteamAIPKey}&steamids=${Value}`)
                        .then(res => res.json())
                        .then(json => {
                            DataObject.VacBans = json.players[0].NumberOfVACBans;
                            DataObject.GameBans = json.players[0].NumberOfGameBans;
                            DataObject.SinceLastBan = json.players[0].DaysSinceLastBan;

                            GetDBData(message, Value, DB, DataObject);
                        })
                }
            }
        })
}
function GetIPData(message, Value, DB) {
    DataObject.Type = "IP";
    fetch(`https://ipapi.co/${Value}/json/`)
        .then(res => res.json())
        .then(json => {
            DataObject.IP = json.ip;
            DataObject.City = json.city;
            DataObject.Region = json.region;
            DataObject.Country = json.country_name;
            DataObject.CountryCode = json.country;
            DataObject.ASN = json.asn;
            DataObject.Org = json.org;

            GetDBData(message, Value, DB, DataObject);
        })
}
//#endregion

//#region ASN functions
//#region Add ASN
function ASNCheckDB(message, mArgs, Value) {
    watchcon.query(`SELECT * FROM asn_whitelist WHERE Auth = ? AND Game = ?`, [Value, mArgs[2]], (err, check) => {
        if (!check || check.length < 1) AddASN(message, mArgs, Value);
        else {
            message.channel.send("That ASN is already in the database");
            message.delete();
        }
    })
}
function AddASN(message, mArgs, Value) {
    watchcon.query(`INSERT INTO asn_whitelist (Auth, Game) VALUES (?, ?)`, [Value, mArgs[2]]);
    setTimeout(function () {
        watchcon.query(`SELECT * FROM asn_whitelist WHERE Auth = ? AND Game = ?`, [Value, mArgs[2]], (err, rows) => {
            message.delete();
            if (err) return message.channel.send("There was an error adding that user to the database! " + err);
            else if (!rows || rows.length < 1) return message.channel.send("I encountered an error when validating the addition!\nGo ree at <@124241068727336963>");
            else return message.channel.send(`Sucessfully added to the database!\nAuth as ||${Value}|| and Game as ||${mArgs[2]}||`);
        })
    }, 300)
}
//#endregion

//#region Del ASN