const utils = require('../utilities/BaseBotFunction.js');
const moment = require("moment");
const Discord = require("discord.js");

module.exports.run = async (client, message, MsgContent, prefix, sqlcon) => {
    if (!this.config.enabled) return utils.ConsoleMessage(`${message.author.id} tried to trigger disabled command ${this.config.name}`, `info`)

    switch (!MsgContent[0] ? MsgContent[0] : MsgContent[0].toString().toLowerCase()) {
        case "enable":
            Enable(client, message, this.config.perms[0], MsgContent, sqlcon);
            break;
        case "disable":
            Disable(client, message, this.config.perms[0], MsgContent, sqlcon);
            break;
        default:
            utils.HelpMessage(client, message, prefix, this.config.name, this.config.subcommands, this.config.info, this.config.perms);
            break;

    }
}

async function Enable(client, message, perm, MsgContent, sqlcon) {
    if (!message.member.hasPermission(perm)) return;

    sqlcon.query(`INSERT INTO MsgVoteChan (ChannelID, UpVote, DownVote) VALUES (?,?,?)`, [message.channel.id, "👍", "👎"]);

    setTimeout(() => {
        sqlcon.query(`SELECT * FROM MsgVoteChan WHERE ChannelID = ?`, [message.channel.id], (err, query) => {
            if (err) return utils.ConsoleMessage(err, `error`)

            message.channel.send("This channel is now a message voting channel");
        })
    }, 200);
}

async function Disable(client, message, perm, MsgContent, sqlcon) {
    if (!message.member.hasPermission(perm)) return;

    sqlcon.query(`DELETE FROM MsgVoteChan WHERE ChannelID = ?`, [message.channel.id]);

    message.channel.send("This channel is no longer a message voting channel");
}

module.exports.config = {
    name: "msgvote", //Name of the command that will be used to call it
    aliases: ["messagevoting", "voting", "mvote"], //Aliases of the command that can be used (This must NEVER be left empty)
    info: "Changes the settings for message voting", //Short description of the command that will show on all help embeds
    type: "general",  //Category in the ?help embed where this command will be visible
    subcommands: ["enable", "disable"], //List of sub commands awailable. Help shouldn't ever be included in this list
    perms: ["MANAGE_GUILD"], //Permissions required for this command
    hidden: false, //Should this command be shown in ?help
    enabled: true //Should this command be allowed to be triggered
}