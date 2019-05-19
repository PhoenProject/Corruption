const Discord = require("discord.js");
const config = require("./config.json");
const utils = require('./utilities/utils.js');
const base = require('./utilities/basebot.js');
const dscp = require('./utilities/dscpcmds.js');
const autow = require('./utilities/autowarning.js');
const mbot = require('./utilities/modbot.js');
const stats = require('./utilities/stattrack.js');
const moment = require("moment");
const shell = require('shelljs');
const fs = require("fs");
const mysql = require("mysql");
const { exec } = require("child_process");
const { inspect } = require('util');
const SteamAPI = require('steamapi');
const bot = require('../CorruptionBot.js')

module.exports.run = async (client, message, args, sqlcon) => {
    sqlcon.query(`SELECT * FROM guildprefs WHERE GuildID = '${message.guild.id}'`, (err, rows) => {
        if (err) bot.console(err)
        let wUser = message.guild.member(message.mentions.users.first()) || message.guild.members.get(args[0]) || message.author.id
        sqlcon.query(`SELECT * FROM warnsnew WHERE UserID = '${wUser.id}' AND GuildID = '${message.guild.id}'`, (err, warnings) => {
            if (err) bot.console(err)

            if (warnings.length < 1) {
                message.channel.send("That user has no warns!")
            }
            else {
                let wMember = message.guild.members.find(member => member.id === wUser.id)

                let warnEmbed = new Discord.RichEmbed()
                    .setAuthor(`Warnings for ${wMember.user.tag}`, wMember.user.avatarURL)
                    .setColor(wMember.displayHexColor)
                    .setFooter(`UserID: ${wUser.id}`)
                    .setTimestamp()
                    .setThumbnail(wMember.user.avatarURL);
                (warnings).forEach(element => {
                    warnEmbed.addField(`Warn ${element.Count} of ${warnings.length}`,
                        `Issued by <@${element.Issuer}>`
                        + `\n**Issue Time:** ${element.Timestamp}`
                        + `\nReason: ${element.Reason}`
                        + `\n[Link to warning](https://discordapp.com/channels/${element.GuildID}/${element.ChannelID}/${element.MessageID})`)
                });
                message.channel.send(warnEmbed)
            }
        })
    })
}
module.exports.config = {
    name: "listwarns",
    aliases: ["lw", "warns"],
    info: "Lists a user's warns",
    type: "general"
}