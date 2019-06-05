const utils = require('../utilities/utils.js');
const bot = require('../CorruptionBot.js')

module.exports.run = async (client, message, args, sqlcon) => {
  sqlcon.query(`SELECT * FROM guildprefs WHERE GuildID = '${message.guild.id}'`, (err, rows) => {
    if (err) utils.ConsoleMessage(err, client)
    if (message.member.hasPermission("KICK_MEMBERS") || message.member.hasPermission("ADMINISTRATOR")) {
      let cmdused = "kick"
      let perm = "KICK_MEMBERS"
      let hArgs = "<user> <reason>"
      let desc = "Kicks a user from the server."
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
            return message.channel.send("You can not kick bots!");
          else if (member.id === message.author.id)
            return message.channel.send("You can not kick yourself!");
          else if (member.highestRole.position > message.member.highestRole.position)
            return message.channel.send("That user is higher than you, so i am unable to let you kick them!");
          else if (member.highestRole.position == message.member.highestRole.position)
            return message.channel.send("That user is same rank as you, so i am unable to let you kick them!");
          else if (reason === "")
            return message.channel.send("You need to state a reason!")
          else {
            member.send(`You have been kicked from ${message.guild.name} for ${reason}`)
            setTimeout(function () {
              member.kick(reason).then(message.channel.send(`That user has been kicked from the server!`))
                .catch(error => { utils.CatchError(message, error, cmdused) });
            }, 500)
          }
        }
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