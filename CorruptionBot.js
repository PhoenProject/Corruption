const Discord = require("discord.js");
const client = new Discord.Client();
const config = require("./config.json");
const utils = require('./utilities/BaseBotFunction.js');
const autow = require('./utilities/AutoWarning.js');
const logs = require('./utilities/LoggingSystem.js');
const dscp = require('./utilities/DragonSCP.js');
const watcher = require('./utilities/Watcher.js');
const moment = require("moment");
const fs = require("fs");
const mysql = require("mysql");

let commandfile;

let modulelist = "";
client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();

fs.readdir("./commands/", (err, files) => {
	if (err) utils.ConsoleMessage(err, `error`)
	let jsfile = files.filter(f => f.split(".").pop() === "js");
	if (jsfile.length <= 0) {
		utils.ConsoleMessage(`No commands found`, `fatal error`)
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
	utils.ConsoleMessage(`The following modules were loaded sucessfully: ${modulelist.toString().slice(0, -2)}`, `startup`)
});

// #region SQL

var sqlcon = mysql.createConnection({
	host: config.DBHost,
	user: config.CBotUser,
	password: config.CBotPass,
	database: config.CBotDB,
	charset: 'utf8mb4'
});
sqlcon.connect(err => {
	if (err) utils.ConsoleMessage(err, `error`)
	utils.ConsoleMessage(`Connected to Corruption bot datebase`, `startup`)
})
sqlcon.on('error', error => {
	if (error.code === 'PROTOCOL_CONNECTION_LOST') {
		sqlcon = mysql.createConnection({
			host: config.DBHost,
			user: config.CBotUser,
			password: config.CBotPass,
			database: config.CBotDB,
			charset: 'utf8mb4'
		});
	} else utils.ConsoleMessage(error, `error`)
})

// #endregion

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
const replies = [
	`Did you know: A donkey will sink in quicksand, but a mule won’t.`,
	`Did you know: The Bible is the world’s most shoplifted book.`,
	`Did you know: In Switzerland it is illegal to own just one guinea pig.`,
	`Did you know: The oldest “your mom” joke was discovered on a 3,500 year old Babylonian tablet.`,
	`Did you know: There is a nut on a helicopter called the ‘Jesus Nut’.`,
	`Did you know: BeanieHatGaming is the biggest gay...`,
	`Hmmm, Was there something you needed?`,
	`**Roar!**\nI'm a big scary monster, fear me!!!`,
	`99 bottles of beer on the wall, 99 bottles of beer. \nTake one down and pass it around, 98 bottles of beer on the wall.`,
	`Humpty Dumpty sat on a wall,\nHumpty Dumpty had a great fall;\nAll the king's horses and all the king's men\nCouldn't put Humpty together again.`,
	`Pang!`,
	`Peng!`,
	`Ping!`,
	`Pong!`,
	`Pung!`,
	`No you!`,
	`No u`,
	`I totally wasn't rescued from Area 51...\n*Totally...*`,
	`*You dare challenge me?*`,
	`Go ahead, Mister Joestar`,
	`Killer Queen has touched this ping`,
	`Killer Queen has already touched the ping button`,
	`I am wood`,
	`||<https://bit.ly/1e1EYJv>||`,
	`*Nani*`,
	`Fuck this window`,
	`*Fuck this shit i'm out...*`,
	`Whomst has summoned the almighty one`,
	`A new hand touches the beacon!`
];

const SupportSticky = new Discord.RichEmbed()
	.setAuthor(`Support info`)
	.setDescription(`Please make sure you have read #info before requesting support, as that may answer any questions you have`)
	.setColor('#e450f4')
	.setTimestamp()
	.addField("Ingame Support",
		`For reports from our game servers, please ping the <@&585613595975483423> role`, true)
	.addField("Discord Support", `For reports from our discord, please ping the <@&585613599817596957> role`, true);

// #region Bot events
client.on("ready", () => {
	let GCount = client.guilds
	let UCount = 0
	GCount.forEach(element => {
		UCount = UCount + element.memberCount
	});
	utils.ConsoleMessage(`Bot start up completed! Found ${UCount} users across ${client.guilds.size} guilds.`, `startup`);
	client.user.setPresence({ game: { name: "myself start up", type: "WATCHING" } })
	setInterval(() => {
		const index = Math.floor(Math.random() * (play_act.length - 1) + 1);
		client.user.setPresence({ game: { name: play_act[index], type: "PLAYING" } });
	}, 120000);

	//Support Sticky
	setInterval(() => {
		let supportChan = client.channels.get("625346775149969445")

		if (!supportChan) return;

		supportChan.fetchMessages({ limit: 1 }).then(messages => {
			let lastMessage = messages.first();
			if (!lastMessage || lastMessage.createdAt == null || lastMessage.author.bot) return;

			var lMessageTime = moment(new Date(lastMessage.createdAt));
			var NowDate = moment(new Date(moment().format()));

			if (NowDate.diff(lMessageTime, 'seconds') < 10) return;

			SupportSticky.setFooter(`DragonSCP staff`, lastMessage.guild.iconURL)
			supportChan.send(SupportSticky).catch(error => { utils.ConsoleMessage(error, `error`); });
		})
	}, 5000);

	//Warned role auto removal
	setInterval(() => {
		sqlcon.query(`SELECT * FROM Warns`, (err, rows) => {
			if (err) return utils.ConsoleMessage(err, `error`);
			if (rows.length < 1) return;

			rows.forEach(element => {
				if (element.GuildID === undefined || element.UserID === undefined) return;
				sqlcon.query(`SELECT * FROM Warns WHERE GuildID = ? AND UserID = ?`, [element.GuildID, element.UserID], (err, Warns) => {
					if (err) return utils.ConsoleMessage(err, `error`)

					let member = client.guilds.find(guild => guild.id === element.GuildID).members.find(member => member.id === element.UserID)
					if (member == null) return;

					let warntime = moment(new Date(element.Timestamp));
					if (Warns.length < 2) return CheckWarnAndremove(member, warntime, 14)
					else if (Warns.length > 1 && Warns.length < 3) return CheckWarnAndremove(member, warntime, 28)
				})
			});
		})

	}, 300000);
});

function CheckWarnAndremove(member, Warntime, Limit) {
	let nowtime = moment(new Date(moment().format()));
	let Role = member.guild.roles.find(role => role.name.toLowerCase() === `warned`);
	if (nowtime.diff(Warntime, 'days') < Limit) return;

	if (member.roles.find(role => role.id === Role.id)) {
		member.removeRole(Role).catch(error => { return utils.ConsoleMessage(error, `error`); })

		setTimeout(() => {
			if (!member.roles.find(role => role.id === Role.id)) return member.send(`**Notice from ${member.guild.name}:**\nSince it has been more than ${Limit} days since your last warning, your 'Warned' role has been removed!`)
				.catch(error => { return utils.ConsoleMessage(error, `error`); })
		}, 250)

	}
}

client.on("warn", warn => utils.ConsoleMessage(warn, `warning`));
client.on("error", error => utils.ConsoleMessage(error, `error`));
//client.on("debug", debug => utils.ConsoleMessage(debug, `debug`));
client.on('disconnect', () => utils.ConsoleMessage('Connection to the Discord API has been lost. I will attempt to reconnect momentarily', `info`));
client.on('reconnecting', () => utils.ConsoleMessage('Attempting to reconnect to the Discord API now. Please stand by...', `info`));

// #endregion

// #region Logging

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

	if (oldMem.nickname !== newMem.nickname) logs.MemberUpdate(client, oldMem, newMem, sqlcon);
	else if (oldMem.roles.equals(newMem.roles)) return;
});
client.on("guildBanAdd", async function (guild, member) {
	if (member.bot || !guild) return;
	logs.AddBan(client, member, guild, sqlcon);
});
client.on("guildBanRemove", (guild, user) => {
	if (user.bot || !guild) return;
	logs.RemoveBan(client, user, guild, sqlcon);
});

