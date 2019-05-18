const Discord = require("discord.js");
const utils = require("../utilities/utils.js");
const base = require("../utilities/basebot.js")
const dscp = require("../utilities/dscpcmds.js")
const config = require("../config.json");
const moment = require("moment");
const fs = require("fs");

module.exports.run = async (client, message, args, sqlcon) => {
    sqlcon.query(`SELECT * FROM guildprefs WHERE GuildID = '${message.guild.id}'`, (err, rows) => {
        if (err) bot.console(err)
        if (message.member.hasPermission("ADMINISTRATOR") || message.member.roles.find(role => role.id === rows[0].AdminRole)) {
            if (args[0] === "list") {
                let RList = "```All current roles and their IDs\n"
                message.guild.roles.forEach((f, i) => {
                    RList += `\n<${f.id}> ${f.name}`
                });
                let ModRoleString
                let AdminRoleString
                let ModRole = message.guild.roles.find(role => role.id === rows[0].ModRole)
                if (!ModRole) ModRoleString = "No role set!"
                else ModRoleString = ModRole.name
                let AdminRole = message.guild.roles.find(role => role.id === rows[0].AdminRole)
                if (!AdminRole) AdminRoleString = "No role set!"
                else AdminRoleString = AdminRole.name
                RList += `\n\nModerator role: ${ModRoleString}`
                RList += `\nAdmin role: ${AdminRoleString}`
                RList += "```"
                message.channel.send(RList)
            }
            else if (args[0] === "adminrole") {
                let AdminRole = message.guild.roles.find(role => role.id === args[1])
                if (!AdminRole) { message.channel.send("Invalid role ID specified") }
                else {
                    sqlcon.query(`UPDATE guildprefs SET AdminRole = ${args[1]} WHERE GuildID = '${message.guild.id}'`)
                    message.channel.send(`Admin role set to ${AdminRole.name}`)
                }
            }
            else if (args[0] === "modrole") {
                let ModRole = message.guild.roles.find(role => role.id === args[1])
                if (!ModRole) { message.channel.send("Invalid role ID specified") }
                else {
                    sqlcon.query(`UPDATE guildprefs SET ModRole = ${args[1]} WHERE GuildID = '${message.guild.id}'`)
                    message.channel.send(`Moderator role set to ${ModRole.name}`)
                }
            }
            else {

                let msgvoteemd = new Discord.RichEmbed()
                    .setAuthor("Corruption bot logging", client.user.avatarURL)
                    .setDescription("Changes the logging settings for this server")
                    .addField("**__Commands:__**", "**list** - Lists all roles and role IDs from this server"
                        + "\n**adminrole** <Role ID> - Sets the admin role for this server"
                        + "\n**modrole** <Role ID> - Sets the mod role for this server")
                    .setFooter(`Do ${rows[0].Prefix}help for help with commands`)
                    .setTimestamp()
                    .setColor(message.member.displayHexColor)
                message.channel.send(msgvoteemd)
            }
        }
    })
}
module.exports.config = {
    name: "roles",
    aliases: ["role", "r"],
    info: "Changes role settings for the server",
    type: "mod"
}