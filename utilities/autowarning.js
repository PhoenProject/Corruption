const Discord = require("discord.js");
const config = require("../config.json");
const utils = require("./utils.js");
const moment = require("moment");
const fs = require("fs");

module.exports.globalfilter = (client, message, sqlcon) => {
    sqlcon.query(`SELECT * FROM guildprefs WHERE GuildID = '${message.guild.id}'`, (err, rows) => {
        if (rows[0].GlobalFilter == true) {
            sqlcon.query(`SELECT * FROM globalfilter`, (err, words) => {
                words.forEach(element => {
                    let msg = message.content.toLowerCase()
                    if (msg.includes(element.word)) {
                        let AutoWarnReason = "Saying a globally filtered word"
                        let AWUser = message.author
                        let AWMember = message.member
                        let issueTime = moment(Date.now()).format('DD MMM YYYY, HH:mm')
                        AddAutoWarn(AutoWarnReason, AWUser, AWMember, issueTime, sqlcon, message)
                        message.delete().catch(error => { console.log(error) })
                    }
                });
            })
        }
    })
}
module.exports.filter = (client, message, sqlcon) => {
    sqlcon.query(`SELECT * FROM guildfilter WHERE GuildID = '${message.guild.id}'`, (err, words) => {
        words.forEach(element => {
            if (message.content.includes(element.word)) {
                let AutoWarnReason = "Saying a filtered word"
                let AWUser = message.author
                let AWMember = message.member
                let issueTime = moment(Date.now()).format('DD MMM YYYY, HH:mm')
                AddAutoWarn(AutoWarnReason, AWUser, AWMember, issueTime, sqlcon, message)
                message.delete().catch(error => { console.log(error) })
            }
        });
    })
}
module.exports.massping = (client, message, sqlcon) => {
    let TotalMentions = message.mentions.members.size + message.mentions.roles.size
    if (!message.member.hasPermission("KICK_MEMBERS")) {
        if (TotalMentions > 2 && TotalMentions < 5) { message.reply("Please keep the noise down!") }
        else if (TotalMentions > 4 && TotalMentions < 8) {
            let AutoWarnReason = "Massping of users/roles"
            let AWUser = message.author
            let AWMember = message.member
            let issueTime = moment(Date.now()).format('DD MMM YYYY, HH:mm')
            AddAutoWarn(AutoWarnReason, AWUser, AWMember, issueTime, sqlcon, message)
        }
        else if (TotalMentions > 7) {
            message.member.ban("Automatic ban for mass pinging 8 or more users/roles").catch(error => { utils.CatchError(message, error, cmdused) });
            message.channel.send("User has been banned from the server!")
        }
    }
}
async function AddAutoWarn(AutoWarnReason, AWUser, AWMember, issueTime, sqlcon, message) {
    sqlcon.query(`SELECT * FROM warnsnew WHERE UserID = '${AWUser.id}' AND GuildID = '${message.guild.id}'`, (err, WarnCount) => {
        if (err) utils.ConsoleMessage(err, client)
        if (WarnCount.length < 1) {
            sqlcon.query(`INSERT INTO warnsnew (GuildID, UserID, Count, Reason, Timestamp, Issuer, ChannelID, MessageID) VALUES
			('${message.guild.id}', '${AWUser.id}', '1', '${AutoWarnReason}', '${issueTime}', '484821107954810891', '${message.channel.id}', '${message.id}')`)
        }
        else if (WarnCount.length > 0) {
            sqlcon.query(`INSERT INTO warnsnew (GuildID, UserID, Count, Reason, Timestamp, Issuer, ChannelID, MessageID) VALUES
			('${message.guild.id}', '${AWUser.id}', '${WarnCount.length + 1}', '${AutoWarnReason}', '${issueTime}', '484821107954810891', '${message.channel.id}', '${message.id}')`)
        }
        else if (WarnCount == undefined) console.log("There has been an issue!")

        HandleAutoWarn(AutoWarnReason, AWUser, AWMember, issueTime, sqlcon, message)
    })
}
async function HandleAutoWarn(AutoWarnReason, AWUser, AWMember, issueTime, sqlcon, message) {
    sqlcon.query(`SELECT * FROM warnsnew WHERE UserID = '${AWUser.id}' AND GuildID = '${message.guild.id}'`, (err, WarnCount) => {
        if (WarnCount.length === '1') {
            let mRole = message.guild.roles.find(role => role.name === "Warned")
            if (!mRole) {
                message.channel.send("It appears that there is no warned role set up. I will quickly make one per pre-set specifications")
                message.guild.createRole({
                    name: "Warned",
                    color: "DEFAULT",
                    hoist: false,
                    position: 8,
                    permissions: [],
                    mentionable: true
                }).catch(error => { return message.reply(`Sorry, i was unable to execute that command. ${error}`) });
                setTimeout(function () {
                    let Guild = message.guild
                    let blarg = Guild.channels.filter(channel => channel.type === "text")
                    blarg.forEach(f => {
                        let mrole = message.guild.roles.find(role => role.name === "Warned").id
                        f.overwritePermissions(mrole, { ATTACH_FILES: false, EMBED_LINKS: false })
                    });
                    let role = message.guild.roles.find(role => role.name === "Warned");
                    AWMember.addRole(role).catch(error => { message.channel.send(error) });
                }, 1000);

                message.channel.send(`A warned role has been made, and ${AWMember} and been given it.`)
            }
            else {
                AWMember.addRole(mRole).catch(error => { message.channel.send(error) });
                message.channel.send(`${AWMember} has been given the warned role!`)
            }
        }
        else if (WarnCount.length === 2) {
            AWMember.kick("Auto kick for reaching 2 warnings").catch(error => { utils.CatchError(message, error, cmdused) });
        }
        else if (WarnCount.length >= 3 && WarnCount.length <= 5) {
            let mRole = message.guild.roles.find(role => role.name === "Muted")
            if (!mRole) {
                message.channel.send("It appears that there is no muted role set up. I will quickly make one per pre-set specifications")
                message.guild.createRole({
                    name: "Muted",
                    color: "LUMINOUS_VIVID_PINK",
                    hoist: false,
                    position: 9,
                    permissions: [],
                    mentionable: false
                }).catch(error => { return message.reply(`Sorry, i was unable to execute that command. ${error}`) });
                setTimeout(function () {
                    let Guild = message.guild
                    let blarg = Guild.channels.filter(channel => channel.type === "text")
                    blarg.forEach(f => {
                        let mrole = message.guild.roles.find(role => role.name === "Muted").id
                        f.overwritePermissions(mrole, { SEND_MESSAGES: false, ADD_REACTIONS: false })
                    });
                    let role = message.guild.roles.find(role => role.name === "Muted");
                    AWMember.addRole(role).catch(error => { message.channel.send(error) });
                }, 500);

                message.channel.send(`A muted role has been made, and ${AWMember} and been given it.`)
            }
            else {
                AWMember.addRole(mRole).catch(error => { message.channel.send(error) });
                message.channel.send(`${AWMember} has been given the Muted role!`)
            }
        }
        else if (WarnCount.length >= 5) {
            AWMember.ban("Automatic ban for reaching 5 warns").catch(error => { utils.CatchError(message, error, cmdused) });
            message.channel.send("User has been banned from the server!")
        };

        AutoWarnMessage(AutoWarnReason, AWUser, AWMember, issueTime, sqlcon, message, WarnCount)
    })
}
async function AutoWarnMessage(AutoWarnReason, AWUser, AWMember, issueTime, sqlcon, message, WarnCount) {
    let warnEmbed = new Discord.RichEmbed()
        .setAuthor(`Warn issued for ${AWUser.tag}`, AWUser.avatarURL)
        .setColor(AWMember.displayHexColor)
        .setFooter(`UserID: ${AWUser.id}`)
        .setTimestamp()
        .setThumbnail(AWUser.avatarURL)
        .addField(`Warning:`,
            `Issued by: <@484821107954810891>`
            + `\n**Issue Time:** ${issueTime}`
            + `\nReason: ${AutoWarnReason}`
            + `\n[Link to warning](https://discordapp.com/channels/${message.guild.id}/${message.channel.id}/${message.id})`);
    let warnchannel = message.guild.channels.find((channel => channel.name === "mod-actions"));
    if (!warnchannel) {
        message.reply("I was unable to find a #mod-actions channel, so i will post it here.");
        message.channel.send(warnEmbed);
        AWMember.send(warnEmbed);
    }
    else {
        message.channel.send(`${AWMember} has been warned, with a total of ${WarnCount.length} warns.`);
        warnchannel.send(warnEmbed).catch(error => {
            message.reply("I was unable to type in #mod-actions, so i will post it here.");
            message.channel.send(warnEmbed);
        });

        AWMember.send(warnEmbed);
    };
}