client.on("messageDelete", async message => {
	if (message.guild == null || message.author.bot) return;
	logs.MessageDeleted(client, message, sqlcon);
});
client.on("messageUpdate", function (oldMSG, newMSG) {
	if (oldMSG.content === newMSG.content || oldMSG == null || newMSG == null || oldMSG.author.bot || newMSG.author.bot || oldMSG.member == null || newMSG.member == null) return;
	logs.MessageEdited(client, oldMSG, newMSG, sqlcon);
});

// #endregion

// #region Message
client.on("message", async message => {

	if (message.author.id === "323991993501876227") {
		message.author.send(`Ping!`)
		message.reply(`Pong!`)
	}


	if (message.author.bot || message.member == null || message.author == null || !message.guild) return
	else if (message.mentions.users.first() != undefined && message.mentions.users.first().id === client.user.id) return HandleMention(message, message.content.split(' '))
	else {
		sqlcon.query(`SELECT * FROM GuildPrefs WHERE GuildID = '${message.guild.id}'`, (err, sqlguild) => {
			autow.globalfilter(client, message, sqlcon);
			autow.filter(client, message, sqlcon);
			autow.massping(client, message, sqlcon);

			MessageCheck(message, sqlguild, sqlcon);
		});
	}
});

function HandleMention(message, messageArgs) {
	if (messageArgs.length > 1 && messageArgs[1] === "help") { return utils.help(message, client); }
	else {
		const index = Math.floor(Math.random() * (replies.length - 1) + 1);
		message.channel.send(replies[index]);
	}
}
function MessageCheck(message, sqlguild, sqlcon) {

	if (sqlguild.length < 1) return CreateGuildPrefs(message.guild, sqlcon);

	let Message = message.content.slice((sqlguild[0].Prefix).length);
	let MsgContentDirty = Message.split(" ");
	let cmd = MsgContentDirty[0];
	let MsgContent = MsgContentDirty.slice(1);

	let commandfile;

	if (!commandfile || commandfile === null) commandfile = client.commands.get(cmd) || client.commands.get(client.aliases.get(cmd))

	switch (message.guild.id) {
		case "499352093019209741": SLExtendedAntiCheatCheck(message, cmd, sqlguild[0].Prefix); break;
		case "582850539604279296": BattleOfTwoServers(message); break;
		case "403155047527088129": DragonSCP(message, cmd, sqlguild[0].Prefix); break;
		default: break;
	}
	CheckCommand(message, cmd, commandfile, MsgContent, sqlguild[0].Prefix);
}
function CheckCommand(message, cmd, commandfile, MsgContent, prefix) {
	switch (cmd) {
		case "heartofcorruption": case "devserver": case "hoc":
			message.author.send("https://discord.gg/asVrGDm").catch(ClosedDM => message.channel.send(`I am unable to DM you, so no invite will be given`))
			break;
		case "github": case "gh": case "git": case "source": case "code": case "sourcecode": case "sc":
			message.author.send("https://github.com/PhoenProject/CorruptionBot").catch(ClosedDM => message.channel.send(`I am unable to DM you, so no link will be given`))
			break;
		case "ping":
			utils.ping(message, client)
			break;
		case "contact":
			utils.Contact(client, message, MsgContent)
			break;
		case "reload":
			Reload(message)
			break;
		case "update":
			utils.update(message, client)
			break;
		case "help": case "info": case "commands":
			sqlcon.query(`SELECT * FROM GuildPrefs WHERE GuildID = '${message.guild.id}'`, (err, rows) => { utils.help(message, client, rows) })
			break;
		case "setup":
			sqlcon.query(`SELECT * FROM GuildPrefs WHERE GuildID = '${message.guild.id}'`, (err, prefix) => { utils.setup(message, client, prefix) })
			break;
		default:
			if (commandfile) {
				commandfile.run(client, message, MsgContent, prefix, sqlcon);
			}
			break;
	}
}

