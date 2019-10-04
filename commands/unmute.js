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

        utils.CheckCanAct(client, message.member, targetMember, "mute", function (CanAct) {
            if (CanAct !== "CanAct") return message.channel.send(CanAct);


            let mRole = message.guild.roles.find(role => role.name.toLowerCase() === "muted")

            setTimeout(() => {
                if (!targetMember.roles.has(mRole.id)) return message.channel.send("User is not muted.")
                targetMember.removeRole(mRole).then(() => {

                    let muteEmbed = new Discord.RichEmbed()
                        .setAuthor(`Unmuted ${targetMember.user.tag}`, targetMember.user.avatarURL)
                        .setColor(targetMember.displayHexColor)
                        .setFooter(`UserID: ${targetMember.user.id}`)
                        .setTimestamp()
                        .setThumbnail(targetMember.user.avatarURL)
                        .addField(`Unmute:`,
                            `Unmuted by ${message.author}`
                            + `\n**Issue Time:** ${moment(Date.now()).format('DD MMM YYYY, HH:mm')}`);

                    message.channel.send(`${targetMember} has been unmuted!`)


                    sqlcon.query(`SELECT * FROM GuildPrefs WHERE GuildID = ${message.guild.id}`, (error, ModLog) => {
                        if(error) return utils.ConsoleMessage(error, `error`);
                        let warnchannel = message.guild.channels.find((channel => channel.id === ModLog[0].ModLogchan));
                        if (warnchannel == null) return;

                        warnchannel.send(muteEmbed)
                    })

                }).catch(error => { return utils.ConsoleMessage(error, `error`) });
            }, 100);
        })
    })
}

module.exports.config = {
    name: "unmute", //Name of the command that will be used to call it
    aliases: ["unstab", "ungag", "unbin", ""], //Aliases of the command that can be used (This must NEVER be left empty)
    info: "Unblocks a user from sending messages and adding new reactions", //Short description of the command that will show on all help embeds
    type: "mod",  //Category in the ?help embed where this command will be visible
    subcommands: [""], //List of sub commands awailable. Help shouldn't ever be included in this list
    perms: ["MANAGE_MESSAGES"], //Permissions required for this command
    hidden: false, //Should this command be shown in ?help
    enabled: true //Should this command be allowed to be triggered
}