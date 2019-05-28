const Discord = require("discord.js");
const utils = require('../utilities/utils.js');
const bot = require('../CorruptionBot.js')

module.exports.run = async (client, message, args, sqlcon) => {
    sqlcon.query(`SELECT * FROM guildprefs WHERE GuildID = '${message.guild.id}'`, (err, rows) => {
        if (err) utils.ConsoleMessage(err, client)
        if (message.member.hasPermission("ADMINISTRATOR") || message.member.roles.find(role => role.id === rows[0].AdminRole)) {
            if (args[0] === "messages") {
                if (rows[0].MsgLogChan === "null") { message.channel.send("You must specify a logging channel first!") }
                else {
                    if (args[1] === "enable") {
                        sqlcon.query(`UPDATE guildprefs SET MsgLog = 'true' WHERE GuildID = '${message.guild.id}'`)

                        message.channel.send("Message logging for this server has been enabled!")
                    }
                    else if (args[1] === "disable") {
                        sqlcon.query(`UPDATE guildprefs SET MsgLog = 'false' WHERE GuildID = '${message.guild.id}'`)

                        message.channel.send("Message logging for this server has been disabled!")
                    }
                    else {
                        let msgvoteemd = new Discord.RichEmbed()
                            .setAuthor("Corruption bot logging", client.user.avatarURL)
                            .setDescription("Changes the logging settings for this server")
                            .addField("**__Commands:__**", "**enable** - Enables the message logging in this server"
                                + "\n**disable** - Disables the message logging for this server")
                            .setFooter(`Do ${gPrefix}help for help with commands`)
                            .setTimestamp()
                            .setColor(message.member.displayHexColor)
                        message.channel.send(msgvoteemd)
                    }
                }
            }
            else if (args[0] === "members") {
                if (rows[0].MemLogChan === "null") { message.channel.send("You must specify a logging channel first!") }
                else {
                    if (args[1] === "enable") {
                        sqlcon.query(`UPDATE guildprefs SET MemLog = 'true' WHERE GuildID = '${message.guild.id}'`)

                        message.channel.send("Member logging for this server has been enabled!")
                    }
                    else if (args[1] === "disable") {
                        sqlcon.query(`UPDATE guildprefs SET MemLog = 'false' WHERE GuildID = '${message.guild.id}'`)

                        message.channel.send("Member logging for this server has been disabled!")
                    }
                    else {
                        let msgvoteemd = new Discord.RichEmbed()
                            .setAuthor("Corruption bot logging", client.user.avatarURL)
                            .setDescription("Changes the logging settings for this server")
                            .addField("**__Commands:__**", "**enable** - Enables the member logging in this server"
                                + "\n**disable** - Disables the member logging for this server")
                            .setFooter(`Do ${gPrefix}help for help with commands`)
                            .setTimestamp()
                            .setColor(message.member.displayHexColor)
                        message.channel.send(msgvoteemd)
                    }
                }
            }
            else if (args[0] === "channel") {
                if (args[1] === "messages") {
                    if (!message.mentions.channels.first()) message.channel.send("Please mention a channel!")
                    else {
                        sqlcon.query(`UPDATE guildprefs SET MsgLogChan = ${message.mentions.channels.first().id} WHERE GuildID = '${message.guild.id}'`)

                        message.channel.send("Message logging channel has been set!")
                    }
                }
                else if (args[1] === "members") {
                    if (!message.mentions.channels.first()) message.channel.send("Please mention a channel!")
                    else {
                        sqlcon.query(`UPDATE guildprefs SET MemLogChan = ${message.mentions.channels.first().id} WHERE GuildID = '${message.guild.id}'`)

                        message.channel.send("Member logging channel has been set!")
                    }
                }
                else if (args[1] === "mod") {
                    if (!message.mentions.channels.first()) message.channel.send("Please mention a channel!")
                    else {
                        sqlcon.query(`UPDATE guildprefs SET ModLogchan = ${message.mentions.channels.first().id} WHERE GuildID = '${message.guild.id}'`)

                        message.channel.send("mod action logging channel has been set!")
                    }
                }
            }
            else {
                let msgvoteemd = new Discord.RichEmbed()
                    .setAuthor("Corruption bot logging", client.user.avatarURL)
                    .setDescription("Changes the logging settings for this server")
                    .addField("**__Commands:__**",
                        "\n**messages** <enable/disable> - Toggles the message logging for this server"
                        + "\n**members** <enable/disable> - Toggles the member logging for this server"
                        + "\n**channel** <messages/members> - Specifies the channel you wish the logs to go into")
                    .setFooter(`Do ${rows[0].Prefix}help for help with commands`)
                    .setTimestamp()
                    .setColor(message.member.displayHexColor)
                message.channel.send(msgvoteemd)
            }
        }
    })
}
module.exports.config = {
    name: "logging",
    aliases: ["logs"],
    info: "Changing the bot logging settings for the server",
    type: "mod"
}