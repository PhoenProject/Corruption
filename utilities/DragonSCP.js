const Discord = require("discord.js");
const mysql = require("mysql");
const fetch = require("node-fetch");
const utils = require('./BaseBotFunction.js');
const config = require("../config.json");
const isIp = require('is-ip');

var statssqlcon = mysql.createConnection({
    host: config.DBHost,
    user: config.CBotUser,
    password: config.CBotPass,
    database: config.StatDB,
    charset: 'utf8mb4'
});
statssqlcon.connect(err => {
    if (err) utils.ConsoleMessage(err, `error`)
    utils.ConsoleMessage(`Connected to PlayerStats database`, `startup`)
})
statssqlcon.on('error', error => {
    if (error.code === 'PROTOCOL_CONNECTION_LOST') {
        statssqlcon = mysql.createConnection({
            host: config.DBHost,
            user: config.CBotUser,
            password: config.CBotPass,
            database: config.StatDB,
            charset: 'utf8mb4'
        });
    } else utils.ConsoleMessage(error, `error`)
})

module.exports.SupportChan = (message) => {
    message.channel.fetchMessages({ limit: 3 }).then(messages => {
        messages.forEach(messageCheck => {
            if (!messageCheck.author.bot || messageCheck.embeds.length < 1) return;

            if (messageCheck.embeds[0].author.name === `Support info`) messageCheck.delete();
        });
    })
}
module.exports.AppealChan = (message) => {
    message.channel.fetchMessages({ limit: 3 }).then(messages => {
        messages.forEach(messageCheck => {
            if (!messageCheck.author.bot || messageCheck.embeds.length < 1) return;

            if (messageCheck.embeds[0].author.name === `Appeal info`) messageCheck.delete();
        });
    })
}

// #region StaffCommands
module.exports.StaffBotCommands = (client, message, cmd, prefix) => {
    if (!message.content.startsWith(prefix)) return;

    switch (cmd.toLowerCase()) {
        case "rban":
        case "remoteban":
            RemoteBan(client, message, false)
            break;
        case "runban":
        case "remoteunban":
            RemoteUnBan(message)
            break;
        case "hacker":
        case "hackerwatch":
            Hacker(client, message)
            break;
        case "watch":
        case "playerwatch":
            Watch(client, message)
            break;
        case "actionlog":
        case "stafflog":
        case "punishmentlog":
            Actionlog(client, message)
            break;
        case "listbans":
        case "listgamewarns":
        case "listpunishments":
            ListPunishments(client, message)
            break;
        case "onduty":
            onduty(client, message)
            break;
        case "offduty":
            offduty(client, message)
            break;
        case "staff":
        case "addstaff":
        case "newstaff":
            staff(message)
            break;
        case "unstaff":
        case "delstaff":
        case "removestaff":
            unstaff(message)
            break;
        default:
            break;
    }
}

