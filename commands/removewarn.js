const bot = require('../CorruptionBot.js')

module.exports.run = async (client, message, args, sqlcon) => {
  let wMember = message.guild.member(message.mentions.users.first()) || message.guild.members.get(args[0])
  sqlcon.query(`SELECT * FROM warnsnew WHERE GuildID = '${message.guild.id}' AND DiscordID = '${wMember.id}'`, (err, rows) => {
    if (err) bot.Console(err)
    if (rows == undefined || rows[0] == undefined){
      message.channel.send("That user has no warnings!")
    }
    else message.channel.send("Command is currently under development!");
  })
}
module.exports.config = {
  name: "removewarn",
  aliases: ["delwarn", "rwarn", "unwarn"],
  info: "Removes 1 warn from a user",
  type: "mod"
}