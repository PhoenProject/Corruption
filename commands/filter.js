const Discord = require("discord.js");
const config = require("../config.json");
const utils = require('../utilities/utils.js');
const base = require('../utilities/basebot.js');
const dscp = require('../utilities/dscpcmds.js');
const autow = require('../utilities/autowarning.js');
const mbot = require('../utilities/modbot.js');
const stats = require('../utilities/stattrack.js');
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
        if (message.member.hasPermission("ADMINISTRATOR") || message.member.roles.find(role => role.id === rows[0].AdminRole)) {
            if (args[0] == "global") {
                if (args[1] == "enable") {
                    if (rows[0].GlobalFilter == true) return message.channel.send("Global filter list is already enabled!")
                    if (rows[0].GlobalFilter == false) { 
                        sqlcon.query(`UPDATE guildprefs SET GlobalFilter = '1' WHERE GuildID = '${message.guild.id}'`)
                        message.channel.send("Global filter list has been enabled!") 
                    }
                }
                if (args[1] == "disable") {
                    if (rows[0].GlobalFilter == false) return message.channel.send("Global filter list is already disabled!")
                    if (rows[0].GlobalFilter == true) { 
                        sqlcon.query(`UPDATE guildprefs SET GlobalFilter = '0' WHERE GuildID = '${message.guild.id}'`)
                        message.channel.send("Global filter list has been disable!") 
                    }
                }

            }
        }
    })
}
module.exports.config = {
    name: "filter",
    aliases: ["filter"],
    info: "Checks the message content to see if it contains a banned word",
    type: "mod"
}