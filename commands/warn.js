const utils = require('../utilities/BaseBotFunction.js');
const moment = require("moment");
const Discord = require("discord.js");

module.exports.run = async (client, message, MsgContent, prefix, sqlcon) => {
    if (!this.config.enabled) return utils.ConsoleMessage(`${message.author.id} tried to trigger disabled command ${this.config.name}`, `info`)

    switch (!MsgContent[0] ? MsgContent[0] : MsgContent[0].toString().toLowerCase()) {
        case "help":
            utils.HelpMessage(client, message, prefix, this.config.name, this.config.subcommands, this.config.info, this.config.perms);
            break;
        default:
            Action(client, message, this.config.perms[1], MsgContent, sqlcon)
            break;

    }
}

async function Action(client, message, perm, MsgContent, sqlcon) {

    if (!message.member.hasPermission(perm)) return;
    if (!MsgContent[0]) return message.channel.send("You need to specify a user!");

    utils.GetUser(client, message, MsgContent[0], function (targetMember) {
        if(!targetMember) return message.channel.send(`Unable to find user ${MsgContent[0]}`);

        utils.CheckCanAct(client, message.member, targetMember, "warn", function (CanAct) {
            if (CanAct !== "CanAct") return message.channel.send(CanAct);

            if (!MsgContent[1]) return message.channel.send("You need to specify a reason!");

            let reason = MsgContent.slice(1).join(" ");

            return AddWarn(client, reason, targetMember.user, targetMember, moment(Date.now()).format('DD MMM YYYY, HH:mm'), message.author, sqlcon, message);
        })
    })
}

function AddWarn(client, Reason, WarnUser, WarnMember, IssueTime, Issuer, sqlcon, message) {
    sqlcon.query(`INSERT INTO Warns (GuildID, UserID, Reason, Timestamp, Issuer, ChannelID, MessageID) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [message.guild.id, WarnUser.id, Reason, IssueTime, Issuer.id, message.channel.id, message.id]);

    setTimeout(() => {
        sqlcon.query(`SELECT * FROM Warns WHERE UserID = ? AND GuildID = ?`, [WarnMember.id, message.guild.id], (err, WarnCount) => {
            let WarnEmbed = new Discord.RichEmbed()
                .setAuthor(`Warn issued for ${WarnUser.tag}`, WarnUser.avatarURL)
                .setColor(WarnMember.displayHexColor)
                .setFooter(`UserID: ${WarnUser.id}`)
                .setTimestamp()
                .setThumbnail(WarnUser.avatarURL)
                .addField(`Total warnings`, WarnCount.length)
                .addField(`Warning:`, `Issued by: ${Issuer}\n**Issue Time:** ${IssueTime}\nReason: ${Reason}`
                    + `\n[Link to warning](https://discordapp.com/channels/${message.guild.id}/${message.channel.id}/${message.id})`);
            sqlcon.query(`SELECT * FROM GuildPrefs WHERE GuildID = ${message.guild.id}`, (Error, ModLog) => {
                let warnchannel = message.guild.channels.find((channel => channel.id === ModLog[0].ModLogchan));
                if (warnchannel == null) return;

                warnchannel.send(WarnEmbed).catch(error => { utils.ConsoleMessage(error, `error`) });
            })

            WarnMember.send(WarnEmbed).catch(error => { utils.ConsoleMessage(error + ` (${WarnMember.id})`, `error`) });

            message.channel.send(`${WarnMember} now has ${WarnCount.length} ${WarnCount.length > 2 ? "warns" : "warn"}`)

            return HandlePunishment(WarnMember, WarnCount.length, message);
        })
    }, 200)
}

function HandlePunishment(WarnMember, WarnCount, message) {
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
            WarnMember.addRole(guild.roles.find(role => role.name === "Warned")).catch(error => utils.ConsoleMessage(error, `error`));
        }, 200)
    }
    else if (WarnCount === 2) {
        WarnMember.kick("Automatic kick for reaching 2 warnings")
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
            WarnMember.addRole(guild.roles.find(role => role.name === "Muted"))
                .then(() => { message.channel.send(`${WarnMember} has been muted!`) })
                .catch(error => utils.ConsoleMessage(error, `error`));
        }, 200)
    }
    else if (WarnCount >= 5) {
        WarnMember.ban("Automatic ban for reaching 5 warns")
            .then(() => { message.channel.send(`${WarnMember} has been banned from the server!`) })
            .catch(error => utils.ConsoleMessage(error, `error`));
    };
}

module.exports.config = {
    name: "warn", //Name of the command that will be used to call it
    aliases: ["bap"], //Aliases of the command that can be used (This must NEVER be left empty)
    info: "Warns a user for breaking the rules. 1 warn will result in a warned role being applied for 2 weeks. 2 warns will result in a kick and the warned role being applied for 4 weeks. 3 and/or 4 warns will result in a mute, and 5 results in a ban.", //Short description of the command that will show on all help embeds
    type: "mod",  //Category in the ?help embed where this command will be visible
    subcommands: [""], //List of sub commands awailable. Help shouldn't ever be included in this list
    perms: ["MANAGE_MESSAGES"], //Permissions required for this command
    hidden: false, //Should this command be shown in ?help
    enabled: true //Should this command be allowed to be triggered
}