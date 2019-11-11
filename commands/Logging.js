const utils = require('../utilities/BaseBotFunction.js');
const moment = require("moment");
const Discord = require("discord.js");

module.exports.run = async (client, message, MsgContent, prefix, sqlcon) => {
    if (!this.config.enabled) return utils.ConsoleMessage(`${message.author.id} tried to trigger disabled command ${this.config.name}`, `info`)

    switch (!MsgContent[0] ? MsgContent[0] : MsgContent[0].toString().toLowerCase()) {
        default:
            utils.HelpMessage(client, message, prefix, this.config.name, this.config.subcommands, this.config.info, this.config.perms);
            break;
        case "message":
            Message(client, message, this.config.perms[0], MsgContent, sqlcon)
            break;
        case "messagechannel":
            Message(client, message, this.config.perms[0], MsgContent, sqlcon)
            break;
        case "member":
            Message(client, message, this.config.perms[0], MsgContent, sqlcon)
            break;
        case "memberchannel":
            Message(client, message, this.config.perms[0], MsgContent, sqlcon)
            break;
        case "mod":
            Message(client, message, this.config.perms[0], MsgContent, sqlcon)
            break;
        case "modchannel":
            Message(client, message, this.config.perms[0], MsgContent, sqlcon)
            break;
        case "channel":
            Message(client, message, this.config.perms[0], MsgContent, sqlcon)
            break;
    }
}

async function Message(client, message, perm, MsgContent, sqlcon) {
    if (!message.member.hasPermission(perm)) return;
    if (!MsgContent[0]) return message.channel.send("You need to specify a user!");

    utils.GetUser(client, message, MsgContent[0], function (targetMember) {
        let reason

        utils.CheckCanAct(client, message.member, targetMember, "", function (CanAct) {
            if (CanAct !== "CanAct") return message.channel.send(CanAct);

            if (!MsgContent[1]) reason = "No reason given"
            else reason = MsgContent.slice(1).join(" ")
        })
    })
}

module.exports.config = {
    name: "logging", //Name of the command that will be used to call it
    aliases: ["logs"], //Aliases of the command that can be used (This must NEVER be left empty)
    info: "mod", //Short description of the command that will show on all help embeds
    type: "Configures the logging system of Corruption",  //Category in the ?help embed where this command will be visible
    subcommands: ["message", "member", "messagechannel", "memberchannel", "mod", "modchannel", "channel"], //List of sub commands awailable. Help shouldn't ever be included in this list
    perms: ["MANAGE_GUILD"], //Permissions required for this command
    hidden: false, //Should this command be shown in ?help
    enabled: false //Should this command be allowed to be triggered
}