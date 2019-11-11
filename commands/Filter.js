const utils = require('../utilities/BaseBotFunction.js');
const moment = require("moment");
const Discord = require("discord.js");

module.exports.run = async (client, message, MsgContent, prefix, sqlcon) => {
    if (!this.config.enabled) return utils.ConsoleMessage(`${message.author.id} tried to trigger disabled command ${this.config.name}`, `info`)

    switch (!MsgContent[0] ? MsgContent[0] : MsgContent[0].toString().toLowerCase()) {
        default:
            utils.HelpMessage(client, message, prefix, this.config.name, this.config.subcommands, this.config.info, this.config.perms);
            break;
        case "add":
            FilterAdd(client, message, this.config.perms[0], MsgContent, sqlcon)
            break;
        case "remove":
        case "del":
            FilterDel(client, message, this.config.perms[0], MsgContent, sqlcon)
            break;
        case "list":
            FilterList(client, message, this.config.perms[0], MsgContent, sqlcon)
            break;
    }
}

async function FilterAdd(client, message, perm, MsgContent, sqlcon) {
    if (!message.member.hasPermission(perm)) return;
    if (!MsgContent[1]) return message.channel.send("You need to specify a user!");

    utils.GetUser(client, message, MsgContent[1], function (targetMember) {
        if(!targetMember) return message.channel.send(`Unable to find user ${MsgContent[1]}`);

        utils.CheckCanAct(client, message.member, targetMember, "", function (CanAct) {
            if (CanAct !== "CanAct") return message.channel.send(CanAct);

            sqlcon.query(`INSERT INTO VIPs (GuildID, MemberID) VALUES (?,?)`, [message.guild.id, targetMember.id])

            setTimeout(() => {
                sqlcon.query(`SELECT * FROM VIPs WHERE MemberID = ? AND GuildID = ?`, [targetMember.id, message.guild.id], (err, VIPCheck) => {
                    if (VIPCheck.length < 1) return utils.ConsoleMessage(`Unable to verify VIP addition`, `error`)

                    message.channel.send(`${targetMember.user.tag} is now a VIP`);
                })
            }, 200)

        })
    })
}
async function FilterDel(client, message, perm, MsgContent, sqlcon) {
    if (!message.member.hasPermission(perm)) return;
    if (!MsgContent[1]) return message.channel.send("You need to specify a user!");

    utils.GetUser(client, message, MsgContent[1], function (targetMember) {
        if(!targetMember) return message.channel.send(`Unable to find user ${MsgContent[1]}`);

        utils.CheckCanAct(client, message.member, targetMember, "", function (CanAct) {
            if (CanAct !== "CanAct") return message.channel.send(CanAct);

            sqlcon.query(`DELETE FROM VIPs WHERE GuildID = ? AND MemberID = ?`, [message.guild.id, targetMember.id]);

            setTimeout(() => {
                sqlcon.query(`SELECT * FROM VIPs WHERE MemberID = ? AND GuildID = ?`, [targetMember.id, message.guild.id], (err, VIPCheck) => {
                    if (VIPCheck.length > 0) return utils.ConsoleMessage(`Unable to verify VIP removal`, `error`)

                    message.channel.send(`${targetMember.user.tag} is no longer a VIP`);
                })
            }, 200)

        })
    })
}
async function FilterList(client, message, perm, MsgContent, sqlcon) {

    if (message.member.displayHexColor == '#000000') EmbedColour = (`#17A589`);
    else EmbedColour = message.member.displayHexColor;

    sqlcon.query(`SELECT * FROM VIPs WHERE GuildID = ?`, [message.guild.id], (err, VIPs) => {

        let VIPArray = new Array();

        VIPs.forEach(element => {
            VIPArray.push(`${message.guild.members.find(user => user.id === element.MemberID).user.tag} (${element.MemberID})`)
        });

        let VIPEmbed = new Discord.RichEmbed()
            .setAuthor(`VIP members for ${message.guild.name}`, client.avatarURL)
            .setColor(EmbedColour)
            .setFooter(`GuildID: ${message.guild.id}`)
            .setTimestamp()
            .addField(`Current ${VIPArray.length > 0 ? "VIPs" : "VIP"}`, VIPArray.toString().split(',').join('\n'));
        message.channel.send(VIPEmbed);
    })
}

module.exports.config = {
    name: "filter", //Name of the command that will be used to call it
    aliases: ["filter"], //Aliases of the command that can be used (This must NEVER be left empty)
    info: "Adds a word to the filter, meaning that members get automatically warned when they send a message containing the word", //Short description of the command that will show on all help embeds
    type: "mod",  //Category in the ?help embed where this command will be visible
    subcommands: ["add", "remove", "list"], //List of sub commands awailable. Help shouldn't ever be included in this list
    perms: ["MANAGE_GUILD"], //Permissions required for this command
    hidden: false, //Should this command be shown in ?help
    enabled: false //Should this command be allowed to be triggered
}