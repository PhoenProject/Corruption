const bot = require('../CorruptionBot.js')

module.exports.run = async (client, message, args, sqlcon) => {
  let wMember = message.mentions.members.first() || message.guild.memers.find(member => member.name == args[1]) || message.guild.memers.find(member => member.id == args[1])
  sqlcon.query(`SELECT * FROM warnsnew WHERE GuildID = '${message.guild.id}' AND DiscordID = '${wMember.id}'`, (err, rows) => {
    if (err) bot.Console(err)
    if (rows == undefined || rows[0] == undefined){
      message.channel.send("That user has no warnings!")
    }
  })
}
module.exports.config = {
  name: "removewarn",
  aliases: ["delwarn", "rwarn", "unwarn"],
  info: "Removes 1 warn from a user",
  type: "mod"
}