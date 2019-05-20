const Discord = require("discord.js");
const utils = require('../utilities/utils.js');
const moment = require("moment");
function GetWarns(message, sqlcon, userInfoEmbed) {
  sqlcon.query(`SELECT * FROM warnsnew WHERE UserID = '${message.author.id}' AND GuildID = '${message.guild.id}'`, (err, warnings) => {
    if (warnings.length > 1) {
      userInfoEmbed.addField(`Warnings`, `Currently has no warnings`)
    }
    else if (warnings.length === 1) {
      userInfoEmbed.addField(`Warnings`, `Currently has 1 warning`)
    }
    else {
      userInfoEmbed.addField(`Warnings`, `Currently has ${warnings.length} warnings`)
    }
  })
}

module.exports.run = async (client, message, args, sqlcon) => {
  let uMember = message.mentions.members.first()
  if (uMember === undefined) uMember = message.member

  const userInfoEmbed = new Discord.RichEmbed()
    .setThumbnail(uMember.user.displayAvatarURL)
    .setColor(uMember.displayHexColor)
    .setFooter(`UserID: ${uMember.user.id}`)

  GetWarns(message, sqlcon, userInfoEmbed)

  if (uMember.nickname != null) namestring = `${uMember.user.tag} - ${uMember.nickname}`
  else namestring = uMember.user.tag

  if (uMember.presence.status === "online") Presence = "Online"
  else if (uMember.presence.status === "idle") Presence = "Idle"
  else if (uMember.presence.status === "dnd") Presence = "DnD (Do not Disturb)"
  else if (uMember.presence.status === "offline") Presence = "Offline"

  moment.updateLocale('en', {
    relativeTime: {
      s: 'A few seconds',
      m: "A minute",
      h: "An hour",
      d: "A day",
      M: "A month",
      y: "A year",
    }
  });


  userInfoEmbed.setAuthor(namestring)
  userInfoEmbed.setDescription(`Currently ${Presence}`)
  userInfoEmbed.addField(`Account created on:`, `${moment(uMember.user.createdAt.toUTCString()).format('DD MMM YYYY, HH:mm')}`
    + `\n(${moment(uMember.user.createdAt.toUTCString()).fromNow()})`, true)
  userInfoEmbed.addField(`Joined guild`, `${moment(uMember.joinedAt.toUTCString()).format('DD MMM YYYY, HH:mm')}`
    + `\n(${moment(uMember.joinedAt.toUTCString()).fromNow()})`, true)
  userInfoEmbed.setFooter(`UserID: ${uMember.user.id}`);

  setTimeout(() => { message.channel.send(userInfoEmbed) }, 50)

}
module.exports.config = {
  name: "userinfo",
  aliases: ["userinfo", "uinfo", "useri"],
  info: "Shows a user's information",
  type: "info"
}