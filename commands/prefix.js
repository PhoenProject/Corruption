const utils = require('../utilities/BaseBotFunction.js');

module.exports.run = async (client, message, MsgContent, prefix, sqlcon) => {
    if(!this.config.enabled) return utils.ConsoleMessage(`${message.author.id} tried to trigger disabled command ${this.config.name}`, `info`)

    switch (!MsgContent[0] ? MsgContent[0] : MsgContent[0].toString().toLowerCase()) {
        case "help":
            utils.HelpMessage(client, message, prefix, this.config.name, this.config.subcommands, this.config.info, this.config.perms);
            break;
        case "set":
            SetPrefix(client, message, this.config.perms[0], MsgContent, sqlcon)
            break;
        default:
            return message.channel.send(`Prefix for **${message.guild.name}** is ${prefix}`);

    }
}

function SetPrefix(client, message, perm, MsgContent, sqlcon) {
    if (!message.member.hasPermission(perm)) return;

    if (MsgContent[0] === undefined) return message.channel.send("You forgot to state a new prefix!");

    sqlcon.query(`UPDATE guildprefs SET Prefix = '${MsgContent[0]}' WHERE GuildID = '${message.guild.id}'`);

    setTimeout(function () {
        sqlcon.query(`SELECT * FROM guildprefs WHERE GuildID = '${message.guild.id}'`, (err, PrefixCheck) => {
            if (err) return utils.ConsoleMessage(err, `error`)

            message.guild.members.get(client.user.id).setNickname(`Corruption (${prefix[0].Prefix})`);
            message.channel.send(`The new bot prefix is ${prefix[0].Prefix}`);
        })
    }, 100);
}

module.exports.config = {
    name: "prefix", 
    aliases: ["pref"],
    info: "Changes the bot's prefix",
    type: "mod",
    subcommands: ["set"],
    perms: ["MANAGE_GUILD"],
    hidden: false,
    enabled: true
}