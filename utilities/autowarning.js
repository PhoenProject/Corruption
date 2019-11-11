const Discord = require("discord.js");
const utils = require('./BaseBotFunction.js');
const moment = require("moment");

module.exports.globalfilter = (client, message, sqlcon) => {
    if (message.content.includes("filter remove") || message.content.includes("filter add") || message.member.hasPermission("ADMINISTRATOR") || message.member.hasPermission("MANAGE_GUILD")) return;

    sqlcon.query(`SELECT * FROM GuildPrefs WHERE GuildID = '${message.guild.id}'`, (err, rows) => {
        if (!rows[0].GlobalFilter) return;

        sqlcon.query(`SELECT * FROM GlobalFilter`, (err, words) => {
            let msg = message.content.toLowerCase()
            words.forEach(element => {

                if (!msg.includes(element.word)) return;

                message.delete().catch(error => { utils.ConsoleMessage(error, `error`) });
                return AddAutoWarn(client, "Saying a globally filtered word", message.author, message.member, moment(Date.now()).format('DD MMM YYYY, HH:mm'), sqlcon, message);
            });
        })
    })
}
module.exports.filter = (client, message, sqlcon) => {
    if (message.content.includes("filter remove") || message.content.includes("filter add") || message.member.hasPermission("ADMINISTRATOR") || message.member.hasPermission("MANAGE_GUILD")) return;

    sqlcon.query(`SELECT * FROM Filter WHERE GuildID = '${message.guild.id}'`, (err, filtered) => {
        if (filtered != undefined) {
            filtered.forEach(element => {
                if (!message.content.includes(element.word)) return;

                let AutoWarnReason = "Saying a filtered word"
                let AWUser = message.author
                let AWMember = message.member
                let issueTime = moment(Date.now()).format('DD MMM YYYY, HH:mm')
                AddAutoWarn(client, AutoWarnReason, AWUser, AWMember, issueTime, sqlcon, message)
                message.delete().catch(error => { utils.ConsoleMessage(error, `error`) })
            });
        }
    })
}
module.exports.massping = (client, message, sqlcon) => {
    if (!message.member.hasPermission("MANAGE_MESSAGES")) return;

    var cdate = moment(new Date(message.member.user.createdAt));

    let TotalMentions = message.mentions.members.size + message.mentions.roles.size
    if (cdate.diff(moment().format(), 'days') > 90) return;

    else if (TotalMentions > 2 && TotalMentions < 5) return message.reply("Please keep the noise down!");

    else if (TotalMentions > 4 && TotalMentions < 8) {
        let AutoWarnReason = "Massping of users/roles";
        let AWUser = message.author;
        let AWMember = message.member;
        let issueTime = moment(Date.now()).format('DD MMM YYYY, HH:mm');
        return AddAutoWarn(client, AutoWarnReason, AWUser, AWMember, issueTime, sqlcon, message);
    }
    else if (TotalMentions > 7) {
        message.member.ban("Automatic ban for mass pinging 8 or more users/roles").catch(error => { return utils.ConsoleMessage(error, `error`) });
        message.channel.send("User has been banned from the server!");
    }
}
module.exports.VIPPing = (client, message, sqlcon) => {
    if (message.content.includes("vip remove") || message.content.includes("vip del") || message.content.includes("vip add")
        || message.member.hasPermission("ADMINISTRATOR") || message.member.hasPermission("MANAGE_MESSAGES") || !message.mentions.members.first()) return;

    sqlcon.query(`SELECT * FROM VIPs WHERE GuildID = '${message.guild.id}'`, (err, VIPs) => {

        VIPs.forEach(VIP => {
            if (!message.mentions.members.has(VIP.MemberID)) return;

            message.delete().catch(error => { utils.ConsoleMessage(error, `error`) });
            return AddAutoWarn(client, `Pinging VIP ${message.guild.members.find(user => user.id === VIP.MemberID).user.tag}`, message.author, message.member, moment(Date.now()).format('DD MMM YYYY, HH:mm'), sqlcon, message);
        });
    })
}

