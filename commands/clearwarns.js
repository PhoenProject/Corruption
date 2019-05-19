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

async function ClearWarnEffects(message, wUser, sqlcon, cmdused) {
    sqlcon.query(`SELECT * FROM warnsnew WHERE UserID = '${message.mentions.users.first().id}' AND GuildID = '${message.guild.id}'`, (err, WarnCount) => {
        let wRole = message.guild.roles.find(role => role.name === "Warned")
        let mRole = message.guild.roles.find(role => role.name === "Muted")

        if (wUser.roles.find(role => role.id === wRole.id)) {
            wUser.removeRole(wRole).catch(error => { utils.CatchError(message, error, cmdused) });
        }
        if (wUser.roles.find(role => role.id === mRole.id)) {
            wUser.removeRole(mRole).catch(error => { utils.CatchError(message, error, cmdused) });
            message.channel.send("User has been unmuted!")
        }
    })
}
async function ClearWarns(message, wUser, sqlcon) {
    sqlcon.query(`SELECT * FROM warnsnew WHERE UserID = '${message.mentions.users.first().id}' AND GuildID = '${message.guild.id}'`, (err, WarnCount) => {
        if (WarnCount.length < 1) {
            message.channel.send("That user has no warnings!")
        }
        else {
            sqlcon.query(`DELETE FROM warnsnew WHERE UserID = '${wUser.id}' AND GuildID = '${message.guild.id}'`)
            setTimeout(() => {
                message.channel.send(`Warns for ${wUser} have been cleared!`)
            }, 150);
        }
    })
}

module.exports.run = async (client, message, args, sqlcon) => {
    let cmdused = "clearwarns"
    let perm = "BAN_MEMBERS"
    let desc = "Clears all warns for a specified user."
    let hArgs = "<user>"
    let wMember = message.guild.member(message.mentions.users.first()) || message.guild.members.get(args[0])
    sqlcon.query(`SELECT * FROM guildprefs WHERE GuildID = '${message.guild.id}'`, (err, rows) => {
        if (err) bot.console(err) 
        if (message.member.hasPermission("ADMINISTRATOR") || message.member.roles.find(role => role.id === rows[0].AdminRole)) {
            if (!message.member.hasPermission(perm) || !wMember || args[0] === "help") return utils.Embed(message, cmdused, perm, desc, hArgs, sqlcon);
        }
    })
    ClearWarns(message, wMember, sqlcon)

    setTimeout(function () {
        ClearWarnEffects(message, wMember, sqlcon, cmdused)
    }, 200)

}
module.exports.config = {
    name: "clearwarns",
    aliases: ["cw", "clearw"],
    info: "Removes all warns from a user",
    type: "mod"
}