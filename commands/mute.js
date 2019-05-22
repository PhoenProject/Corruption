const Discord = require("discord.js");
const utils = require('../utilities/utils.js');
const bot = require('../CorruptionBot.js')
const moment = require("moment");

module.exports.run = async (client, message, args, sqlcon) => {
  sqlcon.query(`SELECT * FROM guildprefs WHERE GuildID = '${message.guild.id}'`, (err, rows) => {
    if (err) utils.ConsoleMessage(err, client)
    if (message.member.roles.find(role => role.id === rows[0].ModRole) || message.member.roles.find(role => role.id === rows[0].AdminRole) || message.member.hasPermission("ADMINISTRATOR")) {
      let cmdused = "mute";
      let perm = "MANAGE_MESSAGES";
      let hArgs = "<user>"
      let desc = "Mutes a user on the server, preventing them from sending messages and adding reactions.";
      let Member = message.guild.member(message.mentions.users.first()) || message.guild.members.get(args[0])
      let mRole = message.guild.roles.find(role => role.name === "Muted")
      if (Member == null || Member == undefined)
        return message.channel.send("That member could not be found!");
      else if (Member.user.bot)
        return message.channel.send("You can not mute bots!");
      else if (Member.id === message.author.id)
        return message.channel.send("You can not mute yourself!");
      else if (Member.highestRole.position > message.member.highestRole.position)
        return message.channel.send("That user is higher than you, so i am unable to let you mute them!");
      else if (Member.highestRole.position === message.member.highestRole.position)
        return message.channel.send("That user is same rank as you, so i am unable to let you mute them!");
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
          Member.addRole(role).catch(error => { utils.CatchError(message, error, cmdused) });
        }, 500);

        message.channel.send(`A muted role has been made, and ${Member} and been given it.`)
      }
      else {
        if (Member.roles.has(mRole.id)) return message.channel.send("User is already muted.")
        Member.addRole(mRole).catch(error => { utils.CatchError(message, error, cmdused) });
        setTimeout(function () {
          if (Member.roles.has(mRole.id)) {
            let warnchannel = message.guild.channels.find((channel => channel.name === "mod-actions"));
            if (!warnchannel) { }
            else {
              let reason = args.slice(1).join(" ");
              if(reason === "") reason = "No reason given!"
              let muteEmbed = new Discord.RichEmbed()
                .setAuthor(`Mute given to ${Member.user.tag}`, Member.user.avatarURL)
                .setColor(Member.displayHexColor)
                .setFooter(`UserID: ${Member.user.id}`)
                .setTimestamp()
                .setThumbnail(Member.user.avatarURL)
                .addField(`Mute:`,
                  `Issued by ${message.author}`
                  + `\n**Issue Time:** ${moment(Date.now()).format('DD MMM YYYY, HH:mm')}`
                  + `\nReason: ${reason}`
                  + `\n[Link to mute](https://discordapp.com/channels/${message.guild.id}/${message.channel.id}/${message.id})`);
              warnchannel.send(muteEmbed)
              message.channel.send(`${Member} has been given the Muted role!`)
            }
          }
        }, 500);
      }
    }

  })
}
module.exports.config = {
  name: "mute",
  aliases: ["stab", "gag", "bin", "recycle"],
  info: "Blocks a user from sending messages, and from adding reactions",
  type: "mod"
}