const Discord = require("discord.js");
const mysql = require("mysql");
const utils = require("./utils.js");
const moment = require("moment");
const fetch = require('node-fetch');
const SteamAPI = require('steamapi');
const config = require("../config.json");
const bot = require('../CorruptionBot.js')
const steam = new SteamAPI(config.SteamAIPKey);

var sqlcon = mysql.createConnection({
    host: config.SBhost,
    user: config.SBuser,
    password: config.SBpassword,
    database: config.SBdatabase,
    charset: 'utf8mb4'
});
sqlcon.connect(err => {
    if (err) utils.ConsoleMessage(err, client)
    console.log("Connected To Database");
})
sqlcon.on('error', error => {
    if (error.code === 'PROTOCOL_CONNECTION_LOST') {
        sqlcon = mysql.createConnection({
            host: config.SBhost,
            user: config.SBuser,
            password: config.SBpassword,
            database: config.SBdatabase,
            charset: 'utf8mb4'
        });
    } else console.log(error)
})

module.exports.main = (client, message) => {
    let args = message.content.toLowerCase().split(' ')

    if (!args[1]) {
        sqlcon.query(`SELECT * FROM playerstats WHERE DiscordID = '${message.author.id}'`, (err, results) => {
            if (results == undefined || results[0] == undefined || results.size < 1) {
                message.reply("You have not linked your Dicsord account to a SteamID64. Please use `?stats link` to create the link")
            }
            else if (results.size = 1) {
                try {
                    let name = message.member.nickname
                    if (message.member.nickname == null) name = message.author.username
                    sqlcon.query(`UPDATE playerstats SET Name = '${name.replace(/'/g, "~~")}' WHERE DiscordID = '${message.author.id}'`)
                    StatMessage(sqlcon, message, client, results)
                }
                catch (err) {
                        message.channel.send(`There has been an error getting your stats: ${err}`)
                    }
                }
        })
    }
    else if (args[1] === "link") {
        if (!args[2]) message.reply("You need to state your SteamID64")
        else if (args[2].length != 17) message.reply("That is an invalid SteamID64")
        else if (args[2].length == 17) {
            sqlcon.query(`SELECT * FROM playerstats WHERE SteamID = '${args[2]}'`, (err, SteamIDCheck) => {
                if (SteamIDCheck == undefined || SteamIDCheck[0] == undefined) {
                    message.reply("I was unable to find that SteamID64 on the database. Please make sure that you have played on our servers atleast once!")
                }
                else {
                    if (SteamIDCheck[0].DiscordID == '') {
                        try {
                            let name = message.member.nickname.replace(/'/g, "~~")
                            if (message.member.nickname == null) name = message.author.username.replace(/'/g, "~~")
                            sqlcon.query(`UPDATE playerstats SET DiscordID = '${message.author.id}', Name = '${name}' WHERE SteamID = '${args[2]}'`)
                            message.reply("You have sucessfully linked your Discord to your SteamID64")
                        }
                        catch (err) {
                            message.channel.send(`There has been an error linking your accounts: ${err}`)
                        }
                    }
                    else {
                        message.reply("That SteamID has already been linked up!")
                    }
                }
            })
        }
    }
    else {
        let Search = args.slice(1).join(' ')
        SearchName(sqlcon, message, client, Search)
    }
}

async function SearchName(sqlcon, message, client, Search) {
    sqlcon.query(`SELECT * FROM playerstats WHERE Name = '${Search}'`, (err, results) => {
        if (results[0] == undefined || results.size < 1) {
            SearchSteamName(sqlcon, message, client, Search)
        }
        else StatMessage(sqlcon, message, client, results)
    })
}
async function SearchSteamName(sqlcon, message, client, Search) {
    sqlcon.query(`SELECT * FROM playerstats WHERE SteamName = '${Search}'`, (err, results) => {
        if (results[0] == undefined || results.size < 1) {
            SearchSteamID(sqlcon, message, client, Search)
        }
        else StatMessage(sqlcon, message, client, results)
    })
}
async function SearchSteamID(sqlcon, message, client, Search) {
    sqlcon.query(`SELECT * FROM playerstats WHERE SteamID = '${Search}'`, (err, results) => {
        if (results[0] == undefined || results.size < 1) {
            SearchDiscordID(sqlcon, message, client, Search)
        }
        else StatMessage(sqlcon, message, client, results)
    })
}
async function SearchDiscordID(sqlcon, message, client, Search) {
    sqlcon.query(`SELECT * FROM playerstats WHERE DiscordID = '${Search}'`, (err, results) => {
        if (results[0] == undefined || results.size < 1) {
            message.channel.send("I was unable to find that user!")
        }
        else StatMessage(sqlcon, message, client, results)
    })
}


async function StatMessage(sqlcon, message, client, results) {
    if (results[0].DNT == 0) {
        message.channel.startTyping()
        setTimeout(function () {
            let StatEmbed = new Discord.RichEmbed()
                .setDescription(`**Steam:** [${results[0].SteamName}](https://steamcommunity.com/profiles/${results[0].SteamID}) (${results[0].SteamID})`
                    + `\n**Discord:** ${results[0].Name.replace(/~~/g, "'")} (${results[0].DiscordID})`)
                .addField("Playtime", parseInt(results[0].PlayTime, 0) + " minutes"
                    + "\n(" + (parseFloat(results[0].PlayTime, 0) / 60).toFixed(2) + " hours)")
                .addField("Deaths", `${results[0].Deaths}`
                    + `\nLast killed by:\n${results[0].Killer}`, true)
                .addField("Suicides", results[0].Suicides, true)
                .addField("Kills", results[0].Kills
                    + `\nLast killed:\n` + results[0].PlayerKilled, true)
                .addField("TeamKills", results[0].TeamKills, true)


            steam.getUserSummary(results[0].SteamID).then(summary => {
                StatEmbed.setThumbnail(summary.avatar.large)
                StatEmbed.setTitle(`${results[0].SteamName} (${results[0].Name})`, summary.avatar.small)

                if (summary.gameID != undefined) {
                    StatEmbed.setColor('#7da10e')
                }
                else if (summary.gameID == undefined) {
                    StatEmbed.setColor('00adee')
                }
            })

            setTimeout(function () {
                message.channel.send(StatEmbed)
                message.channel.stopTyping()
            }, 1000)
        }, 500)
    }
    else if (results[0].DNT == 1) {
        let StatEmbed = new Discord.RichEmbed()
            .setTitle("Do Not Track")
            .setDescription("You have an active DNT flag, thus gameplay statistics are unavailable"
                + "\nTo remove the flag, please remove -dnt from your SCP:SL launch options")
            .setFooter(`DragonSCP Stat Tracker`)

        setTimeout(function () {
            message.channel.send(StatEmbed)
            message.channel.stopTyping()
        }, 1000)
    }

}