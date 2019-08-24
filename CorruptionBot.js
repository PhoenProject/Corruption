const Discord = require("discord.js");
const client = new Discord.Client();
const config = require("./config.json");
const utils = require('./utilities/utils.js');
const dscp = require('./utilities/dscpcmds.js');
const autow = require('./utilities/autowarning.js');
const mbot = require('./utilities/modbot.js');
const stats = require('./utilities/stattrack.js');
const watcher = require('./utilities/watcher.js');
const logs = require('./utilities/loggingsystem.js');
const patreon = require('./utilities/patreon.js');
const commands = require('./utilities/basecommands.js');
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
const replies = [
	`Did you know: A donkey will sink in quicksand, but a mule won’t.`,
	`Did you know: The Bible is the world’s most shoplifted book.`,
	`Did you know: In Switzerland it is illegal to own just one guinea pig.`,
	`Did you know: The oldest “your mom” joke was discovered on a 3,500 year old Babylonian tablet.`,
	`Did you know: There is a nut on a helicopter called the ‘Jesus Nut’.`,
	`Did you know: BeanieHatGaming is the biggest gay...`,
	`Did you know: Kerbal Space Program is getting a sqeual!`,
	`Hmmm, Was there something you needed?`,
	`**Roar!**\nI'm a big scary monster, fear me!!!`,
	`99 bottles of beer on the wall, 99 bottles of beer. \nTake one down and pass it around, 98 bottles of beer on the wall.`,
	`Humpty Dumpty sat on a wall,\nHumpty Dumpty had a great fall;\nAll the king's horses and all the king's men\nCouldn't put Humpty together again.`,
	`Pang!`,
	`Peng!`,
	`Ping!`,
	`Pong!`,
	`Pung!`
];
// #endregion

client.on("ready", () => {
	let GCount = client.guilds
	let UCount = 0
	GCount.forEach(element => {
		UCount = UCount + element.memberCount
	});
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

	if (oldMem.roles.equals(newMem.roles)) return;

	if (newMem.roles.find(role => role.id === "595625984582090764")) {
		patreon.AddDonator(newMem);
	}
});
client.on("guildBanAdd", async function (guild, member) {
	if (member.bot || !member.guild) return;
	logs.AddBan(client, member, sqlcon);
})
// #endregion


// #region Misc. bot events
client.on("warn", console.warn);
client.on("error", console.error);
client.on('disconnect', () => console.log('I just disconnected, making sure you know, I will reconnect now...'));
client.on('reconnecting', () => console.log('I am reconnecting now!'));
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
	else if (!message.guild) { commands.say(message, client) }
	else if (message.mentions.users.first() != undefined && message.mentions.users.first().id === client.user.id) {
		HandleMention(message, args)
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

//#region Handle Message
function MessageCheck(message, sqlguild, sqlcon) {

	if(!message.content.startsWith(sqlguild[0].Prefix)) return;

	let Message = message.content.slice((sqlguild[0].Prefix).length);
	let MsgContent = Message.split(" ");
	let cmd = MsgContent[0]
	let args = MsgContent.slice(1);
	let commandfile = client.commands.get(cmd) || client.commands.get(client.aliases.get(cmd))

	if (sqlguild.length < 1) return CreateGuildPrefs(message.guild, sqlcon)

	sqlcon.query(`SELECT * FROM chanprefs WHERE GuildID = '${message.guild.id}' AND ChannelID = '${message.channel.id}'`, (err, sqlchannelcreate) => {
		if (err) ConsoleMessage(error, client)
		if (sqlchannelcreate.length < 1) { CreateChanPrefs(message, sqlcon) }
	})

	setTimeout(function () {
		sqlcon.query(`SELECT * FROM chanprefs WHERE GuildID = '${message.guild.id}' AND ChannelID = '${message.channel.id}'`, (err, sqlchannel) => {
			if (err) ConsoleMessage(error, client)
			if (sqlchannel[0].MsgVote === 'true') { MsgVoteChan(message, sqlcon, sqlguild) }
		})

		SLExtendedAntiCheatCheck(message)
		BattleOfTwoServers(message)
		DragonSCP(message, cmd)

		CheckCommand(message, cmd, commandfile, args)
	}, 200)
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

//#region ServerSpecificStuffs
function SLExtendedAntiCheatCheck(message) {
	if (message.guild.id === "499352093019209741") watcher.watcher(client, message);
}
function BattleOfTwoServers(message) {
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
function DragonSCP(message, cmd) {
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
}
//#endregion

//#region Chat Functions
function CheckCommand(message, cmd, commandfile, args){
	switch (cmd) {
		case "heartofcorruption": case "devserver": case "hoc":
			message.author.send("https://discord.gg/asVrGDm")
			break;
		case "github": case "gh": case "git": case "source": case "code": case "sourcecode": case "sc":
			message.author.send("https://github.com/PhoenProject/CorruptionBot")
			break;
		case "ping":
			commands.ping(message, client)
			break;
		case "contact":
			commands.contact(client, message, args)
			break;
		case "reload":
			commands.reload(message, client)
			break;
		case "restart":
			commands.restart(message)
			break;
		case "update":
			commands.update(message, client)
			break;
		case "help": case "info": case "commands":
			sqlcon.query(`SELECT * FROM guildprefs WHERE GuildID = '${message.guild.id}'`, (err, rows) => { commands.help(message, client, rows) })
			break;
		case "setup":
			sqlcon.query(`SELECT * FROM guildprefs WHERE GuildID = '${message.guild.id}'`, (err, prefix) => { commands.setup(message, client, prefix) })
			break;
		default:
			if (commandfile) commandfile.run(client, message, args, sqlcon);
			break;
	}
}

function MsgVoteChan(message, sqlcon, sqlguild) {
	if (sqlguild != undefined) {
		message.react(sqlguild[0].Upvote).catch(error => { utils.CatchError(message, error, cmdused) });
		setTimeout(function () {
			message.react(sqlguild[0].DownVote).catch(error => { utils.CatchError(message, error, cmdused) })
		}, 100);
	}
}

function HandleMention(message, args){
	if(args.length > 2 && args[1] === "help") commands.helpPing(message, sqlcon)

	else {
		const index = Math.floor(Math.random() * (replies.length - 1) + 1);
		message.channel.send(replies[index]);
	}
}
// #endregion

client.login(config.token);