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

    utils.GetUser(client, message, MsgContent[0], function (targetMember) {
        if (!targetMember) targetMember = message.member;

        sqlcon.query(`SELECT * FROM Warns WHERE GuildID = ? AND UserID = ?`, [message.guild.id, targetMember.id], (err, warnings) => {
            if (err) return utils.ConsoleMessage(err, `error`);
            if (warnings.length < 1) return message.channel.send(`That user has no warnings`);

            if (targetMember.displayHexColor == '#000000') EmbedColour = (`#17A589`);
            else EmbedColour = targetMember.displayHexColor;

            let warnEmbed = new Discord.RichEmbed()
                .setAuthor(`Warnings for ${targetMember.user.tag}`, targetMember.user.avatarURL)
                .setColor(EmbedColour)
                .setFooter(`UserID: ${targetMember.id}`)
                .setTimestamp()
                .setThumbnail(targetMember.user.avatarURL);
            (warnings).forEach(element => {
                warnEmbed.addField(`Warn ${warnings.indexOf(element) + 1} of ${warnings.length}`,
                    `Issued by <@${element.Issuer}>`
                    + `\n**Issue Time:** ${element.Timestamp}`
                    + `\nReason: ${element.Reason}`
                    + `\n[Link to warning](https://discordapp.com/channels/${element.GuildID}/${element.ChannelID}/${element.MessageID})`)
            });
            message.channel.send(`Showing warnings for ${targetMember.user.tag}`, { embed: warnEmbed });

        })
    })
}

module.exports.config = {
    name: "listwarns", //Name of the command that will be used to call it
    aliases: ["showwarns", "listwarns", "warns"], //Aliases of the command that can be used (This must NEVER be left empty)
    info: "Lists all warns for a user", //Short description of the command that will show on all help embeds
    type: "info",  //Category in the ?help embed where this command will be visible
    subcommands: [""], //List of sub commands awailable. Help shouldn't ever be included in this list
    perms: [""], //Permissions required for this command
    hidden: false, //Should this command be shown in ?help
    enabled: true //Should this command be allowed to be triggered
}