const Discord = require("discord.js");
const moment = require("moment");
const dscp = require('./DragonSCP.js');

const utils = require('./BaseBotFunction.js');

const embedColours = [
    `#A93226`,
    `#CB4335 `,
    `#884EA0 `,
    `#7D3C98`,
    `#2471A3`,
    `#2E86C1`,
    `#17A589`,
    `#138D75`,
    `#229954`,
    `#28B463`,
    `#D4AC0D`,
    `#D68910`,
    `#CA6F1E`,
    `#BA4A00`,
    `#A6ACAF`
];

//#region Message logging
module.exports.MessageDeleted = (client, message, sqlcon) => {
    GetLoggingStatus(sqlcon, message.guild.id, function (LogObject) {
        setTimeout(function () {
            if (!LogObject.MessageLogging || !LogObject.MessageLoggingChannel) return

            let logs = message.guild.fetchAuditLogs({ type: 72 }).catch(error => { utils.ConsoleMessage(error, `error`); });

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
            mlogchannel.send(sInfo).catch(error => { utils.ConsoleMessage(error, `error`) });
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
            .setAuthor(`${oldMSG.author.tag} - Message Edited`, oldMSG.author.avatarURL)
            .setDescription(oldMSG)
            .setColor(color)
            .setTimestamp()
            .addField("New message:", `${newMSG}`)
            .addField("Channel", oldMSG.channel);
        mlogchannel.send(sInfo).catch(error => { utils.ConsoleMessage(error, `error`) });
    })
}
//#endregion

//#region Member logging
module.exports.MemberAdd = (client, member, sqlcon) => {
    GetLoggingStatus(sqlcon, member.guild.id, function (LogObject) {
        if (!LogObject.MemberLogging || !LogObject.MemberLoggingChannel) return;

        let mlogchannel = member.guild.channels.find((channel => channel.id === LogObject.MemberLoggingChannel));
        if (mlogchannel == null) return

        var cdate = moment(new Date(member.user.createdAt));
        var NowDate = moment(new Date(moment().format()));
        let Guild = member.guild;

        const Colour = Math.floor(Math.random() * (embedColours.length - 1) + 1);

        const sInfo = new Discord.RichEmbed()
            .setAuthor(`${member.user.tag}`)
            .setDescription(member + " has joined the server")
            .setColor(embedColours[Colour])
            .setFooter(`User ID: ${member.id}`)
            .setTimestamp()
            .setThumbnail(member.user.avatarURL)
            .addField("Total members", `${Guild.memberCount}`, true)
            .addField("Creation Date:", `${cdate.format("MMMM Do YYYY HH:mm")}\n(${moment(cdate).fromNow()})`, true);

        if (NowDate.diff(cdate, 'days') < 31) {
            if (!Guild.roles.find(role => role.name === "Anti-Alt")) MakeAntiAlt(member);
            sInfo.addField("WARNING!", "This account is less than 30 days old, so has been given the Anti-Alt role")
            let Role = member.guild.roles.find(role => role.name === "Anti-Alt")
            member.addRole(Role).catch(error => { utils.ConsoleMessage(error, `error`); });

            member.send(`Thank you for joining ${member.guild.name}, but due to your account age, you have been given the Anti-Alt role which limits your permissions.`)
        }

        mlogchannel.send(sInfo)


        
    })
}
module.exports.MemberRemove = (client, member, sqlcon) => {
    GetLoggingStatus(sqlcon, member.guild.id, async function (LogObject) {

        if (!LogObject.MemberLogging || !LogObject.MemberLoggingChannel) return;

        let logs = await member.guild.fetchAuditLogs({ type: 20, limit: 1 }).catch(error => { utils.ConsoleMessage(error, `error`); });

        let mlogchannel = member.guild.channels.find((channel => channel.id === LogObject.MemberLoggingChannel));
        if (mlogchannel == null) return

        const Colour = Math.floor(Math.random() * (embedColours.length - 1) + 1);

        let EmbedColour;
        if(member.displayHexColor == '#000000' ) EmbedColour = embedColours[Colour];
        else EmbedColour = member.displayHexColor;

        const sInfo = new Discord.RichEmbed()
            .setDescription(member + " has left the server")
            .setAuthor(`${member.user.tag}`)
            .setColor(EmbedColour)
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
                    .setAuthor(`${member.user.tag}`, member.user.avatarURL)
                    .setDescription(`${member} has been kicked from the server`)
                    .setColor(EmbedColour)
                    .setFooter(`UserID: ${member.user.id}`)
                    .setTimestamp()
                    .setThumbnail(member.user.avatarURL)
                    .addField(`Kick information:`,
                        `Kicked by ${entry.executor}`
                        + `\n**Time of kick:** ${moment(Date.now()).format('DD MMM YYYY, HH:mm')}`
                        + `\nReason: ${Reason}`);
                        
                warnchannel.send(muteEmbed)
            }
        }
    })
}
module.exports.MemberUpdate = (client, oldMem, newMem, sqlcon) => {

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
        mlogchannel.send(sInfo).catch(error => { utils.ConsoleMessage(error, `error`); });
    })

    if(oldMem.guild.id == "403155047527088129") dscp.PatreonMessage(client, oldMem, newMem, sqlcon);
}
module.exports.AddBan = (client, member, guild, sqlcon) => {
    GetLoggingStatus(sqlcon, guild.id, async function (LogObject) {

        if (!LogObject.ModLogging || !LogObject.ModLoggingChannel) return;

        let warnchannel = await guild.channels.find((channel => channel.id === LogObject.ModLoggingChannel));
        if (warnchannel == undefined) return

        let logs = await guild.fetchAuditLogs({ type: 22, limit: 1 }).catch(error => { utils.ConsoleMessage(error, `error`); });

        if (logs.entries == undefined) return
        let entry = logs.entries.first();

        if (entry.createdTimestamp < (Date.now() - 5000)) return;

        const Colour = Math.floor(Math.random() * (embedColours.length - 1) + 1);

        let Reason = entry.reason
        if (!entry.reason) Reason = "No reason given!"

        let muteEmbed = new Discord.RichEmbed()
            .setAuthor(`${member.tag}`, member.avatarURL)
            .setDescription(`${member} has been banned from the server`)
            .setColor(embedColours[Colour])
            .setFooter(`UserID: ${member.id}`)
            .setTimestamp()
            .setThumbnail(member.avatarURL)
            .addField(`Ban information:`,
                `Banned by ${entry.executor}`
                + `\n**Time of ban:** ${moment(Date.now()).format('DD MMM YYYY, HH:mm')}`
                + `\nReason: ${Reason}`);

        warnchannel.send(muteEmbed)
    })
}
module.exports.RemoveBan = (client, user, guild, sqlcon) => {
    GetLoggingStatus(sqlcon, guild.id, async function (LogObject) {

        if (!LogObject.ModLogging || !LogObject.ModLoggingChannel) return;

        let warnchannel = await guild.channels.find((channel => channel.id === LogObject.ModLoggingChannel));
        if (warnchannel == undefined) return

        let logs = await guild.fetchAuditLogs({ type: 23, limit: 1 }).catch(error => { utils.ConsoleMessage(error, `error`); });

        if (logs.entries == undefined) return
        let entry = logs.entries.first();

        if (entry.createdTimestamp < (Date.now() - 5000)) return;

        const Colour = Math.floor(Math.random() * (embedColours.length - 1) + 1);
        let muteEmbed = new Discord.RichEmbed()
        .setAuthor(`${user.tag}`, user.avatarURL)
        .setDescription(`${user} has been unbanned from the server`)
            .setColor(embedColours[Colour])
            .setFooter(`UserID: ${user.id}`)
            .setTimestamp()
            .setThumbnail(user.avatarURL)
            .addField(`Unban information:`,
                `Unbanned by ${entry.executor}`
                + `\n**Time of unban:** ${moment(Date.now()).format('DD MMM YYYY, HH:mm')}`);
        warnchannel.send(muteEmbed)

    })
}
//#endregion

function GetLoggingStatus(sqlcon, ID, Callback) {
    let LogObject = new Object()
    sqlcon.query(`SELECT * FROM GuildPrefs WHERE GuildID = ?`, [ID], (err, logs) => {
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