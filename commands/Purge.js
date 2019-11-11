const utils = require('../utilities/BaseBotFunction.js');
const moment = require("moment");
const Discord = require("discord.js");

module.exports.run = async (client, message, MsgContent, prefix, sqlcon) => {
    if (!this.config.enabled) return utils.ConsoleMessage(`${message.author.id} tried to trigger disabled command ${this.config.name}`, `info`)

    switch (!MsgContent[0] ? MsgContent[0] : MsgContent[0].toString().toLowerCase()) {
        case "count":
            Count(client, message, this.config.perms[0], MsgContent, sqlcon)
            break;
        case "after":
            After(client, message, this.config.perms[0], MsgContent, sqlcon)
            break;
        default:
            utils.HelpMessage(client, message, prefix, this.config.name, this.config.subcommands, this.config.info, this.config.perms);
            break;

    }
}

async function Count(client, message, perm, MsgContent, sqlcon) {
    if (!message.member.hasPermission(perm)) return;

    if (!MsgContent[1]) return message.channel.send("You need to give a message ID")

    let Count;
    Count = parseInt(MsgContent[1]) + 1

    if (Count < 100) return message.channel.bulkDelete(Count);
    else {
        message.channel.fetchMessages({ limit: Count }).then(messages => {
            messages.forEach(element => {
                if (!element.pinned) element.delete().catch(e => { utils.ConsoleMessage(e, "error") });
            });
        }).catch(e => { utils.ConsoleMessage(e, "error") });
    }
}

async function After(client, message, perm, MsgContent, sqlcon) {
    if (!message.member.hasPermission(perm)) return;

    if (!MsgContent[1]) return message.channel.send("You need to give a message ID")

    message.channel.fetchMessages({ after: MsgContent[1] }).then(messages => {
        messages.forEach(element => {
            if (!element.pinned) element.delete().catch(e => { utils.ConsoleMessage(e, "error") });
        });
    }).catch(e => { utils.ConsoleMessage(e, "error") });
}

module.exports.config = {
    name: "purge", //Name of the command that will be used to call it
    aliases: ["cleanup", "clear", "wipe"], //Aliases of the command that can be used (This must NEVER be left empty)
    info: "Bulk deletes messages", //Short description of the command that will show on all help embeds
    type: "mod",  //Category in the ?help embed where this command will be visible
    subcommands: ["count", "after"], //List of sub commands awailable. Help shouldn't ever be included in this list
    perms: ["MANAGE_MESSAGES"], //Permissions required for this command
    hidden: false, //Should this command be shown in ?help
    enabled: true //Should this command be allowed to be triggered
}