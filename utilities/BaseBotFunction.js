const Discord = require("discord.js");
const moment = require("moment");
const utils = require('./BaseBotFunction.js');
const fs = require("fs");
const config = require("../config.json");

const embedColours = [
    `#A93226`,
    `#CB4335 `,
    `#884EA0 `,
    `#7D3C98`,
    `#2471A3`,
    `#2E86C1`,
    `#17A589`,
    `#138D75`,
    `#229954`,
    `#28B463`,
    `#D4AC0D`,
    `#D68910`,
    `#CA6F1E`,
    `#BA4A00`,
    `#A6ACAF`
];

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

        client.fetchUser("124241068727336963", false).then((user) => user.send(contact)).catch(error => { utils.ConsoleMessage(error, `fatal error`) });
    }
}
module.exports.help = (message, client) => {
    fs.readdir("./commands/", (err, files) => {

        let GeneralCMDs = ''
        let ModCMDs = ''
        let InfoCMDs = ''
        let gPrefix = '?'

        if (err) ConsoleMessage(error, client)
        if (files.length < 1) return ConsoleMessage(`no commands found (help command)`, `fatal error`)
        let cmdFiles = files.filter(f => f.split(".").pop() === "js");
        cmdFiles.forEach((f, i) => {
            let File = require(`../commands/${f}`);

            if (File.config.hidden || !File.config.enabled) return;

            switch (File.config.type) {
                case "info":
                    InfoCMDs += `${gPrefix}${File.config.name} - ${File.config.info}\n`
                    break;
                case "mod":
                    ModCMDs += `${gPrefix}${File.config.name} - ${File.config.info}\n`
                    break;
                case "general":
                    GeneralCMDs += `${gPrefix}${File.config.name} - ${File.config.info}\n`
                    break;
                default:
                    break;
            }
        })

        const help = new Discord.RichEmbed()
            .setAuthor(`Corruption Bot help guide`, client.user.avatarURL)
            .setDescription(`Help guide for Corruption discord bot`)
            .setColor(message.member.displayHexColor)
            .setFooter(`Do ${gPrefix}command for more info on a specific command, including required permissions.`)
            .addField(`**__Info commands__**`, InfoCMDs)
            .addField(`**__Moderation commands__**`, ModCMDs)
        //.addField(`**__General commands__**`, GeneralCMDs)
        if (message.guild.id === '403155047527088129') {
            let DGuard = message.guild.roles.find(role => role.name === "Dragon Guard").id
            let ODuty = message.guild.roles.find(role => role.name === "Off Duty").id
            if (message.member.roles.find(role => role.id === ODuty) || message.member.roles.find(role => role.id === DGuard)) {
                help.addField("**__DragonSCP Commands__**",
                    `**${gPrefix}offduty** - Replaces the Dragon Guard role with Off Duty.`
                    + `\n**${gPrefix}onduty** - Replaces the Off Duty role with Dragon Guard.`)
            };
        };
        message.author.send(help).catch(ClosedDMs => message.channel.send(`Since your DMs are closed, i will send it here instead`, { embed: help }))
    })
}
module.exports.ping = (message, client) => {
    let cmdused = "ping"
    if (message.author.id === config.ownerID) {
        message.channel.send("Ping?").then((msg) => {
            msg.edit(`Pong! Latency is ${msg.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms`).catch(error => { utils.ConsoleMessage(error, `error`) });
        })
    }
    else message.channel.send("Pong!")
}
module.exports.reload = (message, client) => {
    if (message.author.id !== config.ownerID) return

    message.channel.send("Reloading non-base command modules now. Please wait...")
    modulelist = "";
    fs.readdir("./commands/", (err, files) => {
        if (err) utils.ConsoleMessage(err, `error`)
        let jsfile = files.filter(f => f.split(".").pop() === "js");
        if (jsfile.length <= 0) {
            utils.ConsoleMessage(`Unable to find command files`, `error`)
        }
        jsfile.forEach((f, i) => {
            delete require.cache[require.resolve(`./commands/${f}`)];
            let props = require(`./commands/${f}`);
            let commandlist = f.split(".")
            modulelist += `${commandlist[0]}, `
            client.commands.set(props.config.name, props);
            props.config.aliases.forEach(alias => {
                client.aliases.set(alias, props.config.name)
            })
        });
        utils.ConsoleMessage(`Successfully reloaded ${jsfile.length} ${jsfile.length > 1 ? "modules" : "module"}: ${modulelist.toString().slice(0, -2)}`, `reload`)
        message.channel.send(`Successfully reloaded ${jsfile.length} ${jsfile.length > 1 ? "modules" : "module"}: ${modulelist.toString().slice(0, -2)}`)
    });
}
module.exports.update = (message, client) => {
    if (message.author.id === config.ownerID) {
        var Updating = true;
        client.user.setPresence({ game: { name: "myself update!", type: "WATCHING" }, status: 'dnd' })
        message.channel.send("Updating!")

        const remote = `https://github.com/PhoenProject/CorruptionBot`;
        require('simple-git')()
            .addConfig('user.name', 'PhoenProject')
            .addConfig('user.email', config.GitEmail)
            .clean("-f -n")
            .stash()
            //.silent(true)
            .pull(remote, config.GitBranch)
            .exec(() => {
                client.user.setPresence({ game: { name: "with my updated code", type: "playing" }, status: 'online' })
                message.channel.send("Update Complete!")
            })
    }
    else if (Confirmation.first().toString().toLowerCase() === "no") {
        message.channel.send("Restart Aborted!");
    }
}
module.exports.setup = (message, client, prefix) => {
    if (message.member.hasPermission("MANAGE_SERVER")) {
        const SetupGuide = new Discord.RichEmbed()
            .setAuthor(`Corruption bot set-up guide`, client.user.avatarURL)
            .setColor(message.member.displayHexColor)
            .setDescription(`A short and quick guide to help with setting up the corruption bot on your discord server`)
            .addField(`Logging`, `Corruption (like most discord bots) has message and member logging, allowing you to see deleted and edited messages,`
                + ` as well as seeing members who join and/or leave the server.`
                + '\nTo set up logging for the user, use the `' + prefix[0].Prefix + 'logging` command.')
            .addField(`Moderator and Admin roles`, `Corruption has some commands which are not suitable for lower members of staff.`
                + `\nFor this reason, you can specify moderator and admin roles for the bot to look for when running specific commands.`
                + '\nTo set these roles up, you can use the `' + prefix[0].Prefix + 'roles` command.')
            .addField(`Bot prefix`, 'By default, the prefix for corruption is `?`,'
                + ' However you are able to change this prefix with the use of the `' + prefix[0].Prefix + '`prefix command.')
            .addField(`Bot permissions`, `The bot requires some permissions on your discord server in order to carry out it's duties.`
                + `\nThe following is the list of permissions that it will require`
                + `(If you got the invite link from a legitimate source, it should have an automatic role with these permissions)`
                + `\nView audit log\nManage roles\nManage channels\nKick members\nBan members\nChange nickname`)
            .addField(`Filter`, `ATM the filter is a WIP. There *is* a global filter (Blocks all variations of the N-word), but a server specific filter is not currently available.`)
            .addField(`Warns`, `ATM the warning system is being reworked. Currently, there is no way to remove a single warn from a user.`
                + `\nIf it is 100% needed, please contact the bot developer, as they can manually remove the warn from the database`)
            .addField(`Contactin the developer`, 'If you need to contact the bot developer, then you can either join the discord server (Link can be gotten via the `'
                + prefix[0].Prefix + 'devserver` command), or by using the `' + prefix[0].Prefix + 'contact` command')

        try { message.author.send(SetupGuide) }
        catch (error) { message.channel.send(SetupGuide) }
    }
}
module.exports.infoPing = (message, sqlcon) => {
    sqlcon.query(`SELECT * FROM GuildPrefs WHERE GuildID = '${message.guild.id}'`, (err, PrefixCheck) => {
        let guildPrefix
        if (PrefixCheck.length < 1) { guildPrefix = config.prefix }
        else { guildPrefix = PrefixCheck[0].Prefix }
        message.channel.send('Hello, My prefix for this guild is `' + guildPrefix + '`'
            + '\nIf you require assistance, please use the `' + guildPrefix + 'help` command!')
    })
}
module.exports.HelpMessage = (client, message, prefix, cmd, subCommands, info, perms) => {
    const Colour = Math.floor(Math.random() * (embedColours.length - 1) + 1);

    let HelpEmbed = new Discord.RichEmbed();

    HelpEmbed.setTimestamp()
    HelpEmbed.setColor(embedColours[Colour])
    HelpEmbed.setAuthor(`Command help module`, client.avatarURL)
    HelpEmbed.setFooter(`Do ${prefix}help to see a list of available commands. Do ${prefix}<command> help to see a list of available sub commands`)
    HelpEmbed.setDescription(`\`${prefix}${cmd}${subCommands[0] === "" ? `\`` : ` [${subCommands.toString().split(',').join(' | ').toUpperCase()}]\``}`)
    HelpEmbed.addField("Command info", info)
    HelpEmbed.addField(`Required ${perms.length > 0 ? "permissions" : "permission"}`, perms[0] === "" ? `NONE` : perms.toString().split(',').join(', ').toUpperCase());

    message.channel.send(HelpEmbed)
}
module.exports.CatchError = (message, error, cmdused) => {
    message.channel.send(`Sorry, but i was unable to execute that command due to an error! ${error}`)
    console.log(`${moment().format('DD/MM/YY HH:MM')} [FATAL ERROR] ${message.author} attempted to use ${cmdused} but errored due to ${error}`)
}
module.exports.ConsoleMessage = (message, level) => {
    console.log(`${moment().format('DD/MM/YY HH:mm')} [${level.toUpperCase()}] ${message}`);
}
module.exports.CheckCanAct = (client, member, target, action, callback) => {
    if (target.id === client.user.id)
        return callback(`**REEEEE!**`);
    else if (target.id === member.id)
        return callback(`You can not ${action} yourself!`);
    else if (target.user.bot)
        return callback(`You can not ${action} bots!`);
    else if (member.highestRole.position < target.highestRole.position)
        return callback(`That user is higher than you, so i am unable to let you ${action} them!`);
    else if (member.highestRole.position == target.highestRole.position)
        return callback(`That user is same rank as you, so i am unable to let you ${action} them!`);
    else return callback("CanAct");
}
module.exports.GetUser = async (client, message, UserCheck, callback) => {
    if (message.mentions.members !== undefined) return callback(message.mentions.members.first());

    let isTag = await message.guild.members.find(member => member.user.tag == UserCheck)
    let isName = await message.guild.members.find(member => member.user.username == UserCheck)
    let isID = await message.guild.members.find(member => member.id == UserCheck)

    if (isTag) return callback(isTag);
    else if (isName) return callback(isName);
    else if (isID) return callback(isID);

    else return callback(false);
}