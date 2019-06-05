const utils = require('../utilities/utils.js');
const bot = require('../CorruptionBot.js')

module.exports.run = async (client, message, args, sqlcon) => {
  sqlcon.query(`SELECT * FROM guildprefs WHERE GuildID = '${message.guild.id}'`, (err, rows) => {
    if (err) utils.ConsoleMessage(err, client)
    if (message.member.hasPermission("BAN_MEMBERS") || message.member.hasPermission("ADMINISTRATOR")) {
      let cmdused = "ban"
      let perm = "BAN_MEMBERS"
      let desc = "Bans a user from the server."
      let hArgs = "<user> <reason>"
      let member = message.mentions.members.first();
      let reason = args.slice(1).join(' ');
      if (message.member.roles.find(role => role.id === rows[0].ModRole) || message.member.roles.find(role => role.id === rows[0].AdminRole) || message.member.hasPermission("ADMINISTRATOR")) {
        let member = message.guild.member(message.mentions.users.first()) || message.guild.members.get(args[0])
        if (!member) return utils.Embed(message, cmdused, perm, desc, hArgs, sqlcon);
        else {
          if (member.id === client.user.id)
            message.channel.send("**REEEE!**")
          else if (member == null || member == undefined)
            return message.channel.send("That member could not be found!");
          else if (member.user.bot)
            return message.channel.send("You can not ban bots!");
          else if (member.id === message.author.id)
            return message.channel.send("You can not ban yourself!");
          else if (member.highestRole.position > message.member.highestRole.position)
            return message.channel.send("That user is higher than you, so i am unable to let you ban them!");
          else if (member.highestRole.position == message.member.highestRole.position)
            return message.channel.send("That user is same rank as you, so i am unable to let you ban them!");
          else if (reason === "")
            return message.channel.send("You need to state a reason!")
          else {
            let warnchannel = message.guild.channels.find((channel => channel.id === rows[0].ModLogchan));
            if (warnchannel != null) {
              let muteEmbed = new Discord.RichEmbed()
                .setAuthor(`You have been banned from ${message.guild.name}`, member.user.avatarURL)
                .setColor(member.displayHexColor)
                .setFooter(`UserID: ${member.user.id}`)
                .setTimestamp()
                .setThumbnail(member.user.avatarURL)
                .addField(`ban:`,
                  `Banned by ${message.author}`
                  + `\n**Time of ban:** ${moment(Date.now()).format('DD MMM YYYY, HH:mm')}`
                  + `\nReason: ${entry.getReason().orElse("No reason given!")}`);
              member.send(muteEmbed)
              setTimeout(function () {
                member.kick(reason).then(message.channel.send(`${member} has been banned!`))
                  .catch(error => { utils.CatchError(message, error, cmdused) });
              }, 500)
            }
          }
        }
      }
    }
  })
}
module.exports.config = {
  name: "ban",
  aliases: ["ban"],
  info: "Bans a user from your discord server",
  type: "mod"
}