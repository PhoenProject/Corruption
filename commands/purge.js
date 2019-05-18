const Discord = require("discord.js");
const utils = require("../utilities/utils.js");
const base = require("../utilities/basebot.js")
const dscp = require("../utilities/dscpcmds.js")
const config = require("../config.json");
const moment = require("moment");
const fs = require("fs");

async function DeletionHandler(message, args, cmdused) {
  var x = parseInt(args[0], 10);
  if (x <= 100) { message.channel.bulkDelete(x+ 1).catch(error => { utils.CatchError(message, error, cmdused) });
  }
}

module.exports.run = async (client, message, args, sqlcon) => {
  sqlcon.query(`SELECT * FROM guildprefs WHERE GuildID = '${message.guild.id}'`, (err, rows) => {
    if (err) utils.Console(err)
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