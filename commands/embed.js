const Discord = require("discord.js");
const utils = require("../utilities/utils.js");
const base = require("../utilities/basebot.js")
const dscp = require("../utilities/dscpcmds.js")
const config = require("../config.json");
const moment = require("moment");
const fs = require("fs");

module.exports.run = async (client, message, args, sqlcon) => {
  let ID = message.content.slice(7)
  let warnEmbed = new Discord.RichEmbed()
    .setAuthor("Test Embed")
    .setColor(message.member.displayHexColor)
    .addField(`SteamID`, `[${ID}](https://steamcommunity.com/profiles/${ID})`);
  message.channel.send(warnEmbed);
}
module.exports.config = {
  name: "embed",
  aliases: ["embed"],
  info: "Test command. Ignore!",
  type: "test"
}