function MsgVoteChan(message, sqlcon, sqlguild) {
	sqlcon.query(`SELECT * FROM MsgVoteChan WHERE channelID = ?`, [message.channel.id], (err, Data) => {
		if (err) return utils.ConsoleMessage(err, `error`)
		if (Data.length < 1) return;

		message.react(sqlguild[0].Upvote).catch(error => { utils.ConsoleMessage(error, `error`) });
		setTimeout(function () {
			message.react(sqlguild[0].DownVote).catch(error => { utils.ConsoleMessage(error, `error`) })
		}, 100);
	})
}

function SLExtendedAntiCheatCheck(message, cmd, prefix) { watcher.watcher(client, message, cmd, prefix); }
function BattleOfTwoServers(message) {
	if (message.channel.id === "582858846519820298") {
		let Choice = message.content.toLowerCase()
		switch (Choice) {
			case "dscp":
			case "dragon":
			case "dragonscp":
			case "dragon scp":
				let DRole = message.guild.roles.find(role => role.id === "582851827058343956");
				message.member.addRole(DRole).catch(error => { utils.ConsoleMessage(error, `error`) });
				break;
			case "asylum":
			case "the asylum":
				let ARole = message.guild.roles.find(role => role.id === "582851825208786944");
				message.member.addRole(ARole).catch(error => { utils.ConsoleMessage(error, `error`) });
				break;
			default:
				break;
		}
	}
}
function DragonSCP(message, cmd, prefix) {
	switch (message.channel.id) {
		case "625346775149969445": dscp.SupportChan(message)
			break;
		case "452160531416219658": dscp.StaffBotCommands(client, message, cmd, prefix);
			break;
		default: //TODO - DSCP Stats
			break;
	}
}

// #endregion

// #region Guilds
client.on("guildCreate", guild => {
	utils.ConsoleMessage(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`, `info`);

	sqlcon.query(`SELECT * FROM GuildPrefs WHERE GuildID = '${guild.id}'`, (err, rows) => {
		if (err) return utils.ConsoleMessage(client, err, `error`);
		if (rows.length < 1) return CreateGuildPrefs(guild, sqlcon)
	})
});
client.on("guildDelete", guild => utils.ConsoleMessage(`I have been removed from: ${guild.name} (id: ${guild.id})`, `info`));

function CreateGuildPrefs(guild, sqlcon) {
	let strTest = guild.name.replace(/[^0-9a-z]/gi, '')
	let GuildName = strTest.replace(/'/g, '~');
	utils.ConsoleMessage(`Corruption just joined ${GuildName}`, `error`)
	sqlcon.query(`INSERT INTO GuildPrefs (GuildName, GuildID, MemLog, MemLogChan, MsgLog, MsgLogChan, ModLog, ModLogchan, AntiRaid, Prefix, GlobalFilter)
	VALUES (?, ?, 'false','null','false','null','false','null','?', '1')`, [GuildName, guild.id])
}

// #endregion

function Reload(message) {
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

client.login(config.token);