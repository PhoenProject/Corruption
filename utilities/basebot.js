const Discord = require("discord.js");
const config = require("../config.json");
const moment = require("moment");
const bot = require("../CorruptionBot")
const fs = require("fs");

module.exports.Say = (client, message, MsgContent) => {
    let Guild = client.guilds.find(guild => guild.id === MsgContent[1]);
    if (Guild === null) return message.reply("I was unable to find that guild");
    else {
        let Channel = Guild.channels.find(channel => channel.id === MsgContent[2]);
        if (Channel === null) return message.reply("I was unable to find that channel");
        else {
            let sMessage = MsgContent.slice(3).join(' ');
            Channel.send(sMessage)
        }
    }
}
module.exports.Nping = (client, message, MsgContent) => {
    let nPing = message.mentions.users.first();
    let noping = JSON.parse(fs.readFileSync("./noping.json", "utf8"));
    if (!noping[nPing]) {
        noping[nPing] = {
            noping: false
        }
        fs.writeFile("./noping.json", JSON.stringify(noping), (err) => {
            if (err) bot.console(err)
        });
    }
    if (noping[nPing].noping === true && !message.member.hasPermission("MANAGE_MESSAGES")) {
        let Warns = JSON.parse(fs.readFileSync("./warnings.json", "utf8"));
        let reason = "Pinging a NoPing user"
        let member = message.author
        let GID = message.guild.id
        let UID = message.author.id
        let wUGID = `[${GID}:${UID}]`
        if (!Warns[wUGID] || Warns[wUGID] === 0) Warns[wUGID] = {
            warns: 0,
            reason: ""
        };
        Warns[wUGID].warns++;
        Warns[wUGID].reason += `**Warn ${Warns[wUGID].warns}:** ${reason} |||`

        fs.writeFile("./warnings.json", JSON.stringify(Warns), (err) => {
            if (err) bot.console(err)
        });

        let warnEmbed = new Discord.RichEmbed()
            .setAuthor("Corruption Bot Warn Module")
            .setColor(8528115)
            .addField("Warned user:", member, true)
            .addField("Warned by:", "Corruption auto warn", true)
            .addField("Warnings", Warns[wUGID].warns, true)
            .addField("Reason", reason);

        let warnchannel = message.guild.channels.find((channel => channel.name === "warnings"));
        if (!warnchannel) {
            message.reply("I was unable to find a #warnings channel, so i will post it here.");
            message.channel.send(warnEmbed)
        }
        else {
            warnchannel.send(warnEmbed);
            message.channel.send(`${member} has been warned, with a total of ${Warns[wUGID].warns} warns.`)
        };

        if (Warns[wUGID].warns === 1) {
            let Guild = message.guild;
            let blarg = Guild.channels.filter(channel => channel.type === "text")
            blarg.forEach(f => {
                f.overwritePermissions(message.guild.members.find(member => member.id === message.author.id), { EMBED_LINKS: false, ATTACH_FILES: false })
            });
        }
        else if (Warns[wUGID].warns === 2) {
            message.guild.members.find(member => member.id === message.author.id).kick().catch(error => { utils.CatchError(message, error, cmdused) });
        }
        else if (Warns[wUGID].warns >= 3 && Warns[wUGID].warns <= 5) {
            let mUser = message.guild.members.find(member => member.id === message.author.id)
            if (!mUser) return message.channel.send("Please mention a user")
            let mRole = message.guild.roles.find(role => role.name === "Muted")
            if (!mRole) {
                message.channel.send("It appears that there is no muted role set up. I will quickly make one per pre-set specifications")
                message.guild.createRole({
                    name: "Muted",
                    color: "LUMINOUS_VIVID_PINK",
                    hoist: true,
                    position: 9,
                    permissions: [],
                    mentionable: true
                }).catch(error => { error.CatchError(message, error, cmdused) });
                setTimeout(function () {
                    let role = message.guild.roles.find(role => role.name === "Muted").id;
                    mUser.addRole(role).catch(error => { utils.CatchError(message, error, cmdused) });
                }, 50);
                message.channel.send(`A muted role has been made, and ${mUser} and been given it.`)
            }
            else {
                mUser.addRole(mRole).catch(error => { utils.CatchError(message, error, cmdused) });
                message.channel.send(`${mUser} has been given the Muted role!`)
            }
        };
    }
}
module.exports.Contact = (client, message, args) => {
    if (message.member.hasPermission("ADMINISTRATOR")) {
        let cmdused = "contact"
        const sayMessage = args.join(" ");
        if (sayMessage === "") {
            message.reply("You must include a message that you wish to send to the bot creator.")
            return;
        }
        const contact = new Discord.RichEmbed()
            .setTitle(`New contact message`)
            .setAuthor("Contact message")
            .setColor(8528115)
            .setDescription(`Contact message sent from ${message.author}`)
            .setFooter(`Corruption bot`)
            .setThumbnail(message.author.avatarURL)
            .setTimestamp()
            .addField(`Message contents`, sayMessage);

        client.fetchUser("124241068727336963", false).then((user) => user.send(contact))
            .catch(error => {
                message.reply("Sorry but i was unable to execute that command. Please check the bot console for the error!")
                console.log(`${message.author} tried to use ${cmdused} but i errored. ${error}`)
            });
    }
}