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
    if (!MsgContent[1]) return message.channel.send("You need to specify a warn you wish to remove. Use `*` to clear all warns")

    utils.GetUser(client, message, MsgContent[0], function (targetMember) {
        if(!targetMember) return message.channel.send(`Unable to find user ${MsgContent[0]}`);

        utils.CheckCanAct(client, message.member, targetMember, "warn", function (CanAct) {
            if (CanAct !== "CanAct") return message.channel.send(CanAct);

            sqlcon.query(`SELECT * FROM Warns WHERE UserID = ? AND GuildID = ?`, [targetMember.id, message.guild.id], (err, WarnCount) => {
                if (err) return utils.ConsoleMessage(err, `error`)

                let WarnNumber = parseInt(MsgContent[1])

                if (!WarnNumber|| WarnNumber > WarnCount.length) return message.channel.send(`Invalid warn number given`)

                sqlcon.query(`DELETE FROM Warns WHERE UserID = ? AND GuildID = ? AND MessageID = ?`, [targetMember.id, message.guild.id, WarnCount[WarnNumber - 1].MessageID])

                setTimeout(() => {
                    sqlcon.query(`SELECT * FROM Warns WHERE UserID = ? AND GuildID = ?`, [targetMember.id, message.guild.id], (err, Check) => {
                        if (err) return utils.ConsoleMessage(err, `error`)

                        if (Check.length < WarnCount.length) {
                            ClearPunishment(client, message, targetMember, Check.length)
                            return message.channel.send(`Warn number ${WarnNumber} has been removed from ${targetMember}`);
                        }
                        else {
                            message.channel.send(`I was unable to remove warns for ${targetMember}`);
                            return utils.ConsoleMessage(`I was unable to remove warns for ${targetMember.id}`, `error`)
                        }
                    })
                }, 200)


            })
        })
    })
}

function ClearPunishment(client, message, member, count) {
    let warned = message.guild.roles.find(role => role.name.toLowerCase() === "warned").id
    let muted = message.guild.roles.find(role => role.name.toLowerCase() === "muted").id

    if (member.roles.find(role => role.id === warned.id) && count < 1) member.removeRole(warned.id).catch(error => { utils.ConsoleMessage(error, `error`) });
    if (member.roles.find(role => role.id === muted.id) && count < 3) member.removeRole(muted.id).catch(error => { utils.ConsoleMessage(error, `error`) });
}

module.exports.config = {
    name: "removewarn", //Name of the command that will be used to call it
    aliases: ["delwarn"], //Aliases of the command that can be used (This must NEVER be left empty)
    info: "Removes a warn from a user", //Short description of the command that will show on all help embeds
    type: "mod",  //Category in the ?help embed where this command will be visible
    subcommands: [""], //List of sub commands awailable. Help shouldn't ever be included in this list
    perms: ["MANAGE_MESSAGES"], //Permissions required for this command
    hidden: false, //Should this command be shown in ?help
    enabled: true //Should this command be allowed to be triggered
}