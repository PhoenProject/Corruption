const Discord = require("discord.js");
const utils = require("../utilities/utils.js");
const base = require("../utilities/basebot.js")
const dscp = require("../utilities/dscpcmds.js")
const config = require("../config.json");
const moment = require("moment");
const fs = require("fs");

module.exports.run = async (client, message, args, sqlcon) => {
    let cmdused = "Botinfo"
    let GCount = client.guilds
    let UCount = 0
    let CCount
    GCount.forEach(element => {
        UCount = UCount + element.memberCount
    });
    GCount.forEach(element => {
        CCount = CCount + element.channels.length
    });
    const botinfo = new Discord.RichEmbed()
        .setTitle("Bot info for Corruption bot")
        .setAuthor(`Corruption bot`)
        .setColor(message.member.displayHexColor)
        .setDescription(`Created by user <@124241068727336963>`)
        .setFooter(`Corruption bot`)
        .setThumbnail(client.user.avatarURL)
        .setTimestamp()
        .addField(`Total guild count`, `${client.guilds.size}`, true)
        .addField(`Total user Count`, `${UCount}`, true)
        .addField(`Info`, `This bot was created using both discord.js and node.js, mainly for the DragonSCP discord server, but is available for other servers.`);

    message.channel.send(botinfo).catch(error => { utils.CatchError(message, error, cmdused) });
}
module.exports.config = {
    name: "botinfo",
    aliases: ["bi"],
    info: "Provides information about the bot",
    type: "info"
}