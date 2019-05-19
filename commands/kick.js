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
    if (message.member.roles.find(role => role.id === rows[0].ModRole) || message.member.roles.find(role => role.id === rows[0].AdminRole) || message.member.hasPermission("ADMINISTRATOR")) {
      let cmdused = "kick"
      let perm = "KICK_MEMBERS"
      let hArgs = "<user> <reason>"
      let desc = "Kicks a user from the server."
      let member = message.mentions.members.first();
      if (member.roles.find(role => role.id === rows[0].ModRole) || member.roles.find(role => role.id === rows[0].AdminRole) || member.hasPermission("ADMINISTRATOR") || !member)
        return utils.Embed(message, cmdused, perm, desc, hArgs, sqlcon);
      else if (member.hasPermission(perm)) {
        message.channel.send("I am unable to let you kick this user!")
      }
      else if (!member.kickable) {
        return message.reply("I'm sorry, i can't let you do that...\nMake sure i have the required permissions")
      }
      else {
        let reason = args.slice(1).join(' ');
        if (!reason) reason = "No reason provided";

        member.send(`You have been kicked from ${message.guild.name} for ${reason}`)
        setTimeout(function () {
          member.kick(reason).catch(error => { utils.CatchError(message, error, cmdused) });

          message.channel.send(`That user has been kicked from the server!`)
        }, 500)
      }
    }
  })
}
module.exports.config = {
  name: "kick",
  aliases: ["kick"],
  info: "Kicks a user from your discord server",
  type: "mod"
}