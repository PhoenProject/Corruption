const Discord = require("discord.js");
const utils = require("../utilities/utils.js");
const base = require("../utilities/basebot.js")
const dscp = require("../utilities/dscpcmds.js")
const config = require("../config.json");
const moment = require("moment");
const fs = require("fs");

module.exports.run = async (client, message, args, sqlcon) => {
    sqlcon.query(`SELECT * FROM guildprefs WHERE GuildID = '${message.guild.id}'`, (err, rows) => {
        if (err) throw err
        console.log(args[0])
        if (message.member.hasPermission("ADMINISTRATOR") || message.member.roles.find(role => role.id === rows[0].AdminEole)) {
            if (args[0] === "enable") {
                sqlcon.query(`SELECT * FROM chanprefs WHERE ChannelID = '${message.channel.id}'`, (err, status) => {
                    console.log(status[0].MsgVote)
                    if (status[0].MsgVote === "false") {
                        sqlcon.query(`UPDATE chanprefs SET MsgVote = 'true' WHERE ChannelID = '${message.channel.id}'`)
                        message.channel.send("Message voting has been enabled in this channel")
                    }
                    else if (status[0].MsgVote === "true") {
                        message.channel.send("Message voting is already enabled in this channel")
                    }
                })
            }
            else if (args[0] === "disable") {
                sqlcon.query(`SELECT * FROM chanprefs WHERE ChannelID = '${message.channel.id}'`, (err, status) => {
                    if (status[0].MsgVote === 'true') {
                        sqlcon.query(`UPDATE chanprefs SET MsgVote = 'false' WHERE ChannelID = '${message.channel.id}'`)
                        message.channel.send("Message voting has been disnabled in this channel")
                    }
                    else if (status[0].MsgVote === 'false') {
                        message.channel.send("Message voting is already disabled in this channel")
                    }
                })
            }
            else if (args[0] === "upvote") {
                message.channel.send("This command is currently being worked on, sorry!")
            }
            else if (args[0] === "downvote") {
                message.channel.send("This command is currently being worked on, sorry!")
            }
            else {
                let gPrefix = prefixes[message.guild.id].prefix
                let msgvoteemd = new Discord.RichEmbed()
                    .setAuthor("Corruption bot message voting", client.user.avatarURL)
                    .setDescription("Changes the message voting settings")
                    .addField("**__Commands:__**", "**enable** - Enables the message voting in this channel"
                        + "\n**disable** - Disables the message voting in this channel"
                        + "\n**upvote** - Chanes the upvote emoji"
                        + "\n**downvote** - Changes the downvote emoji")
                    .setFooter(`Do ${gPrefix}help for help with commands`)
                    .setTimestamp()
                    .setColor(message.member.displayHexColor)
                message.channel.send(msgvoteemd)
            }
        }
    })
}
module.exports.config = {
    name: "msgvote",
    aliases: ["messagevoting", "voting", "mvote"],
    info: "Changes the settings for message voting",
    type: "mod"
}