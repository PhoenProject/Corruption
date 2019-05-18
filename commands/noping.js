const Discord = require("discord.js");
const utils = require("../utilities/utils.js");
const base = require("../utilities/basebot.js")
const dscp = require("../utilities/dscpcmds.js")
const config = require("../config.json");
const moment = require("moment");
const fs = require("fs");

module.exports.run = async (client, message, args, sqlcon) => {
    message.channel.send("This command is disabled!")
}
module.exports.config = {
    name: "noping",
    aliases: ["nping"],
    info: "Adds a user to the NoPing list, where pinging them will result in an automatic warn",
    type: "mod"
}