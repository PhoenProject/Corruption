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

        utils.CheckCanAct(client, message.member, targetMember, "mute", function (CanAct) {
            if (CanAct !== "CanAct") return message.channel.send(CanAct);

            if (!MsgContent[1]) reason = "No reason given"
            else reason = MsgContent.slice(1).join(" ")

            let mRole = message.guild.roles.find(role => role.name.toLowerCase() === "muted")

            if (!mRole) {
                guild.createRole({ name: "Muted", color: "LUMINOUS_VIVID_PINK", hoist: false, position: 9, permissions: [], mentionable: false })
                    .catch(error => { return utils.ConsoleMessage(error, `error`) });

                setTimeout(function () {

                    mRole = message.guild.roles.find(role => role.name.toLowerCase() === "muted")

                    Guild.channels.filter(channel => channel.type === "text").forEach(TextChannel => { TextChannel.overwritePermissions(mRole, { SEND_MESSAGES: false, ADD_REACTIONS: false }) });
                    Guild.channels.filter(channel => channel.type === "voice").forEach(VoiceChannel => { VoiceChannel.overwritePermissions(mRole, { CONNECT: false }) });

                }, 100);
            }

            setTimeout(() => {
                if (targetMember.roles.has(mRole.id)) return message.channel.send("User is already muted.")
                targetMember.addRole(mRole).then(() => {

                    let muteEmbed = new Discord.RichEmbed()
                        .setAuthor(`Mute given to ${targetMember.user.tag}`, targetMember.user.avatarURL)
                        .setColor(targetMember.displayHexColor)
                        .setFooter(`UserID: ${targetMember.user.id}`)
                        .setTimestamp()
                        .setThumbnail(targetMember.user.avatarURL)
                        .addField(`Mute:`,
                            `Issued by ${message.author}`
                            + `\n**Issue Time:** ${moment(Date.now()).format('DD MMM YYYY, HH:mm')}`
                            + `\nReason: ${reason}`
                            + `\n[Link to mute](https://discordapp.com/channels/${message.guild.id}/${message.channel.id}/${message.id})`);

                    message.channel.send(`${targetMember} has been muted!`)


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
    name: "mute", //Name of the command that will be used to call it
    aliases: ["stab", "gag", "bin", "recycle"], //Aliases of the command that can be used (This must NEVER be left empty)
    info: "Blocks a user from sending messages and adding new reactions to messages", //Short description of the command that will show on all help embeds
    type: "mod",  //Category in the ?help embed where this command will be visible
    subcommands: [""], //List of sub commands awailable. Help shouldn't ever be included in this list
    perms: ["MANAGE_MESSAGES"], //Permissions required for this command
    hidden: false, //Should this command be shown in ?help
    enabled: true //Should this command be allowed to be triggered
}