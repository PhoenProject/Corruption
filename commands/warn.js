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

/*
  Sort out a better warning system that includes automatic removal of the warned role after 2 weeks.
  MySQL Database Table

  Name - Name of user
  ID - ID of user
  Count - Warn number
  Reason - Reason for warn
  Issuer - Who did the warn
  GuildID - GuildID of the warn
  ChannelID - ChannelID of where the warn was
  MessageID - MessageID of the warn
  Timestamp - Time it was issued
*/

async function AddWarn(message, member, reason, sqlcon) {
  sqlcon.query(`SELECT * FROM warnsnew WHERE UserID = '${message.mentions.users.first().id}' AND GuildID = '${message.guild.id}'`, (err, row) => {
    let sqlreason = reason.replace(`'`, '~')
    if (row.length < 1) {
      issueTime = moment(Date.now()).format('DD MMM YYYY, HH:mm')
      sqlcon.query(`INSERT INTO warnsnew (GuildID, UserID, Count, Reason, Timestamp, Issuer, ChannelID, MessageID) VALUES
      ('${message.guild.id}', '${message.mentions.users.first().id}', '1', '${sqlreason}', '${issueTime}', '${message.author.id}', '${message.channel.id}', '${message.id}')`)
    }
    else {
      issueTime = moment(Date.now()).format('DD MMM YYYY, HH:mm')
      sqlcon.query(`INSERT INTO warnsnew (GuildID, UserID, Count, Reason, Timestamp, Issuer, ChannelID, MessageID) VALUES
      ('${message.guild.id}', '${message.mentions.users.first().id}', '${row.length + 1}', '${sqlreason}', '${issueTime}', '${message.author.id}', '${message.channel.id}', '${message.id}')`)
    }
  })
}
async function WarnMessage(message, member, reason, sqlcon) {
  sqlcon.query(`SELECT * FROM warnsnew WHERE UserID = '${message.mentions.users.first().id}' AND GuildID = '${message.guild.id}'`, (err, warnCount) => {
    let warnEmbed = new Discord.RichEmbed()
      .setAuthor(`Warn issued for ${member.user.tag}`, member.user.avatarURL)
      .setColor(member.displayHexColor)
      .setFooter(`UserID: ${member.user.id}`)
      .setTimestamp()
      .setThumbnail(member.user.avatarURL)
      .addField(`Warning:`,
        `Issued by ${message.author}`
        + `\n**Issue Time:** ${moment(Date.now()).format('DD MMM YYYY, HH:mm')}`
        + `\nReason: ${reason}`
        + `\n[Link to warning](https://discordapp.com/channels/${message.guild.id}/${message.channel.id}/${message.id})`);
    let warnchannel = message.guild.channels.find((channel => channel.name === "mod-actions"));
    if (!warnchannel) {
      message.reply("I was unable to find a #mod-actions channel, so i will post it here.");
      message.channel.send(warnEmbed);
      member.send(warnEmbed);
    }
    else {
      message.channel.send(`${member} has been warned, with a total of ${warnCount.length} warns.`);
      warnchannel.send(warnEmbed).catch(error => {
        message.reply("I was unable to type in #mod-actions, so i will post it here.");
        message.channel.send(warnEmbed);
      });

      member.send(warnEmbed);
    };
  })
}
async function HandleWarns(message, member, reason, sqlcon, cmdused) {
  sqlcon.query(`SELECT * FROM warnsnew WHERE UserID = '${message.mentions.users.first().id}' AND GuildID = '${message.guild.id}'`, (err, warnings) => {
    if (!warnings.length < 1) {
      if (warnings.length === 1) {
        let mUser = message.guild.member(message.mentions.users.first())
        let mRole = message.guild.roles.find(role => role.name === "Warned")
        if (!mRole) {
          message.channel.send("It appears that there is no warned role set up. I will quickly make one per pre-set specifications")
          message.guild.createRole({
            name: "Warned",
            color: "DEFAULT",
            hoist: false,
            position: 8,
            permissions: [],
            mentionable: true
          }).catch(error => { return message.reply(`Sorry, i was unable to execute that command. ${error}`) });
          setTimeout(function () {
            let Guild = message.guild
            let blarg = Guild.channels.filter(channel => channel.type === "text")
            blarg.forEach(f => {
              let mrole = message.guild.roles.find(role => role.name === "Warned").id
              f.overwritePermissions(mrole, { ATTACH_FILES: false, EMBED_LINKS: false })
            });
            let role = message.guild.roles.find(role => role.name === "Warned");
            mUser.addRole(role).catch(error => { utils.CatchError(message, error, cmdused) });
          }, 1000);

          message.channel.send(`A warned role has been made, and ${mUser} and been given it.`)
        }
        else {
          mUser.addRole(mRole).catch(error => { utils.CatchError(message, error, cmdused) });
          message.channel.send(`${mUser} has been given the warned role!`)
        }
        if (message.guild.id === "403155047527088129") {
          let mRole = message.guild.roles.find(role => role.name === "Negative Shitpost Access")
          if (message.member.roles.find(r => r.id === "546362093838925828")) {
            mUser.removeRole(mRole).catch(error => { utils.CatchError(message, error, cmdused) });
          }
        }
      }
      else if (warnings.length === 2) {
        let mUser = message.guild.member(message.mentions.users.first())
        mUser.kick("2 Warnings").catch(error => { utils.CatchError(message, error, cmdused) });
      }
      else if (warnings.length >= 3 && warnings.length <= 5) {
        let mUser = message.guild.member(message.mentions.users.first()) || message.guild.members.get(args[0])
        if (!mUser) return message.channel.send("Please mention a user")
        let mRole = message.guild.roles.find(role => role.name === "Muted")
        if (!mRole) {
          message.channel.send("It appears that there is no muted role set up. I will quickly make one per pre-set specifications")
          message.guild.createRole({
            name: "Muted",
            color: "LUMINOUS_VIVID_PINK",
            hoist: false,
            position: 9,
            permissions: [],
            mentionable: false
          }).catch(error => { return message.reply(`Sorry, i was unable to execute that command. ${error}`) });
          setTimeout(function () {
            let Guild = message.guild
            let blarg = Guild.channels.filter(channel => channel.type === "text")
            blarg.forEach(f => {
              let mrole = message.guild.roles.find(role => role.name === "Muted").id
              f.overwritePermissions(mrole, { SEND_MESSAGES: false, ADD_REACTIONS: false })
            });
            let role = message.guild.roles.find(role => role.name === "Muted");
            mUser.addRole(role).catch(error => { utils.CatchError(message, error, cmdused) });
          }, 500);

          message.channel.send(`A muted role has been made, and ${mUser} and been given it.`)
        }
        else {
          mUser.addRole(mRole).catch(error => { utils.CatchError(message, error, cmdused) });
          message.channel.send(`${mUser} has been given the Muted role!`)
        }
      }
      else if (warnings.length >= 5) {
        message.mentions.members.first().ban("Automatic ban for reaching 5 warns").catch(error => { utils.CatchError(message, error, cmdused) });
        message.channel.send("That user has been banned from the server!")
      };
    }
  })
}
async function HandleWarning(message, member, reason, sqlcon, cmdused) {
  AddWarn(message, member, reason, sqlcon);
  setTimeout(function () {
    WarnMessage(message, member, reason, sqlcon)
    HandleWarns(message, member, reason, sqlcon, cmdused)
  }, 200)
}

