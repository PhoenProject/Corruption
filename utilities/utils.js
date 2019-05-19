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

module.exports.Embed = (message, cmdused, perm, desc, hArgs, sqlcon) => {
    sqlcon.query(`SELECT * FROM guildprefs WHERE GuildID = '${message.guild.id}'`, (err, rows) => {
        if (err) bot.console(err)
            let Bot = message.guild.members.get(member => member.id === client.user.id)
        const embed = new Discord.RichEmbed()
            .setAuthor(`Corruption Bot help module`)
            .setColor(message.member.displayHexColor)
            .setColor(Bot.displayHexColor)
            .setFooter(`Do ${rows[0].Prefix}help for more information`)
            .setTimestamp()
            .setDescription(`${rows[0].Prefix}${cmdused} ${hArgs}`)
            .addField("Description", `${desc}`)
        message.channel.send(embed)
    })
}
module.exports.CatchError = (message, error, cmdused) => {
    message.channel.send(`Sorry, but i was unable to execute that command due to an error! ${error}`)
    console.log(`[${moment().format('YYYY MM DD HH:ss')}] ${message.author} attempted to use ${cmdused} but errored due to ${error}`)
}