async function onduty(client, message) {
    if (!message.guild.id === 403155047527088129) return;
    let DGuard = message.guild.roles.find(role => role.name === "Dragon Guard").id
    let ODuty = message.guild.roles.find(role => role.name === "Off Duty").id
    if (message.member.roles.find(role => role.id === DGuard)) return message.reply("You are already on duty!")
    else if (!message.member.roles.find(role => role.id === ODuty)) return;
    else if (message.member.roles.find(role => role.id === ODuty)) {
        message.member.addRole(DGuard).catch(error => { utils.ConsoleMessage(error, `error`) });
        message.member.removeRole(ODuty).catch(error => { utils.ConsoleMessage(error, `error`) });
        message.channel.send(`${message.author} is now back on duty!`)
    }

    let appealChan = client.channels.get("634767300096032788")

    if (!appealChan) return;

    appealChan.fetchMessages().then(messages => {
        messages.forEach(messageCheck => {
            if (!messageCheck.author.bot || messageCheck.embeds.length < 1) return;

            if (messageCheck.embeds[0].author.name === message.author.tag) messageCheck.delete();
        })
    })
}
async function offduty(client, message) {

    let DGuard = message.guild.roles.find(role => role.name === "Dragon Guard").id
    let ODuty = message.guild.roles.find(role => role.name === "Off Duty").id
    let DiscordStaff = message.guild.roles.find(role => role.name === "Discord Staff").id
    let IngameStaff = message.guild.roles.find(role => role.name === "Ingame Staff").id

    if (message.member.roles.find(role => role.id === ODuty)) return message.reply("You are already off duty!");
    else if (!message.member.roles.find(role => role.id === DGuard)) return;

    var Messages = [];

    const filter = m => m.author.id == message.author.id
    let AskReason = await message.channel.send("Why are you going off duty?")
    message.channel.awaitMessages(filter, { max: 1, time: 30000, errors: ['time'] }).then(async (Reason) => {
        Messages.push(AskReason.id);
        Messages.push(Reason.first().id);

        if (Reason.first().toString().toLowerCase() == "cancel") return CancelOffduty(Messages, message, `Canceled by user!`);

        let AskReturn = await message.channel.send("When do you expect to return? (Please try to give a date or a rough timeframe)")
        message.channel.awaitMessages(filter, { max: 1, time: 30000, errors: ['time'] }).then(async (Time) => {
            Messages.push(AskReturn.id);
            Messages.push(Time.first().id);

            let OffDutyEmbed = new Discord.RichEmbed()
                .setAuthor(message.author.tag, message.author.avatarURL)
                .setDescription(message.author + " has gone off duty")
                .setColor(message.member.displayHexColor)
                .setThumbnail(message.author.avatarURL)
                .setTimestamp()
                .addField(`Reason:`, Reason.first().toString().toLowerCase(), true)
                .addField(`Expected return:`, Time.first().toString().toLowerCase(), true)
                .setFooter(`UserID: ${message.author.id}`);

            message.channel.send(OffDutyEmbed);
            message.guild.channels.find(channel => channel.id == "634767300096032788").send(OffDutyEmbed).catch(error => { utils.ConsoleMessage(error, `error`) });

            message.member.addRole(ODuty).catch(error => { utils.ConsoleMessage(error, `error`) });
            message.member.removeRole(DGuard).catch(error => { utils.ConsoleMessage(error, `error`) });

            if (message.member.roles.find(role => role.id === DiscordStaff)) message.member.removeRole(DiscordStaff).catch(error => { utils.ConsoleMessage(error, `error`) });
            if (message.member.roles.find(role => role.id === IngameStaff)) message.member.removeRole(IngameStaff).catch(error => { utils.ConsoleMessage(error, `error`) });

            message.channel.bulkDelete(Messages).catch(error => { utils.ConsoleMessage(error, `error`) });

        }).catch(Error => {
            CancelOffduty(Messages, message, Error);
        });
    }).catch(Error => {
        CancelOffduty(Messages, message, Error);
    });

}
async function CancelOffduty(Messages, message, reason) {
    message.channel.bulkDelete(Messages).catch(error => { utils.ConsoleMessage(error, `error`) });

    message.channel.send(`Offduty logging been canceled!\nReason: ${reason}`);
}

async function staff(message) {
    if (!message.member.roles.has("541986233807536129") && !message.member.hasPermission("ADMINISTRATOR")) return message.reply("nice try, but that isn't gonna work 😏")
    if (message.member.mentions == undefined) message.reply("You forgot to @mention the user!")
    else {
        const filter = m => m.author.id === message.author.id

        message.channel.send("Please state the SteamID64 of the user!")
        message.channel.awaitMessages(filter, { max: 1, time: 30000, errors: ['time'] }).then((SteamID) => {

            CheckValidSteamUser(SteamID.first().toString(), function (isValid) {
                if (!isValid) return message.channel.send("That is an invalid SteamID!")
                statssqlcon.query(`INSERT INTO stafflist (DiscordID, SteamID, Timestamp, PlayTime, PlayTimeTotal) VALUES (?, ?, "", 0, 0)`, [message.member.mentions.first().id, SteamID.first().toString()]);
            })
        })
    }
}
async function unstaff(message) {
    if (!message.member.roles.has("541986233807536129") && !message.member.hasPermission("ADMINISTRATOR")) return message.reply("nice try, but that isn't gonna work 😏")

    if (message.member.mentions == undefined) message.reply("You forgot to @mention the user!")
    else {
        const filter = m => m.author.id === message.author.id

        message.channel.send("Please state the SteamID64 of the user!")
        message.channel.awaitMessages(filter, { max: 1, time: 30000, errors: ['time'] }).then((SteamID) => {

            CheckValidSteamUser(SteamID.first().toString(), function (isValid) {
                if (!isValid) return message.channel.send("That is an invalid SteamID!")
                statssqlcon.query(`DELETE stafflist WHERE DiscordID = ? AND SteamID = ?`, [message.member.mentions.first().id, SteamID.first().toString()]);
            })
        })
    }
}