async function JokeWarning(client, message, member) {
  message.channel.send("*Oi, i see what you are trying to do, how about this?!?*")
  setTimeout(() => {
    let warnEmbed = new Discord.RichEmbed()
      .setAuthor(`Warn issued for ${message.author.tag}`, message.author.avatarURL)
      .setColor(member.displayHexColor)
      .setFooter(`UserID: ${message.author.id}`)
      .setTimestamp()
      .setThumbnail(message.author.avatarURL)
      .addField(`Warning:`,
        `Issued by ${client.user}`
        + `\n**Issue Time:** ${moment(Date.now()).format('DD MMM YYYY, HH:mm')}`
        + `\nReason: Being a meanie!`
        + `\n[Link to warning](https://discordapp.com/channels/${message.guild.id}/${message.channel.id}/${message.id})`);

    message.channel.send(warnEmbed)
  }, 750)
}

module.exports.run = async (client, message, args, sqlcon) => {
  let cmdused = "warn"
  let perm = "MANAGE_MESSAGES"
  let hArgs = "<user> <reason>"
  let desc = "Warns a user on the server. At 1 warn they will lose permission to send files and embed links, at 2 warns they get kicked, and at 3 warns they get muted."
  let reason = "";
  reason = args.slice(1).join(' ');
  sqlcon.query(`SELECT * FROM guildprefs WHERE GuildID = '${message.guild.id}'`, (err, rows) => {
    if (message.member.roles.find(role => role.id === rows[0].ModRole) || message.member.roles.find(role => role.id === rows[0].AdminRole) || message.member.hasPermission("ADMINISTRATOR")) {
      let member = message.guild.member(message.mentions.users.first())
      if (!member) return utils.Embed(message, cmdused, perm, desc, hArgs, sqlcon);
      else {
        if (member.id === client.user.id)
          JokeWarning(client, message, member)
        else if (member.user.bot)
          return message.channel.send("You can not warn bots!");
        else if (member.id === message.author.id)
          return message.channel.send("You can not warn yourself!");
        else if (member.highestRole.position > message.member.highestRole.position)
          return message.channel.send("That user is higher than you, so i am unable to let you warn them!");
        else if (member.highestRole.position == message.member.highestRole.position)
          return message.channel.send("That user is same rank as you, so i am unable to let you warn them!");
        else if (reason === "")
          return message.channel.send("You need to state a reason!")
        else HandleWarning(message, member, reason, sqlcon, cmdused)
      }
    }
  })
}
module.exports.config = {
  name: "warn",
  aliases: ["bap"],
  info: "Warns and punishes a user for breaking server rules",
  type: "mod"
}