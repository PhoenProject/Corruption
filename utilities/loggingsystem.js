const Discord = require("discord.js");
const moment = require("moment");
const bot = require('../CorruptionBot.js')

//#region Message logging
module.exports.MessageDeleted = (client, message, sqlcon) => {
    GetLoggingStatus(sqlcon, message.guild.id, function (LogObject) {
        setTimeout(function () {
            if (!LogObject.MessageLogging || !LogObject.MessageLoggingChannel) return

            let logs = message.guild.fetchAuditLogs({ type: 72 }).catch(O_o => { });

            let mlogchannel = message.guild.channels.find((channel => channel.id === LogObject.MessageLoggingChannel));
            if (mlogchannel == null) return

            if (message.member == null || message.member.displayHexColor == null) color = '#6fa1f2'
            else color = message.member.displayHexColor

            const sInfo = new Discord.RichEmbed()
                .setAuthor(`${message.author.tag} - Deleted message`, message.author.avatarURL)
                .setColor(color)
                .setTimestamp()
                .addField("Channel", message.channel, true);
            if (logs.entries != undefined) {
                let entry = logs.entries.first();
                if (entry.createdTimestamp > (Date.now() - 5000)) sInfo.addField("Deleted By", entry.executor, true)
            }
            if (message.attachments.first() !== undefined) {
                let aName = message.attachments.first().filename
                sInfo.addField("Attatchment", aName, true)
            }
            if (message.content) sInfo.setDescription(message.content)
            mlogchannel.send(sInfo).catch(O_o => { console.log("ERROR!!!!!") });
        }, 250)
    })
}
module.exports.MessageEdited = (client, oldMSG, newMSG, sqlcon) => {
    GetLoggingStatus(sqlcon, oldMSG.guild.id, function (LogObject) {

        if (!LogObject.MessageLogging || !LogObject.MessageLoggingChannel) return

        let mlogchannel = oldMSG.guild.channels.find((channel => channel.id === LogObject.MessageLoggingChannel));
        if (mlogchannel == null) return;

        let color = oldMSG.member.displayHexColor;
        if (color == null) color = "#e450f4";

        if (oldMSG.toString().length > 1024) oldMSG = oldMSG.toString().slice(1023);
        if (newMSG.toString().length > 1024) newMSG = newMSG.toString().slice(1023);

        const sInfo = new Discord.RichEmbed()
            .setAuthor(`${oldMSG.member.tag} - Message Edited`, oldMSG.author.avatarURL)
            .setDescription(oldMSG)
            .setColor(color)
            .setTimestamp()
            .addField("New message:", `${newMSG}`)
            .addField("Channel", oldMSG.channel);
        mlogchannel.send(sInfo).catch(O_o => { });
    })
}
//#endregion

