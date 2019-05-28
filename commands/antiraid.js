const Discord = require("discord.js");
const utils = require('../utilities/utils.js');
const bot = require('../CorruptionBot.js')

module.exports.run = async (client, message, args, sqlcon) => {
    sqlcon.query(`SELECT * FROM guildprefs WHERE GuildID = '${message.guild.id}'`, (err, rows) => {
        if (err) utils.ConsoleMessage(err, client)
        if (message.member.hasPermission("ADMINISTRATOR") || message.member.roles.find(role => role.id === rows[0].AdminRole)) {
            if (args[0] === "enable") {
                sqlcon.query(`UPDATE guildprefs SET AntiRaid = true WHERE GuildID = '${message.guild.id}'`)
                message.channel.send("**ANTI-RAID HAS BEEN ENABLED! ALL NEW MEMBERS WILL BE MUTED AUTOMATICALLY!**")
                message.guild.createRole({
                    name: "Anti-Raid",
                    color: "LUMINOUS_VIVID_PINK",
                    hoist: false,
                    position: 9,
                    permissions: [],
                    mentionable: false
                }).catch(error => { return member.reply(`Sorry, i was unable to create the Anti-Raid role. ${error}`) });
                let Guild = message.guild
                let blarg = Guild.channels.filter(channel => channel.type === "text")
                setTimeout(function () {
                    blarg.forEach(f => {
                        let mrole = message.guild.roles.find(role => role.name === "Anti-Raid").id
                        f.overwritePermissions(mrole, { SEND_MESSAGES: false, ADD_REACTIONS: false })
                    });
                }, 250)
            }
            else if (args[0] === "disable") {
                sqlcon.query(`UPDATE guildprefs SET AntiRaid = false WHERE GuildID = '${message.guild.id}'`)
                message.channel.send("**ANTI-RAID HAS BEEN DISABLED! ALL NEW MEMBERS WILL NO LONGER BE MUTED AUTOMATICALLY!**")
                message.guild.roles.find(role => role.name === "Anti-Raid").delete().catch(error => { message.channel.send(error) });
            }
            else {
                let araid = new Discord.RichEmbed()
                    .setAuthor("Corruption bot Anti-Raid", client.user.avatarURL)
                    .setDescription("Anti-Raid Settings")
                    .addField("**__Commands:__**", "**enable** - Enables the anti-raid feature for the bot"
                        + "\n**disable** - Disables the anti-raid feature for the bot")
                    .addField("**__What is Anti-Raid__**",
                        "Anti-Raid is a feature that helps deal with discord server raids. It will automatically mute all new members who join the server while it is enabled, "
                        + "preventing raid parties from joining with alt accounts, or getting other members involved")
                    .setFooter(`Do ${rows[0].Prefix}help for help with commands`)
                    .setTimestamp()
                    .setColor(message.member.displayHexColor)
                message.channel.send(araid)
            }
        }
    })
}

module.exports.config = {
    name: "antiraid",
    aliases: ["raid", "ar", "araid"],
    info: "Stops people's ability to raid your discord server",
    type: "mod"
}