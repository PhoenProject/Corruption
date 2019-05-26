const Discord = require("discord.js");
const moment = require("moment");
const bot = require('../CorruptionBot.js')

module.exports.Embed = (message, cmdused, perm, desc, hArgs, sqlcon) => {
    sqlcon.query(`SELECT * FROM guildprefs WHERE GuildID = '${message.guild.id}'`, (err, rows) => {
        if (err) bot.console(err)
        let Bot = message.guild.members.get(member => member.id === client.user.id)
        if(message.member == null || message.member.displayHexColor == null) color = '#6fa1f2'
		else color = message.member.displayHexColor
        const embed = new Discord.RichEmbed()
            .setAuthor(`Corruption Bot help module`)
            .setColor(color)
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
module.exports.ConsoleMessage = (error, client) => {
    const errorembed = new Discord.RichEmbed()
        .setAuthor('Corruption dev console', 'https://cdn.discordapp.com/avatars/484821107954810891/a997ad75d4d7e7a8e3a57d28f68effff.png?size=1024')
        .setColor('#e8dd6a')
        .setTimestamp()
        .setFooter("Corruption dev console")
        .addField("Console Message", error);

    client.user.guilds.find(guild => guild.id === "446745542740148244").channels.find(channel => channel.id === "579299257815793674").send(errorembed)
}