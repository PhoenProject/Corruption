const Discord = require("discord.js");
const utils = require('../utilities/utils.js');
const config = require("../config.json");
const moment = require("moment");
const bot = require("../CorruptionBot")
const fs = require("fs");

module.exports.Say = (client, message, MsgContent) => {
    let Guild = client.guilds.find(guild => guild.id === MsgContent[1]);
    if (Guild === null) return message.reply("I was unable to find that guild");
    else {
        let Channel = Guild.channels.find(channel => channel.id === MsgContent[2]);
        if (Channel === null) return message.reply("I was unable to find that channel");
        else {
            let sMessage = MsgContent.slice(3).join(' ');
            Channel.send(sMessage)
        }
    }
}
module.exports.Contact = (client, message, args) => {
    if (message.member.hasPermission("ADMINISTRATOR")) {
        let cmdused = "contact"
        const sayMessage = args.join(" ");
        if (sayMessage === "") {
            message.reply("You must include a message that you wish to send to the bot creator.")
            return;
        }
        const contact = new Discord.RichEmbed()
            .setTitle(`New contact message`)
            .setAuthor("Contact message")
            .setColor(8528115)
            .setDescription(`Contact message sent from ${message.author}`)
            .setFooter(`Corruption bot`)
            .setThumbnail(message.author.avatarURL)
            .setTimestamp()
            .addField(`Message contents`, sayMessage);

        client.fetchUser("124241068727336963", false).then((user) => user.send(contact))
            .catch(error => {
                message.reply("Sorry but i was unable to execute that command. Please check the bot console for the error!")
                console.log(`${message.author} tried to use ${cmdused} but i errored. ${error}`)
            });
    }
}