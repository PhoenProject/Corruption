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
    if (!message.member.hasPermission(perm)) return;
    if (!MsgContent[0]) return message.channel.send("You need to specify a user!");

    utils.GetUser(client, message, MsgContent[0], function (targetMember) {
        if(!targetMember) return message.channel.send(`Unable to find user ${MsgContent[0]}`);

        let reason

        utils.CheckCanAct(client, message.member, targetMember, "kick", function (CanAct) {
            if (CanAct !== "CanAct") return message.channel.send(CanAct)

            if (!MsgContent[1]) reason = "No reason given"
            else reason = MsgContent.slice(1).join(" ")

            targetMember.kick(`Action requested by ${message.author.username} (${message.author.id}): ${reason}`)
                .then(() => { message.channel.send(targetMember + ` has been kicked`) })
                .catch(error => { message.channel.send(`I was unable to kick this user: ${error}`); return utils.ConsoleMessage(error, `error`) });
        })
    })
}

module.exports.config = {
    name: "kick", //Name of the command that will be used to call it
    aliases: ["boot", "remove"], //Aliases of the command that can be used (This must NEVER be left empty)
    info: "Kicks the user from the server", //Short description of the command that will show on all help embeds
    type: "mod",  //Category in the ?help embed where this command will be visible
    subcommands: [""], //List of sub commands awailable. Help shouldn't ever be included in this list
    perms: ["KICK_MEMBERS"], //Permissions required for this command
    hidden: true, //Should this command be shown in ?help
    enabled: true //Should this command be allowed to be triggered
}