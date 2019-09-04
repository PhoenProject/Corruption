const Discord = require("discord.js");
const config = require("../config.json");
var exec = require('exec');
var pm2 = require('pm2');

module.exports.ping = (message, client) => {
    let cmdused = "ping"
    if (message.author.id === config.ownerID) {
        message.channel.send("Ping?").then((msg) => {
            msg.edit(`Pong! Latency is ${msg.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms`)
                .catch(error => { utils.CatchError(message, error, cmdused) });
        })
    }
    else message.channel.send("Pong!")
}
module.exports.contact = (client, message, args) => {
    if (message.member.hasPermission("ADMINISTRATOR")) {
        let cmdused = "contact"
        const sayMessage = args.join(" ");
        if (sayMessage === "") {
            message.reply("You must include a message that you wish to send to the bot creator.")
            return;
        }
        const contact = new Discord.RichEmbed()
            .setAuthor(`${message.guild.name}`)
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

        message.delete()
        message.reply("the contact message has been sent");
    }
}
module.exports.reload = (message, client) => {
    if (message.author.id !== config.ownerID) return

    message.channel.send("Reloading non-base command modules now. Please wait...")
    modulelist = "";
    fs.readdir("./commands/", (err, files) => {
        if (err) ConsoleMessage(error, client)
        let jsfile = files.filter(f => f.split(".").pop() === "js");
        if (jsfile.length <= 0) {
            let cmessage = "Couldn't find commands.";
            ConsoleMessage(error, client)
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
        const reload = new Discord.RichEmbed()
            .setTitle("Corruption bot command reload", client.user.avatarURL)
            .setAuthor(`Corruption Bot`)
            .setColor(message.member.displayHexColor)
            .setFooter(`Corruption bot`)
            .setTimestamp()
            .addField("Loaded commands:", `${modulelist}`)
        let cmessage = `The bot commands have been reloaded.\n${modulelist}`;
        utils.ConsoleMessage(error, client)

        message.channel.send(reload)
    });
}
module.exports.restart = (message) => {
    if (message.author.id === config.ownerID) {
        const filter = m => m.author.id === message.author.id
        message.channel.send("Are you 100% sure you want to restart the bot?")
        message.channel.awaitMessages(filter, { max: 1, time: 35000, errors: ['time'] }).then((Confirmation) => {
            if (Confirmation.first().toString().toLowerCase() === "yes") {
                message.channel.send("I will restart momentarily...")

                const remote = `https://github.com/PhoenProject/CorruptionBot`;
                require('simple-git')()
                    .addConfig('user.name', 'PhoenProject')
                    .addConfig('user.email', config.GitEmail)
                    .clean("-f -n")
                    .stash()
                    //.silent(true)
                    .pull(remote, "master")
                    .exec(() => {
                        console.log('finished')

                        pm2.connect(function(err) {
                            pm2.restart(config.ProcessName)
                        })
                    })

            }
            else if (Confirmation.first().toString().toLowerCase() === "no") {
                message.channel.send("Restart Aborted!");
            }
        })
    }
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
module.exports.help = (message, client, rows) => {
    fs.readdir("./commands/", (err, files) => {

        let GeneralCMDs = ''
        let ModCMDs = ''
        let InfoCMDs = ''
        let gPrefix = rows[0].Prefix

        if (err) ConsoleMessage(error, client)
        if (files.length < 1) return console.log("No files could be found!")
        let cmdFiles = files.filter(f => f.split(".").pop() === "js");
        cmdFiles.forEach((f, i) => {
            let props = require(`./commands/${f}`);

            switch (props.config.type) {
                case "info":
                    InfoCMDs += `**${gPrefix}${props.config.name}** - ${props.config.info}\n`
                    break;
                case "mod":
                    ModCMDs += `**${gPrefix}${props.config.name}** - ${props.config.info}\n`
                    break;
                case "general":
                    GeneralCMDs += `**${gPrefix}${props.config.name}** - ${props.config.info}\n`
                    break;
                case "test":
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
            .addField(`**__General commands__**`, GeneralCMDs)
        if (message.guild.id === '403155047527088129') {
            let DGuard = message.guild.roles.find(role => role.name === "Dragon Guard").id
            let ODuty = message.guild.roles.find(role => role.name === "Off Duty").id
            if (message.member.roles.find(role => role.id === ODuty) || message.member.roles.find(role => role.id === DGuard)) {
                help.addField("**__DragonSCP Commands__**",
                    `**${gPrefix}offduty** - Replaces the Dragon Guard role with Off Duty.`
                    + `\n**${gPrefix}onduty** - Replaces the Off Duty role with Dragon Guard.`)
            };
        };
        message.author.send(help)
    })
}
module.exports.say = (message, client) => {
    let MsgContent = message.content.split(' ')
    if (MsgContent[0] === `${config.prefix}say`) {
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
}
module.exports.helpPing = (message, sqlcon) => {
    sqlcon.query(`SELECT * FROM guildprefs WHERE GuildID = '${message.guild.id}'`, (err, PrefixCheck) => {
        let guildPrefix
        if (PrefixCheck.length < 1) { guildPrefix = config.prefix }
        else { guildPrefix = PrefixCheck[0].Prefix }
        message.channel.send('Hello, My prefix for this guild is `' + guildPrefix + '`'
            + '\nIf you require assistance, please use the `' + guildPrefix + 'help` command!')
    })
}