//#region Member logging
module.exports.MemberAdd = (client, member, sqlcon) => {
    GetLoggingStatus(sqlcon, member.guild.id, function (LogObject) {
        if (!LogObject.MemberLogging || !LogObject.MemberLoggingChannel) return;

        let mlogchannel = member.guild.channels.find((channel => channel.id === LogObject.MemberLoggingChannel));
        if (mlogchannel == null) return

        let User = client.users.find(user => user.id === member.id);
        var cdate = moment(new Date(User.createdAt));
        let Guild = member.guild;
        let ageS = moment(cdate).fromNow(true)
        let ageA = ageS.split(" ");


        const sInfo = new Discord.RichEmbed()
            .setAuthor(`${member.displayName}`)
            .setDescription(member + " **has joined the guild**")
            .setColor('#e450f4')
            .setFooter(`User ID: ${member.id}`)
            .setTimestamp()
            .setThumbnail(member.user.avatarURL)
            .addField("Total members", `${Guild.memberCount}`, true)
            .addField("Creation Date:", `${cdate.format("MMMM Do YYYY HH:mm")}\n(${moment(cdate).fromNow()})`, true);

        if (ageA[2] === "seconds" || ageA[1] === "minute" || ageA[1] === "minutes" || ageA[1] === "hour" || ageA[1] === "hours" || ageA[1] === "day" || ageA[1] === "days") {
            if (!Guild.roles.find(role => role.name === "Anti-Alt")) MakeAntiAlt(member);
            sInfo.addField("WARNING!", "This account is less than 30 days old, so has been given the Anti-Alt role")
            let Role = member.guild.roles.find(role => role.name === "Anti-Alt")
            member.addRole(Role).catch(O_o => { });

            member.send(`Thank you for joining ${member.guild.name}, but due to your account age, you have been given the Anti-Alt role which limits your permissions.`)
        }

        mlogchannel.send(sInfo)
    })
}
module.exports.MemberRemove = (client, member, sqlcon) => {
    GetLoggingStatus(sqlcon, member.guild.id, function (LogObject) {

        if (!LogObject.MemberLogging || !LogObject.MemberLoggingChannel) return;

        let logs = member.guild.fetchAuditLogs({ type: 20, limit: 1 }).catch(O_o => { });

        let mlogchannel = member.guild.channels.find((channel => channel.id === LogObject.MemberLoggingChannel));
        if (mlogchannel == null) return

        const sInfo = new Discord.RichEmbed()
            .setDescription(member + " **has left the guild**")
            .setAuthor(`${member.displayName}`)
            .setColor(member.displayHexColor)
            .setFooter(`User ID: ${member.id}`)
            .setTimestamp()
            .setThumbnail(member.user.avatarURL)
            .addField("Total members", `${member.guild.memberCount}`, true)
        mlogchannel.send(sInfo)

        if (logs.entries != undefined) {
            let entry = logs.entries.first();
            let warnchannel = member.guild.channels.find((channel => channel.id === LogObject.ModLoggingChannel));
            if (entry.createdTimestamp > (Date.now() - 5000)) {
                let Reason = entry.reason
                if (!entry.reason) Reason = "No reason given!"
                let muteEmbed = new Discord.RichEmbed()
                    .setAuthor(`${member.user.tag} has been kicked`, member.user.avatarURL)
                    .setColor(member.displayHexColor)
                    .setFooter(`UserID: ${member.user.id}`)
                    .setTimestamp()
                    .setThumbnail(member.user.avatarURL)
                    .addField(`Kick:`,
                        `Kicked by ${entry.executor}`
                        + `\n**Time of kick:** ${moment(Date.now()).format('DD MMM YYYY, HH:mm')}`
                        + `\nReason: ${Reason}`);
                warnchannel.send(muteEmbed)
            }
        }
    })
}
module.exports.MemberUpdate = (client, oldMem, newMem, sqlcon) => {
    if(oldMem.nickname == newMem.nickname) return
    GetLoggingStatus(sqlcon, oldMem.guild.id, function (LogObject) {

        if (!LogObject.MemberLogging || !LogObject.MemberLoggingChannel) return;

        let mlogchannel = oldMem.guild.channels.find((channel => channel.id === LogObject.MemberLoggingChannel));
        if (mlogchannel == null) return;

        const sInfo = new Discord.RichEmbed()
            .setAuthor(`${oldMem.user.tag} - Nickname Updated`, oldMem.user.avatarURL)
            .setColor(oldMem.displayHexColor)
            .setTimestamp()
        if (oldMem.nickname === null) sInfo.addField("Old nickname", "None")
        else sInfo.addField("Old nickname", oldMem.nickname)
        if (newMem.nickname === null) sInfo.addField("New nickname", "None")
        else sInfo.addField("New nickname", newMem.nickname)
        mlogchannel.send(sInfo).catch(O_o => { });
    })
}
module.exports.AddBan = (client, member, sqlcon) => {
    GetLoggingStatus(sqlcon, member.guild.id, function (LogObject) {

        if (!LogObject.ModLogging || !LogObject.ModLoggingChannel) return;

        let logs = member.guild.fetchAuditLogs({ type: 22, limit: 1 }).catch(O_o => { });
        if (logs.entries == undefined) return
        let entry = logs.entries.first();

        let warnchannel = guild.channels.find((channel => channel.id === LogObject.ModLoggingChannel));
        if (warnchannel == undefined) return

        if (entry.createdTimestamp > (Date.now() - 5000)) {
            let Reason = entry.reason
            if (!entry.reason) Reason = "No reason given!"
            let muteEmbed = new Discord.RichEmbed()
                .setAuthor(`${user.username}#${user.discriminator} has been banned`, user.avatarURL)
                .setColor(user.displayHexColor)
                .setFooter(`UserID: ${user.id}`)
                .setTimestamp()
                .setThumbnail(user.avatarURL)
                .addField(`Ban:`,
                    `Banned by ${entry.executor}`
                    + `\n**Time of ban:** ${moment(Date.now()).format('DD MMM YYYY, HH:mm')}`
                    + `\nReason: ${Reason}`);
            warnchannel.send(muteEmbed)
        }
    })
}
//#endregion


function GetLoggingStatus(sqlcon, ID, Callback) {
    let LogObject = new Object()
    sqlcon.query(`SELECT * FROM guildprefs WHERE GuildID = ?`, [ID], (err, logs) => {
        if (!logs || logs.length < 1) return false

        if (logs[0].MemLog == 1) LogObject.MemberLogging = true;
        else LogObject.MemberLogging = false;
        LogObject.MemberLoggingChannel = logs[0].MemLogChan;

        if (logs[0].MsgLog == 1) LogObject.MessageLogging = true;
        else LogObject.MessageLogging = false;
        LogObject.MessageLoggingChannel = logs[0].MsgLogChan;

        if (logs[0].ModLog == 1) LogObject.ModLogging = true;
        else LogObject.ModLogging = false;
        LogObject.ModLoggingChannel = logs[0].ModLogChan;

        return Callback(LogObject);
    })
}
function MakeAntiAlt(member) {
    member.guild.createRole({
        name: "Anti-Alt",
        color: `#df6968`,
        hoist: false,
        position: 9,
        permissions: [],
        mentionable: false
    }).catch(error => { return member.reply(`Sorry, i was unable to execute that command. ${error}`) });
    setTimeout(function () {
        let Guild = member.guild
        let blarg = Guild.channels.filter(channel => channel.type === "text")
        blarg.forEach(f => {
            let mrole = member.guild.roles.find(role => role.name === "Anti-Alt").id
            f.overwritePermissions(mrole, {
                ATTACH_FILES: false,
                EMBED_LINKS: false,
                ADD_REACTIONS: false,
                USE_EXTERNAL_EMOJIS: false,
                CREATE_INSTANT_INVITE: false,
            })
        });
    }, 300);
}