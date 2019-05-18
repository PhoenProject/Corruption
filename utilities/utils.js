const Discord = require("discord.js");
const config = require("../config.json");
const moment = require("moment");
const fs = require("fs");

module.exports.Embed = (message, cmdused, perm, desc, hArgs, sqlcon) => {
    sqlcon.query(`SELECT * FROM guildprefs WHERE GuildID = '${message.guild.id}'`, (err, rows) => {
        if (err) throw err
        let Bot = message.guild.members.get(member => member.id === client.user.id)        
        const embed = new Discord.RichEmbed()
            .setAuthor(`Corruption Bot help module`)
            .setColor(message.member.displayHexColor)
            .setColor(Bot.displayHexColor)
            .setFooter(`Do ${rows[0].Prefix}help for more information`)
            .setTimestamp()
            .setDescription(`${rows[0].Prefix}${cmdused} ${hArgs}`)
            .addField("Description", `${desc}`)
        message.channel.send(embed)
    })
}
module.exports.CatchError = (message, error, cmdused) => {
    message.channel.send(`Sorry, but i was unable to execute that command due to an error! ${error}`)
    console.log(`[${moment().format('YYYY MM DD HH:ss')}] ${message.author} attempted to use ${cmdused} but errored due to ${error}`)
}
module.exports.Console = (cmessage, client) => {
    if (config.beta === false) {
        let Bot = cmessage.guild.members.get(member => member.id === client.user.id) 
        const errorembed = new Discord.RichEmbed()
            .setAuthor('Corruption Developer log', client.user.avatarURL)
            .setColor(Bot.displayHexColor)
            .setTimestamp()
            .setFooter("Console logging for Corruption")
            .addField("Console Message", cmessage);

        console.log(cmessage)
        client.guilds.find(guild => guild.id === "446745542740148244").channels.find(channel => channel.id === "557285986833530882").send(errorembed)
    }
}
