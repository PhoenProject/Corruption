const Discord = require("discord.js");
const client = new Discord.Client();
const config = require("./config.json");
const utils = require('./utilities/utils.js');
const base = require('./utilities/basebot.js');
const dscp = require('./utilities/dscpcmds.js');
const autow = require('./utilities/autowarning.js');
const mbot = require('./utilities/modbot.js');
const stats = require('./utilities/stattrack.js');
const watcher = require('./utilities/watcher.js');
const logs = require('./utilities/loggingsystem.js');
const moment = require("moment");
const fs = require("fs");
const mysql = require("mysql");
const { exec } = require("child_process");

// #region Connection and data stuffs

let modulelist = "";
client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();

fs.readdir("./commands/", (err, files) => {
	if (err) console.log(err)
	let jsfile = files.filter(f => f.split(".").pop() === "js");
	if (jsfile.length <= 0) {
		console.log(`Couldn't find commands.`);
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
	console.log(modulelist);
});
var sqlcon = mysql.createConnection({
	host: config.CBotHost,
	user: config.CBotUser,
	password: config.CBotPass,
	database: config.CBotDB,
	charset: 'utf8mb4'
});
sqlcon.connect(err => {
	if (err) console.log(err)
	console.log("Connected To Database");
})
sqlcon.on('error', error => {
	if (error.code === 'PROTOCOL_CONNECTION_LOST') {
		sqlcon = mysql.createConnection({
			host: config.CBotHost,
			user: config.CBotUser,
			password: config.CBotPass,
			database: config.CBotDB,
			charset: 'utf8mb4'
		});
	} else console.log(error)
})
const play_act = [
	`with the help command`,
	`with my code`,
	`with the testers`,
	`with Phoenix--Project`,
	`Half-Life 3`,
	`with random people`,
	`with your mind`,
	`the waiting game`,
	`Portal 3`,
	`The good Fallout 4`,
	`Tetris`,
	`Snake`,
	`Pong`,
	`Tennis`,
	`World domination`
];
// #endregion

client.on("ready", () => {
	let GCount = client.guilds
	let UCount = 0
	GCount.forEach(element => {
		UCount = UCount + element.memberCount
	});
	client.guilds.find(guild => guild.id === "446745542740148244").channels.find(channel => channel.id === config.Logchan).send("**CORRUPTION BOT ONLINE**")
	let cmessage = `Bot has started, with ${UCount} users, in ${client.guilds.size} guilds.`;
	client.user.setPresence({ game: { name: "myself start up", type: "WATCHING" } })
	setInterval(() => {
		const index = Math.floor(Math.random() * (play_act.length - 1) + 1);
		client.user.setPresence({ game: { name: play_act[index], type: "PLAYING" } });
	}, 120000);
});

// #region Guild events
client.on("guildCreate", guild => {
	let cmessage = `New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`;

	sqlcon.query(`SELECT * FROM guildprefs WHERE GuildID = '${guild.id}'`, (err, rows) => {
		if (err) ConsoleMessage(err)
		if (rows.length < 1) {
			CreateGuildPrefs(guild, sqlcon)
		}
	})
});
client.on("guildDelete", guild => {
	let cmessage = `I have been removed from: ${guild.name} (id: ${guild.id})`;
	ConsoleMessage(error, client)
});
// #endregion

// #region Guild member events
client.on("guildMemberAdd", member => {
	if (member.bot || !member.guild) return;
	logs.MemberAdd(client, member, sqlcon);
});
client.on("guildMemberRemove", async (member) => {
	if (member.bot || !member.guild) return;
	logs.MemberRemove(client, member, sqlcon);
});
client.on("guildMemberUpdate", function (oldMem, newMem) {
	if (oldMem.bot || !oldMem.guild || !oldMem || !newMem) return;
	logs.MemberUpdate(client, oldMem, newMem, sqlcon);
});
client.on("guildBanAdd", async function (guild, member) {
	if (member.bot || !member.guild) return;
	logs.AddBan(client, member, sqlcon);
})
// #endregion


// #region Message events
client.on("messageDelete", async message => {
	if (message.guild == null || message.author.bot) return;
	logs.MessageDeleted(client, message, sqlcon);
});
client.on("messageUpdate", function (oldMSG, newMSG) {
	if (oldMSG == newMSG || oldMSG == null || newMSG == null || oldMSG.author.bot || newMSG.author.bot || oldMSG.member == null || newMSG.member == null) return;
	logs.MessageEdited(client, oldMSG, newMSG, sqlcon);
});
client.on("message", async message => {
	let args = message.content.split(' ')
	if (message.author.bot || message.member == null || message.author == null) return
	else if (!message.guild && message.author.id === config.ownerID) {
		let MsgContent = message.content.split(' ')
		if (MsgContent[0] === `${config.prefix}say`) {
			let Guild = client.guilds.find(guild => guild.id === MsgContent[1]);
			let Channel = Guild.channels.find(channel => channel.id === MsgContent[2]);
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
	else if (message.mentions.users.first() != undefined && message.mentions.users.first().id === client.user.id && args[1] === "help") {
		sqlcon.query(`SELECT * FROM guildprefs WHERE GuildID = '${message.guild.id}'`, (err, PrefixCheck) => {
			PingMessage(message, PrefixCheck)
		})
	}
	else {
		sqlcon.query(`SELECT * FROM guildprefs WHERE GuildID = '${message.guild.id}'`, (err, sqlguild) => {
			autow.globalfilter(client, message, sqlcon)
			autow.filter(client, message, sqlcon)
			autow.massping(client, message, sqlcon)

			MessageCheck(message, sqlguild, sqlcon)
		});
	}
});
// #endregion

// #region Misc. bot events
client.on("warn", console.warn);
client.on("error", console.error);
client.on('disconnect', () => console.log('I just disconnected, making sure you know, I will reconnect now...'));
client.on('reconnecting', () => console.log('I am reconnecting now!'));
// #endregion

//#region Handle Message
function MessageCheck(message, sqlguild, sqlcon) {

	if (sqlguild.length < 1) {
		let guild = message.guild
		CreateGuildPrefs(guild, sqlcon)
	}
	else {
		sqlcon.query(`SELECT * FROM chanprefs WHERE GuildID = '${message.guild.id}' AND ChannelID = '${message.channel.id}'`, (err, sqlchannelcreate) => {
			if (err) ConsoleMessage(error, client)
			if (sqlchannelcreate.length < 1) { CreateChanPrefs(message, sqlcon) }
			sqlcon.query(`SELECT * FROM chanprefs WHERE GuildID = '${message.guild.id}' AND ChannelID = '${message.channel.id}'`, (err, sqlchannel) => {
				if (err) ConsoleMessage(error, client)
				if (!message.content.startsWith(sqlguild[0].Prefix)) {
					if (sqlchannel[0].MsgVote === 'true') { MsgVoteChan(message, sqlcon, sqlguild) }
					if (message.guild.id === "582850539604279296" && message.channel.id === "582858846519820298") {
						let Choice = message.content.toLowerCase()
						switch (Choice) {
							case "dscp":
							case "dragon":
							case "dragonscp":
							case "dragon scp":
								let DRole = message.guild.roles.find(role => role.id === "582851827058343956");
								message.member.addRole(DRole).catch(error => { utils.CatchError(message, error, cmdused) });
								break;
							case "asylum":
							case "the asylum":
								let ARole = message.guild.roles.find(role => role.id === "582851825208786944");
								message.member.addRole(ARole).catch(error => { utils.CatchError(message, error, cmdused) });
								break;
							default:
								break;
						}
					}
				}
				else if (message.content.startsWith(sqlguild[0].Prefix)) {
					let Message = message.content.slice((sqlguild[0].Prefix).length);
					let MsgContent = Message.split(" ");
					let cmd = MsgContent[0]
					let args = MsgContent.slice(1);
					let commandfile = client.commands.get(cmd) || client.commands.get(client.aliases.get(cmd))
					if (message.guild.id === "403155047527088129") {
						switch (cmd) {
							case "onduty":
								dscp.onduty(client, message, MsgContent)
								break;
							case "offduty":
								dscp.offduty(client, message, MsgContent)
								break;
							case "stats":
								stats.main(client, message)
								break;

							default:
								if ((message.channel.id === `529977537116241921`) && !message.author.bot) {
									mbot.AutoModLogChan(client, message, sqlcon)
								}
								else if ((message.channel.id === `452160531416219658` || message.channel.id === `413410295147528203`) && !message.author.bot) {
									mbot.CommandChans(client, message, sqlcon)
								}
								else if (message.channel.id === `519867312090644490` || message.channel.id === `473403553013301248` || message.channel.id === `473400727717281793`) {
									mbot.ServerLogsChan(client, message, sqlcon)
								}
								break;
						}
					}
					else if (message.guild.id === "499352093019209741") watcher.watcher(client, message);
					switch (cmd) {
						case "heartofcorruption":
						case "devserver":
						case "hoc":
							message.author.send("https://discord.gg/asVrGDm")
							break;
						case "github":
						case "gh":
						case "git":
						case "source":
						case "code":
						case "sourcecode":
						case "sc":
							message.author.send("https://github.com/PhoenProject/CorruptionBot")
							break;
						case "help":
						case "info":
						case "commands":
							sqlcon.query(`SELECT * FROM guildprefs WHERE GuildID = '${message.guild.id}'`, (err, rows) => { Help(message, rows) })
							break;
						case "ping":
							PingCommand(message)
							break;
						case "contact":
							ContactCommand(client, message, args)
							break;
						case "reload":
							Reloadcommand(message)
							break;
						case "restart":
							Restart(message)
							break;
						case "update":
							Update(message)
							break;
						case "setup":
							sqlcon.query(`SELECT * FROM guildprefs WHERE GuildID = '${message.guild.id}'`, (err, prefix) => { Setup(message, prefix) })
							break;
						case "eval":
							Eval(message)
							break;
						default:
							if (commandfile) commandfile.run(client, message, args, sqlcon);
							break;
					}
				}
			})
		})
	}
}
// #endregion

//#region MySQL data creation
function CreateGuildPrefs(guild, sqlcon) {
	let strTest = guild.name.replace(/[^0-9a-z]/gi, '')
	let GuildName = strTest.replace(/'/g, '~');
	console.log(GuildName);
	sqlcon.query(`INSERT INTO guildprefs (GuildName, GuildID, MemLog, MemLogChan, MsgLog, MsgLogChan, ModLogchan, Upvote, Downvote, ModRole, AdminRole, AntiRaid, Prefix, GlobalFilter)
VALUES ('${GuildName}','${guild.id}','false','null','false','null','null','👍','👎','none','none','false','?', '1')`)
}
function CreateChanPrefs(message, sqlcon) {
	sqlcon.query(`INSERT INTO chanprefs (GuildID, ChannelID, MsgVote) VALUES ('${message.guild.id}', '${message.channel.id}', 'false')`)
	MsgVoteChan(message, sqlcon)
}
// #endregion

//#region Chat Functions
function PingMessage(message, PrefixCheck) {
	let guildPrefix
	if (PrefixCheck.length < 1) { guildPrefix = config.prefix }
	else { guildPrefix = PrefixCheck[0].Prefix }
	message.channel.send('Hello, My prefix for this guild is `' + guildPrefix + '`'
		+ '\nIf you require assistance, please use the `' + guildPrefix + 'help` command!')
}
function MsgVoteChan(message, sqlcon, sqlguild) {
	if (sqlguild != undefined) {
		message.react(sqlguild[0].Upvote).catch(error => { utils.CatchError(message, error, cmdused) });
		setTimeout(function () {
			message.react(sqlguild[0].DownVote).catch(error => { utils.CatchError(message, error, cmdused) })
		}, 100);
	}
}
// #endregion

//#region Command functions
function PingCommand(message) {
	let cmdused = "ping"
	if (message.author.id === config.ownerID) {
		message.channel.send("Ping?").then((msg) => {
			msg.edit(`Pong! Latency is ${msg.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms`)
				.catch(error => { utils.CatchError(message, error, cmdused) });
		})
	}
	else message.channel.send("Pong!")
}
function ContactCommand(client, message, args) {
	if (message.member.hasPermission("ADMINISTRATOR")) return base.Contact(client, message, args)
	else message.channel.send("Sorry, but you do not meet the requirements to use this command.")
}
function Reloadcommand(message) {
	if (message.author.id === config.ownerID) {
		message.channel.send("Reloading the command modules files now. Please wait...")
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
	else return
}
function Help(message, rows) {
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
function Restart(message) {
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
						var spawn = exec(`pm2 restart ${config.ProcessName}`, {
							detached: true
						});
					})

			}
			else if (Confirmation.first().toString().toLowerCase() === "no") {
				message.channel.send("Restart Aborted!");
			}
		})
	}
}
function Update(message) {
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
			.pull(remote, "master")
			.exec(() => {
				client.user.setPresence({ game: { name: "with my updated code", type: "playing" }, status: 'online' })
				message.channel.send("Update Complete!")
			})
	}
	else if (Confirmation.first().toString().toLowerCase() === "no") {
		message.channel.send("Restart Aborted!");
	}
}
function Setup(message, prefix) {
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
// #endregion

client.login(config.token);