async function RemoteBan(client, message) {
    let MsgContent = message.content.split(" ");

    if (MsgContent[1].length != 17) return message.reply("That is an invalid SteamID64");
    if (isIp.v4(MsgContent[1]) || isIp.v6(MsgContent[1])) return message.reply("IPs cannot be remote banned");

    MsgContent[0] = `+ban`;
    let BanCommand = MsgContent.join(' ');

    message.guild.channels.find(channel => channel.id === `473400727717281793`).send(BanCommand); //FeenServer
    message.guild.channels.find(channel => channel.id === `519867312090644490`).send(BanCommand); //MavoServer

    message.reply(`user with the ID ${MsgContent[1]} has been banned. Starting actionlog now...`);
    Actionlog(client, message, true)

}
async function RemoteUnBan(message) {
    if (!message.member.roles.has("511249444855873547") && !message.member.roles.has("431866226982256642") && !message.member.hasPermission("ADMINISTRATOR"))
        return message.reply("you are not allowed to use this command.\nIf you need someone unbanned, talk to a ban manager, or a member of higher staff if none are available.")

    let MsgContent = message.content.split(" ");

    if (!MsgContent[1]) return message.reply(`you need to state a SteamID/IP`);

    MsgContent[0] = `+unban`;
    let BanCommand = MsgContent.join(' ');

    message.guild.channels.find(channel => channel.id === `473400727717281793`).send(BanCommand); //FeenServer
    message.guild.channels.find(channel => channel.id === `519867312090644490`).send(BanCommand); //MavoServer

    message.reply(`user with the ID/IP ${MsgContent[1]} has been unbanned`);
}
async function Hacker(client, message) {
    const filter = m => m.author.id === message.author.id

    message.channel.send('Now state the name of the suspected hacker! (Type `cancel` to cancel)')
    message.channel.awaitMessages(filter, { max: 1, time: 15000, errors: ['time'] }).then((Hname) => {
        if (Hname.first().toString().toLowerCase() != "cancel") {
            let wantedembed = new Discord.RichEmbed()
                .setAuthor(`Hunter - Suspected Hacker`, client.user.avatarURL)
                .setColor(8528115)
                .addField(`Steam name`, Hname.first().content)
                .setTimestamp()

            message.channel.send('Now state the SteamID64 of the suspected hacker! (Type `cancel` to cancel)')
            message.channel.awaitMessages(filter, { max: 1, time: 15000, errors: ['time'] }).then((Hsteamid) => {
                if (Hsteamid.first().toString().toLowerCase() != "cancel") {

                    wantedembed.addField(`SteamID`, `[${Hsteamid.first().content}](https://steamcommunity.com/profiles/${Hsteamid.first().content})`)
                    message.channel.send('Now state any additional notes you have (Type `none` if you have no additional notes, or `cancel` to cancel)')

                    message.channel.awaitMessages(filter, { max: 1, time: 40000, errors: ['time'] }).then((Haddnotes) => {
                        if (Haddnotes.first().toString().toLowerCase() != "cancel") {

                            if (Haddnotes.first().toString().toLowerCase() != "none") wantedembed.addField(`Additional Notes`, Haddnotes.first().content)

                            let SQLreason = Haddnotes.first().toString().replace(/'/g, '~')
                            statssqlcon.query(`INSERT INTO Watchlist (Name, SteamID, IP, Reason, Hacker, Watch) VALUES ('${Hname.first().content}', '${Hsteamid.first().toString()}', '', '${SQLreason}', '1', '0')`)

                            wantedembed.addField("Warning!", "This user has been flagged as a possible hacker")
                            message.guild.channels.find(channel => channel.id === "440887611406680096").send(wantedembed)
                            message.channel.bulkDelete(6).catch(error => { utils.ConsoleMessage(error, `error`) })
                            message.reply("Your log has been added to <#440887611406680096>")

                        }
                        else if (Haddnotes.first().toString().toLowerCase() === "cancel") {
                            message.channel.bulkDelete(6).catch(error => { utils.ConsoleMessage(error, `error`) })
                            message.reply(`Hacker logging canceled`)
                        }
                    }).catch(Error => {
                        utils.ConsoleMessage(Error, client)
                        message.channel.bulkDelete(5).catch(error => { utils.ConsoleMessage(error, `error`) })
                        message.reply("The form has timed out!")
                    });
                }
                else if (Hsteamid.first().toString().toLowerCase() === "cancel") {
                    message.channel.bulkDelete(4).catch(error => { utils.ConsoleMessage(error, `error`) })
                    message.reply(`Hacker logging canceled`)
                }
            }).catch(Error => {
                message.channel.bulkDelete(3).catch(error => { utils.ConsoleMessage(error, `error`) })
                message.reply("The form has timed out!")
            });
        }
        else if (Hname.first().toString().toLowerCase() === "cancel") {
            message.channel.bulkDelete(2).catch(error => { utils.ConsoleMessage(error, `error`) })
            message.reply(`Hacker logging canceled`)
        }
    }).catch(Error => {
        message.channel.bulkDelete(1).catch(error => { utils.ConsoleMessage(error, `error`) })
        message.reply("The form has timed out!")
    });
}
async function Watch(client, message) {
    const filter = m => m.author.id === message.author.id

    message.channel.send('Now state the name of the player! (Type `cancel` to cancel)')
    message.channel.awaitMessages(filter, { max: 1, time: 15000, errors: ['time'] }).then((Hname) => {
        if (Hname.first().toString().toLowerCase() != "cancel") {

            let SQLName = Hname.first().toString().replace(/'/g, '~')

            let wantedembed = new Discord.RichEmbed()
                .setAuthor(`Hunter - Suspicious player`, client.user.avatarURL)
                .setColor(8528115)
                .setTimestamp()
                .addField(`Steam name`, Hname.first().content)
                .setTimestamp()

            message.channel.send('Now state the SteamID64 of the player! (Type `cancel` to cancel)')
            message.channel.awaitMessages(filter, { max: 1, time: 15000, errors: ['time'] }).then((Hsteamid) => {
                if (Hsteamid.first().toString().toLowerCase() != "cancel") {

                    wantedembed.addField(`SteamID`, `[${Hsteamid.first().content}](https://steamcommunity.com/profiles/${Hsteamid.first().content})`)
                    message.channel.send('Now state any additional notes you have (Type `none` if you have no additional notes, or `cancel` to cancel)')

                    message.channel.awaitMessages(filter, { max: 1, time: 90000, errors: ['time'] }).then((Haddnotes) => {
                        if (Haddnotes.first().toString().toLowerCase() != "cancel") {

                            if (Haddnotes.first().toString().toLowerCase() != "none") wantedembed.addField(`Additional Notes`, AddNotes.first().replace(/[^\w\s]/gi, ''))

                            let SQLreason = Haddnotes.first().toString().replace(/'/g, '~')

                            statssqlcon.query(`INSERT INTO WatchList (Name, SteamID, Reason, Hacker, Watch) VALUES (?, ?, ?, '0', '1')`, [SQLName, Hsteamid.first().content, SQLreason]);

                            message.guild.channels.find(channel => channel.id === "440887611406680096").send(wantedembed)
                            message.channel.bulkDelete(6).catch(error => { utils.ConsoleMessage(error, `error`) })
                            message.reply("Your log has been added to <#440887611406680096>")

                        }
                        else if (Haddnotes.first().toString().toLowerCase() === "cancel") {
                            message.channel.bulkDelete(6).catch(error => { utils.ConsoleMessage(error, `error`) })
                            message.reply(`Suspicious player logging canceled`)
                        }
                    }).catch(Error => {
                        message.channel.bulkDelete(5).catch(error => { utils.ConsoleMessage(error, `error`) })
                        message.reply(Error.toString())
                    });
                }
                else if (Hsteamid.first().toString().toLowerCase() === "cancel") {
                    message.channel.bulkDelete(4).catch(error => { utils.ConsoleMessage(error, `error`) })
                    message.reply(`Suspicious player logging canceled`)
                }
            }).catch(Error => {
                message.channel.bulkDelete(3).catch(error => { utils.ConsoleMessage(error, `error`) })
                message.reply(Error.toString())
            });
        }
        else if (Hname.first().toString().toLowerCase() === "cancel") {
            message.channel.bulkDelete(2).catch(error => { utils.ConsoleMessage(error, `error`) })
            message.reply(`Suspicious player logging canceled`)
        }
    }).catch(Error => {
        message.channel.bulkDelete(1).catch(error => { utils.ConsoleMessage(error, `error`) })
        message.reply(Error.toString())
    });
}

async function Actionlog(client, message, IsAutomatic) {
    const filter = m => m.author.id === message.author.id

    let MsgContent = message.content.split(" ");

    var Messages = [];

    let actionlog = new Discord.RichEmbed()
        .setAuthor(`DragonSCP Mod Log`, client.user.avatarURL)
        .setColor(8528115)
        .setTimestamp()
        .setFooter(`Filed by DragonSCP staff`);

    let AskName = await message.channel.send('State the name of the user! (Type `cancel` to cancel)')
    Messages.push(AskName.id)

    message.channel.awaitMessages(filter, { max: 1, time: 30000, errors: ['time'] }).then(async (Name) => {
        Messages.push(Name.first().id);

        if (Name.first().toString().toLowerCase() == "cancel") return CancelActionLog(Messages, message, `Canceled by user!`);

        actionlog.addField(`Steam name`, Name.first().content);

        let AskID = await message.channel.send('State the SteamID of the user! (Type `cancel` to cancel, or `unknown` if unknown)')
        Messages.push(AskID.id)

        message.channel.awaitMessages(filter, { max: 1, time: 30000, errors: ['time'] }).then(async (SteamID) => {
            Messages.push(SteamID.first());

            if (SteamID.first().toString().toLowerCase() === "cancel") return CancelActionLog(Messages, message, `Canceled by user!`);
            else if (SteamID.first().toString().toLowerCase() !== "unknown" && SteamID.first().content.length !== 17) return CancelActionLog(Messages, message, 'Invalid SteamID64! Please use `unknown` if the SteamID64 is unknown');

            if (SteamID.first().content.length === 17) actionlog.addField(`SteamID`, `[${SteamID.first().content}](https://steamcommunity.com/profiles/${SteamID.first().content})`)
            else if (SteamID.first().content.length != 17 && SteamID.first().content.toLowerCase() === "unknown") actionlog.addField(`SteamID`, `Unknown SteamID`)

            let AskOffence = await message.channel.send('State the offence of the user! (Type `cancel` to cancel)')
            Messages.push(AskOffence.id)

            message.channel.awaitMessages(filter, { max: 1, time: 30000, errors: ['time'] }).then(async (Offence) => {
                Messages.push(Offence.first());

                if (Offence.first().toString().toLowerCase() == "cancel") return CancelActionLog(Messages, message, `Canceled by user!`);
                actionlog.addField(`Offence`, Offence.first().content)

                let AskAction = await message.channel.send('State the action taken against the user! (Type `cancel` to cancel)')
                Messages.push(AskAction.id)

                message.channel.awaitMessages(filter, { max: 1, time: 30000, errors: ['time'] }).then(async (Action) => {
                    Messages.push(Action.first());

                    if (Action.first().toString().toLowerCase() == "cancel") return CancelActionLog(Messages, message, `Canceled by user!`);
                    actionlog.addField(`Action taken`, Action.first().content)

                    let AskNotes = await message.channel.send('State any additional notes you have (Type `none` if you have no additional notes, or `cancel` to cancel)')
                    Messages.push(AskNotes.id)

                    message.channel.awaitMessages(filter, { max: 1, time: 90000, errors: ['time'] }).then(async (AddNotes) => {
                        Messages.push(AddNotes.first());

                        if (AddNotes.first().toString().toLowerCase() == "cancel") return CancelActionLog(Messages, message, `Canceled by user!`);
                        else if (AddNotes.first().toString().toLowerCase() != "none") actionlog.addField(`Additional notes`, AddNotes.first().replace(/[^\w\s]/gi, ''))

                        let StaffMember = message.author

                        if (MsgContent.length > 1 && !IsAutomatic) {
                            let User

                            User = await client.users.find(user => user.username === MsgContent[1])
                            if (User == null || User == undefined) User = await client.users.find(user => user.id === MsgContent[1])

                            if (User !== null || User !== undefined) {
                                actionlog.addField(`Staff member`, `${message.author} on behalf of ${User}`)

                                StaffMember = User;
                            }
                            else actionlog.addField(`Staff member`, `${message.author}`)
                        }
                        else actionlog.addField(`Staff member`, `${message.author}`)

                        setTimeout(Timeout => {

                            if (SteamID.first().content.toLowerCase() !== "unknown") {
                                statssqlcon.query(`INSERT INTO Punishments (SteamID, Offence, Punishment, Notes, Staff) VALUES (?, ?, ?, ?, ?)`,
                                    [SteamID.first().toString(), Offence.first().toString(), Action.first().toString(), AddNotes.first().replace(/[^\w\s]/gi, ''), StaffMember.username]);
                            }

                            message.channel.bulkDelete(Messages).catch(error => { utils.ConsoleMessage(error, `error`) });
                            message.guild.channels.find(channel => channel.id === "513154685117661205").send(actionlog)
                            message.reply("Your log has been added to <#513154685117661205>")
                        }, 150)
                    }).catch(error => {
                        CancelActionLog(Messages, message, error.message);
                    });
                }).catch(error => {
                    CancelActionLog(Messages, message, error.message);
                });
            }).catch(error => {
                CancelActionLog(Messages, message, error.message);
            });
        }).catch(error => {
            CancelActionLog(Messages, message, error.message);
        });
    }).catch(error => {
        CancelActionLog(Messages, message, error.message);
    });
}
async function CancelActionLog(Messages, message, reason) {
    message.channel.bulkDelete(Messages).catch(error => { utils.ConsoleMessage(error, `error`) });

    message.reply(`Logging has been canceled!\nReason: ${reason.toString()}`);
}

async function ListPunishments(client, message) {
    let MsgContent = message.content.split(" ");
    if (MsgContent.length < 2) return message.channel.send("**Usage:** `?listbans <SteamID>`")

    statssqlcon.query(`SELECT * FROM Punishments WHERE SteamID = '${MsgContent[1]}'`, async (err, rows) => {
        if (err) utils.ConsoleMessage(err, `error`)

        if (rows.length < 1) { message.channel.send("No punishments found for this user!"); return; }

        let PunishmentEmbed = new Discord.RichEmbed()
            .setFooter(`Profile data generated using the Steam web API`)
            .setTimestamp();

        (rows).forEach(element => {
            PunishmentEmbed.addField(`Punishment ${rows.indexOf(element) + 1} of ${rows.length}`,
                `Issued by ${client.users.find(user => user.username === element.Staff)}`
                + `\nOffence: ${element.Offence}`
                + `\nPunishment: ${element.Punishment}`
                + `\nNotes: ${element.Notes}`)
        });

        await GetSteamData(MsgContent[1], function (DataObject) {
            PunishmentEmbed.setAuthor(DataObject.Author, "", `https://steamcommunity.com/profiles/${MsgContent[1]}`)
            PunishmentEmbed.setDescription(DataObject.Description)
            PunishmentEmbed.setColor(DataObject.Color)
            PunishmentEmbed.setThumbnail(DataObject.Thumbnail)

            setTimeout(timeout => { message.channel.send(PunishmentEmbed) }, 250)
        })
    })
}
async function GetSteamData(SteamID, callback) {
    let DataObject = new Object();

    fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${config.SteamAIPKey}&steamids=${SteamID}`)
        .then(res => res.json())
        .then(json => {
            if (!JSON.stringify(json).includes(`,"communityvisibilitystate"`)) {

                DataObject.Author = `Punishments for ${SteamID}`;
                DataObject.Thumbnail = "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/fe/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb.jpg";
                DataObject.Description = `Limited data available for this SteamID.\nEither the ID is invalid, or the web API is unavailable`;
                DataObject.Color = "#99aab5";

                return callback(DataObject);
            }
            else {
                DataObject.Author = `Punishments for ${json.response.players[0].personaname} (${SteamID})`;
                DataObject.Thumbnail = json.response.players[0].avatarfull

                if (json.response.players[0].gameid != undefined) {
                    DataObject.Color = "#7da10e";
                    DataObject.Description = `Currently ingame: ${json.response.players[0].gameextrainfo} (${json.response.players[0].gameid})`;
                }
                else {
                    if (json.response.players[0].personastate != 0) {
                        DataObject.Color = "#00adee";
                        DataObject.Description = `Currently online`;
                    }
                    else {
                        DataObject.Color = "#99aab5";
                        DataObject.Description = `Currently offline`;
                    }
                }

                return callback(DataObject);
            }
        })
}
async function CheckValidSteamUser(SteamID, callback) {
    fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${config.SteamAIPKey}&steamids=${SteamID}`)
        .then(res => res.json())
        .then(json => {
            if (!JSON.stringify(json).includes(`,"communityvisibilitystate"`)) return callback(false)
            else return callback(true)
        })
}

// #endregion

module.exports.PatreonMessage = (client, oldMem, newMem, sqlcon) => {


    if (!oldMem.roles.find(role => role.id === "595625984582090764") && !newMem.roles.find(role => role.id === "595625984582090764")) return;

    if ((!oldMem.roles.find(role => role.id === "595625984582090764") && !oldMem.roles.find(role => role.id === "595625982426218501") &&
        !oldMem.roles.find(role => role.id === "595625980576530432") && !oldMem.roles.find(role => role.id === "595625978332577803") &&
        !oldMem.roles.find(role => role.id === "595625976625627136")) && (newMem.roles.find(role => role.id === "595625984582090764") ||
            newMem.roles.find(role => role.id === "595625982426218501") || newMem.roles.find(role => role.id === "595625980576530432") ||
            newMem.roles.find(role => role.id === "595625978332577803") || newMem.roles.find(role => role.id === "595625976625627136"))) {

        let DonatorEmbed = new Discord.RichEmbed()
            .setAuthor("Thank you for donating to DragonSCP")
            .setDescription("As a thank you for donating, you are able to claim some rewards on our SCP: Secret Laboratory servers")
            .addField("How to claim")


        //     let DonateEmbed = new Discord.RichEmbed()
        //         .setAuthor("Thank you for donating to DragonSCP")
        //         .setDescription("As a thank you for donating to DragonSCP, you are able to claim some ingame perks on our servers")
        //         .addField("How to claim", "To claim your rewards, go into the <#595757634334752778> channel, "
        //             + "ping <@124241068727336963> along with your [SteamID64](https://steamid.io/lookup) "
        //             + "and which reward(s) you would like to claim");
        //     //+ "\nTo claim your Rewards available for SCP, please reply using the ?scp command, followed by your [SteamID64](https://steamid.io/lookup). `?scp 76561198163284469`");

        //     if (member.roles.find(role => role.id === "595625982426218501")) {
        //         DonateEmbed.addField("Available Rewards",
        //             `**SCP: Secret Laboratory**\nIngame Tag - Safe Donator\n`
        //             + `**Garry's mod (Trouble in Terrorist Town)**\nIngame Tag - Safe Donator\n`
        //             + `**Minecraft**\nIngame Tag - Safe Donator`);
        //     }
        //     if (member.roles.find(role => role.id === "595625980576530432")) {
        //         DonateEmbed.addField("Available Rewards",
        //             `**Discord**\nCustom Emoji\n`
        //             + `**SCP: Secret Laboratory**\nIngame Tag - Euclid Donator\n`
        //             + `**Garry's mod (Trouble in Terrorist Town)**\nIngame Tag - Euclid Donator\n`
        //             + `**Minecraft**\nIngame Tag - Euclid Donator`);
        //     }
        //     if (member.roles.find(role => role.id === "595625978332577803")) {
        //         DonateEmbed.addField("Available Rewards",
        //             `**Discord**\nCustom Emoji\n`
        //             + `**SCP: Secret Laboratory**\nIngame Tag - Keter Donator\nReserved slot\n`
        //             + `**Garry's mod (Trouble in Terrorist Town)**\nIngame Tag - Keter Donator\n`
        //             + `**Minecraft**\nIngame Tag - Keter Donator`);
        //     }
        //     if (member.roles.find(role => role.id === "595625976625627136")) {
        //         DonateEmbed.addField("Available Rewards",
        //             `**Discord**\nCustom Emoji\n`
        //             + `**SCP: Secret Laboratory**\nIngame Tag - Thuamiel Donator\nReserved slot\n`
        //             + `**Garry's mod (Trouble in Terrorist Town)**\nIngame Tag - Thuamiel Donator\n`
        //             + `**Minecraft**\nIngame Tag - Thuamiel Donator\n\n`
        //             + `**Note:** As a thaumiel donator, you are able to request a custom tag!`);
        //     }
        //     member.send(DonateEmbed)
        // }
    }
}

module.exports.DonoChan = (client, message, cmd, prefix) => {
    if (!message.content.startsWith(prefix)) return;

    switch (cmd.toLowerCase()) {
        case "claimtag":
        case "partnertag":
        case "donotag":
            ClaimTag(client, message)
            break;
        case "customtag":
            CustomTag(client, message)
            break;
        default:
            break;
    }
}

async function ClaimTag(client, message) {
    var member = message.member;

    if (!member.roles.find(role => role.id === "418396672108920832") && !member.roles.find(role => role.id === "456171232065224705")
        && !member.roles.find(role => role.id === "572791330653077525") && !member.roles.find(role => role.id === "595625984582090764")) return;

    const filter = m => m.author.id === message.author.id

    var messages = [];
    var TagsList = [];
    let data = new Object();

    data.discordID = message.author.id;

    //#region RoleIDs

    //418396672108920832 Dragon guard
    //456171232065224705 Off Duty
    //595625984582090764 Donator

    //595625982426218501 Safe
    //595625980576530432 Euclid
    //595625978332577803 Keter
    //595625976625627136 Thaumiel
    //572791330653077525 Partner
    //572791333215928340 Youtuber
    //482694507788369922 Streamer

    //#endregion

    //#region Role Checks

    if (member.roles.find(role => role.id === "418396672108920832") || member.roles.find(role => role.id === "456171232065224705")) data.prefix = "Staff";
    else if (member.roles.find(role => role.id === "572791330653077525")) data.prefix = "Partner";
    else if (member.roles.find(role => role.id === "595625984582090764")) data.prefix = "Donator";

    if (member.roles.find(role => role.id === "595625982426218501")) TagsList.push(["Safe", "yellow"])
    if (member.roles.find(role => role.id === "595625980576530432")) TagsList.push(["Euclid", "orange"])
    if (member.roles.find(role => role.id === "595625978332577803")) TagsList.push(["Keter", "tomato"])
    if (member.roles.find(role => role.id === "595625976625627136")) TagsList.push(["Thaumiel", "pumpkin"])
    if (member.roles.find(role => role.id === "572791330653077525")) TagsList.push(["Partner", "blue_green"])
    if (member.roles.find(role => role.id === "572791333215928340")) TagsList.push(["Youtuber", "aqua"])
    if (member.roles.find(role => role.id === "482694507788369922")) TagsList.push(["Streamer", "cyan"])

    //#endregion

    var tagString = [];
    var index = 0;

    TagsList.forEach(element => {
        index++;
        tagString.push(`[${index}] ${data.prefix} - ${element[0]} (${element[1].toUpperCase()})`);
    });
    let TagEmbed = new Discord.RichEmbed()
        .setAuthor(`Tag claim for SCP: Secret Laboratory`)
        .setColor(8528115)
        .setTimestamp()
        .addField("Available Tags", tagString.join("\n"));

    let TagEmbedMessage = await message.channel.send(TagEmbed);
    messages.push(TagEmbedMessage);

    let AskTag = await message.channel.send('Please state the number of the tag you would like (Or type `Cancel` to cancel)')
    messages.push(AskTag.id)

    message.channel.awaitMessages(filter, { max: 1, time: 45000, errors: ['time'] }).then(async (GetTag) => {
        messages.push(GetTag.first().id);

        if (GetTag.first().toString().toLowerCase() == "cancel") return CancelTag(messages, message, `Canceled by user!`);

        var number = parseInt(GetTag.first().toString().toLowerCase());

        if (isNaN(number)) return CancelTag(messages, message, "No valid number given");

        if (number - 1 > TagsList.length) return CancelTag(messages, message, "Given number was too high");

        data.suffix = TagsList[number - 1][0];
        data.colour = TagsList[number - 1][1];

        let AskID = await message.channel.send('Please give your SteamID64.'
            + '\nThis can be gotten by going to https://steamid.io/lookup and putting in your profile URL'
            + '\n(Type `Cancel` to cancel)')
        messages.push(AskID.id)

        message.channel.awaitMessages(filter, { max: 1, time: 45000, errors: ['time'] }).then(async (GetID) => {
            messages.push(GetID.first().id);

            if (GetID.first().toString().toLowerCase() == "cancel") return CancelTag(messages, message, `Canceled by user!`);

            let MsgContent = GetID.first().toString().toLowerCase().split(" ");

            data.steamID = MsgContent[0];

            statssqlcon.query(`DELETE FROM PlayerBadges WHERE DiscordID = ?`, [data.discordID]);

            statssqlcon.query(`INSERT INTO PlayerBadges (SteamID, DiscordID, Prefix, Suffix, Colour) VALUES (?, ?, ?, ?, ?)`,
                [data.steamID, data.discordID, data.prefix, data.suffix, data.colour]);


            message.channel.bulkDelete(messages).catch(error => { utils.ConsoleMessage(error, `error`) });

            let TagConfirmed = new Discord.RichEmbed()
                .setAuthor(`Tag claimed for SCP: Secret Laboratory`)
                .setColor(8528115)
                .setTimestamp()
                .addField("New Tag",
                    `Tag **${data.prefix} - ${data.suffix}** coloured \`${data.colour.toUpperCase()}\` `
                    + `has been granted to [${data.steamID}](https://steamcommunity.com/profiles/${data.steamID})`
                    + `\nNote: A round restart is required for new/updated tags to appear`);

            message.channel.send(TagConfirmed);



        }).catch(error => {
            CancelTag(messages, message, error.message);
        });
    }).catch(error => {
        CancelTag(messages, message, error.message);
    });
}

async function CancelTag(messages, message, reason) {
    message.channel.bulkDelete(messages).catch(error => { utils.ConsoleMessage(error, `error`) });

    message.reply(`Tag Request canceled!\nReason: ${reason.toString()}`);
}