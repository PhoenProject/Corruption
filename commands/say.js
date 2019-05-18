const Discord = require("discord.js");
const utils = require("../utilities/utils.js");
const base = require("../utilities/basebot.js")
const dscp = require("../utilities/dscpcmds.js")
const config = require("../config.json");
const moment = require("moment");
const fs = require("fs");

module.exports.run = async (client, message, MsgContent) => {
    let Guild = client.guilds.find(guild => guild.id === MsgContent[1]);
    let Channel = Guild.channels.find(channel => channel.id === MsgContent[2]);
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
module.exports.config = {
    name: "say",
    aliases: ["talk", "tell"],
    info: "Gets the bot to send a message in a specific channel",
    type: "test"
}