function AddAutoWarn(client, AutoWarnReason, AWUser, AWMember, issueTime, sqlcon, message) {
    sqlcon.query(`INSERT INTO Warns (GuildID, UserID, Reason, Timestamp, Issuer, ChannelID, MessageID) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [message.guild.id, AWUser.id, AutoWarnReason, issueTime, client.user.id, message.channel.id, message.id]);

    setTimeout(() => {
        sqlcon.query(`SELECT * FROM Warns WHERE UserID = ? AND GuildID = ?`, [AWMember.id, message.guild.id], (err, WarnCount) => {

            let WarnEmbed = new Discord.RichEmbed()
                .setAuthor(`Warn issued for ${AWUser.tag}`, AWUser.avatarURL)
                .setColor(AWMember.displayHexColor)
                .setFooter(`UserID: ${AWUser.id}`)
                .setTimestamp()
                .setThumbnail(AWUser.avatarURL)
                .addField(`Total warnings`, WarnCount.length)
                .addField(`Warning:`, `Issued by: ${client.user}\n**Issue Time:** ${issueTime}\nReason: ${AutoWarnReason}`
                    + `\n[Link to warning](https://discordapp.com/channels/${message.guild.id}/${message.channel.id}/${message.id})`);

            sqlcon.query(`SELECT * FROM GuildPrefs WHERE GuildID = ${message.guild.id}`, (Error, ModLog) => {
                let warnchannel = message.guild.channels.find((channel => channel.id === ModLog[0].ModLogChan));
                if (warnchannel === null) return;

                warnchannel.send(WarnEmbed).catch(error => { utils.ConsoleMessage(error, `error`) });
            })

            AWMember.send(WarnEmbed).catch(error => { utils.ConsoleMessage(error + ` (${AWMember.id})`, `error`) });

            message.channel.send(`${message.author} now has ${WarnCount.length} ${WarnCount.length > 2 ? "warns" : "warn"}`)

            return HandlePunishment(client, AWMember, WarnCount.length, message);
        })
    }, 200)
}

function HandlePunishment(client, AWMember, WarnCount, message) {
    let guild = message.guild;

    if (WarnCount === 1) {
        let wRole = guild.roles.find(role => role.name === "Warned")
        if (!wRole) {
            guild.createRole({ name: "Warned", color: "DEFAULT", hoist: false, position: 8, permissions: [], mentionable: true })
                .catch(error => { return utils.ConsoleMessage(error, `error`) });

            setTimeout(function () {
                let wRoleNew = guild.roles.find(role => role.name === "Warned");

                guild.channels.filter(channel => channel.type === "text")
                    .forEach(Channel => { Channel.overwritePermissions(wRoleNew.id, { ATTACH_FILES: false, EMBED_LINKS: false }) });

            }, 100);
        }

        setTimeout(function () {
            AWMember.addRole(guild.roles.find(role => role.name === "Warned")).catch(error => utils.ConsoleMessage(error, `error`));
        }, 200)
    }
    else if (WarnCount === 2) {
        AWMember.kick("Automatic kick for reaching 2 warnings")
            .then(() => { message.channel.send("User has been kicked from the server!") })
            .catch(error => utils.ConsoleMessage(error, `error`));
    }
    else if (WarnCount >= 3 && WarnCount < 5) {
        let mRoleCheck = guild.roles.find(role => role.name === "Muted")
        if (!mRoleCheck) {
            guild.createRole({ name: "Muted", color: "LUMINOUS_VIVID_PINK", hoist: false, position: 9, permissions: [], mentionable: false })
                .catch(error => { return utils.ConsoleMessage(error, `error`) });

            setTimeout(function () {
                let mRoleNew = guild.roles.find(role => role.name === "Muted").id

                Guild.channels.filter(channel => channel.type === "text").forEach(TextChannel => { TextChannel.overwritePermissions(mRoleNew, { SEND_MESSAGES: false, ADD_REACTIONS: false }) });
                Guild.channels.filter(channel => channel.type === "voice").forEach(VoiceChannel => { VoiceChannel.overwritePermissions(mRoleNew, { CONNECT: false }) });

            }, 100);
        }

        setTimeout(function () {
            AWMember.addRole(guild.roles.find(role => role.name === "Muted"))
                .then(() => { message.channel.send(`${AWMember} has been muted!`) })
                .catch(error => utils.ConsoleMessage(error, `error`));
        }, 200)
    }
    else if (WarnCount >= 5) {
        AWMember.ban("Automatic ban for reaching 5 warns")
            .then(() => { message.channel.send(`${AWMember} has been banned from the server!`) })
            .catch(error => utils.ConsoleMessage(error, `error`));
    };
}