const Discord = require("discord.js");
const utils = require('../utilities/utils.js');
const moment = require("moment");
const bot = require('../CorruptionBot.js')

module.exports.run = async (client, message, args, sqlcon) => {
    sqlcon.query(`SELECT * FROM guildprefs WHERE GuildID = '${message.guild.id}'`, (err, rows) => {
        if (err) utils.ConsoleMessage(err, client)
        if (message.member.roles.find(role => role.id === rows[0].ModRole) || message.member.roles.find(role => role.id === rows[0].AdminRole) || message.member.hasPermission("ADMINISTRATOR")) {
            let cmdused = "unmute"
            let perm = "MANAGE_MESSAGES"
            let hArgs = "<user>"
            let desc = "Unmutes a muted user."
            let Member = message.guild.member(message.mentions.users.first()) || message.guild.members.get(args[0])
            let mRole = message.guild.roles.find(role => role.name === "Muted")
            if (Member == null || Member == undefined)
                return message.channel.send("That member could not be found!");
            else if (Member.bot)
                return message.channel.send("You can not unmute bots!");
            else if (Member.id === message.author.id)
                return message.channel.send("You can not unmute yourself!");
            else if (Member.highestRole.position > message.member.highestRole.position)
                return message.channel.send("That user is higher than you, so i am unable to let you unmute them!");
            else if (Member.highestRole.position === message.member.highestRole.position)
                return message.channel.send("That user is same rank as you, so i am unable to let you unmute them!");
            else {
                Member.removeRole(mRole).catch(error => { utils.CatchError(message, error, cmdused) });
                setTimeout(function () {
                    sqlcon.query(`SELECT * FROM guildprefs WHERE GuildID = ${message.guild.id}`, (Error, ModLog) => {
                        let warnchannel = message.guild.channels.find((channel => channel.id === ModLog.ModLogchan));
                        if (warnchannel != null) {
                            let muteEmbed = new Discord.RichEmbed()
                                .setAuthor(`Mute removed from ${Member.user.tag}`, Member.user.avatarURL)
                                .setColor(Member.displayHexColor)
                                .setFooter(`UserID: ${Member.user.id}`)
                                .setTimestamp()
                                .setThumbnail(Member.user.avatarURL)
                                .addField(`Mute:`,
                                    `Removed by ${message.author}`
                                    + `\n**Time of removal:** ${moment(Date.now()).format('DD MMM YYYY, HH:mm')}`);
                            warnchannel.send(muteEmbed)
                        }
                        message.channel.send(`${Member} has been unmuted!`)
                    })

                }, 500);
            }
        }
    })
}
module.exports.config = {
    name: "unmute",
    aliases: ["unstab", "ungag", "unbin"],
    info: "Unmutes a user (opposite of the mute command)",
    type: "mod"
}