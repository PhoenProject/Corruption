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
  let cmdused = "" //Name of the command
  let perm = "" //Permission required for the command
  let hArgs = "" //Additional arguments to display in the help embed
  let desc = "" //Description of the command for the help embed
  sqlcon.query(`SELECT * FROM guildprefs WHERE GuildID = '${message.guild.id}'`, (err, rows) => {
    if (err) utils.Console(err)

  })
}
module.exports.config = {
  name: "",
  aliases: [""],
  info: "",
  type: "info, mod, general or test"
}