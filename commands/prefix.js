const bot = require('../CorruptionBot.js');
const utils = require('../utilities/utils.js');

module.exports.run = async (client, message, args, sqlcon) => {
    if (message.member.roles.find(role => role.id === rows[0].ModRole) || message.member.roles.find(role => role.id === rows[0].AdminRole) || message.member.hasPermission("ADMINISTRATOR")) {
        sqlcon.query(`SELECT * FROM guildprefs WHERE GuildID = '${message.guild.id}'`, (err, rows) => {
            if (err) utils.ConsoleMessage(err, client)
            if (message.member.hasPermission("ADMINISTRATOR") || message.member.roles.find(role => role.id === rows[0].Adminrole)) {
                if (args[0] === undefined) return message.channel.send("Please specify a new prefix!");
                sqlcon.query(`UPDATE guildprefs SET Prefix = '${args[0]}' WHERE GuildID = '${message.guild.id}'`)

            }
        })
        setTimeout(function () {
            sqlcon.query(`SELECT * FROM guildprefs WHERE GuildID = '${message.guild.id}'`, (err, prefix) => {
                message.guild.members.get(client.user.id).setNickname(`Corruption (${prefix[0].Prefix})`);
                message.channel.send(`The new bot prefix is ${prefix[0].Prefix}`);

            })
        }, 500);
    }
}
module.exports.config = {
    name: "prefix",
    aliases: ["p"],
    info: "Changes the bot's prefix",
    type: "mod"
}