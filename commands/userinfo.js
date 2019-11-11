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
            Action(client, message, this.config.perms[0], MsgContent, sqlcon)
            break;

    }
}

async function Action(client, message, perm, MsgContent, sqlcon) {
    utils.GetUser(client, message, MsgContent[0], function (targetMember) {
        if (!targetMember) targetMember = message.member;

        var NowDate = moment(new Date(moment().format()));
        var JoinDate = moment(new Date(targetMember.joinedAt.toUTCString()));
        var CreationDate = moment(new Date(targetMember.user.createdAt.toUTCString()));

        if (targetMember.displayHexColor == '#000000') EmbedColour = (`#17A589`);
        else EmbedColour = targetMember.displayHexColor;

        let UserInfoEmbed = new Discord.RichEmbed()
            .setAuthor(`${targetMember.user.tag}${targetMember.nickname === null ? "" : ` (${targetMember.nickname})`}`)
            .setDescription(`Currently ${targetMember.presence.status === "online" ? "Online" : targetMember.presence.status === "idle" ? "Idle" : targetMember.presence.status === "dnd" ? "on DnD (Do not Disturb)" : "Offline"}`)
            .setThumbnail(targetMember.user.displayAvatarURL)
            .setColor(EmbedColour)
            .setFooter(`UserID: ${targetMember.user.id}`)
            .addField(`Creation date`, `${CreationDate.format('DD MMM YYYY, HH:mm')}\n(${NowDate.diff(CreationDate, `days`)} days ago)`, true)
            .addField(`Join date`, `${JoinDate.format('DD MMM YYYY, HH:mm')}\n(${NowDate.diff(JoinDate, `days`)} days ago)`, true);

        sqlcon.query(`SELECT * FROM Warns WHERE GuildID = ? AND UserID = ?`, [message.guild.id, targetMember.id], (err, warnings) => {
            if (err) return utils.ConsoleMessage(err, `error`);

            UserInfoEmbed.addField(`Warnings`, `Currently has ${warnings.length} ${warnings.length === 1 ? "warning" : "warnings"}`)

            setTimeout(() => {
                message.channel.send(UserInfoEmbed);
            }, 500);
        })
    })
}

module.exports.config = {
    name: "userinfo", //Name of the command that will be used to call it
    aliases: ["uinfo", "useri"], //Aliases of the command that can be used (This must NEVER be left empty)
    info: "Shows a user's information, such as creation date, and join date", //Short description of the command that will show on all help embeds
    type: "info",  //Category in the ?help embed where this command will be visible
    subcommands: [""], //List of sub commands awailable. Help shouldn't ever be included in this list
    perms: [""], //Permissions required for this command
    hidden: false, //Should this command be shown in ?help
    enabled: true //Should this command be allowed to be triggered
}