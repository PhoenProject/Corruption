const Discord = require("discord.js");
const utils = require('../utilities/utils.js');
const config = require("../config.json");
const moment = require("moment");
const fs = require("fs");
const SteamAPI = require('steamapi');
const steam = new SteamAPI('947A68A6B18DCB732C798DF51AC454DE');

module.exports.onduty = (client, message, MsgContent) => {
    let cmdused = "onduty"
    if (!message.guild.id === 403155047527088129) return;
    let DGuard = message.guild.roles.find(role => role.name === "Dragon Guard").id
    let ODuty = message.guild.roles.find(role => role.name === "Off Duty").id
    if (message.member.roles.find(role => role.id === DGuard)) return message.reply("You are already on duty!")
    else if (!message.member.roles.find(role => role.id === ODuty)) return;
    else if (message.member.roles.find(role => role.id === ODuty)) {
        message.member.addRole(DGuard).catch(error => { utils.CatchError(message, error, cmdused) });
        message.member.removeRole(ODuty).catch(error => { utils.CatchError(message, error, cmdused) });
        message.channel.send(`${message.author} is now back on duty!`)
    }

}
module.exports.offduty = (client, message, MsgContent) => {
    let cmdused = "offduty"
    if (!message.guild.id === "403155047527088129") return;
    let DGuard = message.guild.roles.find(role => role.name === "Dragon Guard").id
    let ODuty = message.guild.roles.find(role => role.name === "Off Duty").id
    if (message.member.roles.find(role => role.id === ODuty)) return message.reply("You are already off duty!")
    else if (!message.member.roles.find(role => role.id === DGuard)) return;
    else if (message.member.roles.find(role => role.id === DGuard)) {
        const filter = m => m.author.id == message.author.id
        message.channel.send("Why are you going off duty?")
        message.channel.awaitMessages(filter, { max: 1, time: 30000, errors: ['time'] }).then((Reason) => {
            if (Reason.first().toString().toLowerCase() !== "cancel") {
                message.channel.send("When roughly will you be coming back on duty?")
                message.channel.awaitMessages(filter, { max: 1, time: 30000, errors: ['time'] }).then((Time) => {
                    if (Time.first().toString().toLowerCase() !== "cancel") {
                        let OffDutyEmbed = new Discord.RichEmbed()
                            .setAuthor(message.author.tag, message.author.avatarURL)
                            .setColor(message.member.displayHexColor)
                            .setTimestamp()
                            .addField(`User has gone off duty!`,
                                `**Reaon:** ${Reason.first().toString().toLowerCase()}`
                                + `\n**Expected return time:** ${Time.first().toString().toLowerCase()}`)
                            .setFooter(`UserID: ${message.author.id}`)

                        message.channel.send(OffDutyEmbed);

                        message.member.addRole(ODuty).catch(error => { return utils.CatchError(message, error, cmdused) });
                        message.member.removeRole(DGuard).catch(error => { return utils.CatchError(message, error, cmdused) });
                        message.channel.send(`${message.author} is now off duty!`)
                    }
                    else {
                        message.channel.bulkDelete(2)
                        message.channel.send("Form canceled!")
                    }
                }).catch(Error => {
                    utils.ConsoleMessage(Error, client)
                    message.channel.bulkDelete(3)
                    message.channel.send("The form has timed out!")
                });
            }
            else {
                message.channel.bulkDelete(2)
                message.channel.send("Form canceled!")
            }
        }).catch(Error => {
            message.channel.bulkDelete(2)
            utils.ConsoleMessage(Error, client)
            message.channel.send("The form has timed out!")
        });
    }
}
/*module.exports.staff = (client, message, MsgContent, sqlcon) => {
    let args = message.content.split(' ')
    if (message.member.mentions.first() == null) message.reply("You forgot to @mention the user!")
    else {
        const filter = m => m.author.id === message.author.id

        message.channel.send("Please state the SteamID64 of the user!")
        message.channel.awaitMessages(filter, { max: 1, time: 30000, errors: ['time'] }).then((SteamID) => {

            let args = message.content.split(' ')
            steam.getUserSummary(args[1]).catch(O_o => { message.channel.send("That is an invalid SteamID!") })
                .then(summary => {
                    if (summary != undefined) {
                        message.channel.send("TESTING123")
                    }
                })
        })
    }
}*/