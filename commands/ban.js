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
      if (!message.member.hasPermission(perm) || !member || !reason) return utils.Embed(message, cmdused, perm, desc, hArgs, sqlcon);
      else if (member.hasPermission(perm)) {
        message.channel.send("I am unable to let you ban this user!")
      }
      else if (!member.bannable)
        return message.reply("I'm sorry, i can't let you do that...\nMake sure i have the required permissions")

      member.send(`You have been banned from ${message.guild.name} for ${reason}`)
      setTimeout(function () {
        member.ban(reason).catch(error => { utils.CatchError(message, error, cmdused) });
        message.channel.send("That user has been banned from the server!")
      }, 500)
    }
  })
}
module.exports.config = {
  name: "ban",
  aliases: ["ban"],
  info: "Bans a user from your discord server",
  type: "mod"
}