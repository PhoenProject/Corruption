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

async function DeletionHandler(message, args, cmdused) {
  var x = parseInt(args[0], 10);
  if (x <= 100) { message.channel.bulkDelete(x+ 1).catch(error => { utils.CatchError(message, error, cmdused) });
  }
}

module.exports.run = async (client, message, args, sqlcon) => {
  sqlcon.query(`SELECT * FROM guildprefs WHERE GuildID = '${message.guild.id}'`, (err, rows) => {
    if (err) bot.console(err)
    if (message.member.roles.find(role => role.id === rows[0].ModRole) || message.member.roles.find(role => role.id === rows[0].AdminRole) || message.member.hasPermission("ADMINISTRATOR")) {
      let cmdused = "purge"
      let perm = "MANAGE_MESSAGES"
      let hArgs = "<Quantity>"
      let desc = "Deletes the specified amount of messages in this channel. Value must be between 2 and 99"
      if (!args[0] || args[0] < 2 || args[0] > 99) return utils.Embed(message, cmdused, perm, desc, hArgs, sqlcon);

      DeletionHandler(message, args, cmdused)
    }
  })
}
module.exports.config = {
  name: "purge",
  aliases: ["cleanup", "delete", "prune"],
  info: "Deletes previous messages in the channel",
  type: "mod"
}