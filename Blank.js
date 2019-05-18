const Discord = require("discord.js");
const utils = require("../utilities/utils.js");
const base = require("../utilities/basebot.js")
const dscp = require("../utilities/dscpcmds.js")
const config = require("../config.json");
const moment = require("moment");
const fs = require("fs");

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
  name: "userinfo",
  aliases: ["userinfo", "uinfo", "useri"],
  info: "",
  type: "info, mod, general or test"
}