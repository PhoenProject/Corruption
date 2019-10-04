const Discord = require("discord.js");
const mysql = require("mysql");
const fetch = require("node-fetch");
const utils = require('./BaseBotFunction.js');
const config = require("../config.json");

var statssqlcon = mysql.createConnection({
    host: config.DBHost,
    user: config.CBotUser,
    password: config.CBotPass,
    database: config.StatDB,
    charset: 'utf8mb4'
});
statssqlcon.connect(err => {
    if (err) utils.ConsoleMessage(error, `error`)
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

module.exports.StaffBotCommands = (client, message, cmd, prefix) => {
    if (!message.content.startsWith(prefix)) return;

    switch (cmd.toLowerCase()) {
        case "rban":
        case "remoteban":
            RemoteBan(message)
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
        case "listwarns":
        case "listpunishments":
            ListPunishments(client, message)
            break;
        case "onduty":
            onduty(message)
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
    }
}

// #region StaffCommands
async function onduty(message) {
    let cmdused = "onduty"
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
            message.guild.channels.find(channel => channel.id == "626546953307815975").send(OffDutyEmbed).catch(error => { utils.ConsoleMessage(error, `error`) });

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

// #endregion

async function RemoteBan(message) {
    let MsgContent = message.content.split(" ");

    if (MsgContent[1].length != 17) return message.reply("That is an invalid SteamID64");

    MsgContent[0] = `+ban`;
    let BanCommand = MsgContent.join(' ');

    message.guild.channels.find(channel => channel.id === `473400727717281793`).send(BanCommand); //FeenServer
    message.guild.channels.find(channel => channel.id === `519867312090644490`).send(BanCommand); //MavoServer

    message.reply(`user with the ID ${MsgContent[1]} has been banned`);
}
async function RemoteUnBan(message) {
    if (!message.member.roles.has("511249444855873547") && !message.member.roles.has("431866226982256642") && !message.member.hasPermission("ADMINISTRATOR"))
        return message.reply("you are not allowed to use this command.\nIf you need someone unbanned, talk to a ban manager, or a member of higher staff if none are available.")

    let MsgContent = message.content.split(" ");
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
                            statssqlcon.query(`INSERT INTO watchlist (Name, SteamID, IP, Reason, Hacker, Watch) VALUES ('${Hname.first().content}', '${Hsteamid.first().toString()}', '', '${SQLreason}', '1', '0')`)

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

                            if (Haddnotes.first().toString().toLowerCase() != "none") wantedembed.addField(`Additional Notes`, Haddnotes.first().content)

                            let SQLreason = Haddnotes.first().toString().replace(/'/g, '~')

                            statssqlcon.query(`INSERT INTO watchlist (Name, SteamID, Reason, Hacker, Watch) VALUES (?, ?, ?, '0', '1')`, [SQLName, Hsteamid.first().content, SQLreason]);

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

async function Actionlog(client, message) {
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

                    message.channel.awaitMessages(filter, { max: 1, time: 30000, errors: ['time'] }).then(async (AddNotes) => {
                        Messages.push(AddNotes.first());

                        if (AddNotes.first().toString().toLowerCase() == "cancel") return CancelActionLog(Messages, message, `Canceled by user!`);
                        else if (AddNotes.first().toString().toLowerCase() != "none") actionlog.addField(`Additional notes`, AddNotes.first())

                        let StaffMember = message.author

                        if (MsgContent.length > 1) {
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

                            if (SteamID.first().content.length !== "unknown") {
                                statssqlcon.query(`INSERT INTO punishments (SteamID, Offence, Punishment, Notes, Staff) VALUES (?, ?, ?, ?, ?)`,
                                    [SteamID.first().toString(), Offence.first().toString(), Action.first().toString(), AddNotes.first().toString(), StaffMember.username]);
                            }


                            message.channel.bulkDelete(Messages).catch(error => { utils.ConsoleMessage(error, `error`) });
                            message.guild.channels.find(channel => channel.id === "513154685117661205").send(actionlog)
                            message.reply("Your log has been added to <#513154685117661205>")
                        }, 150)
                    }).catch(Error => {
                        CancelActionLog(Messages, message, Error);
                    });
                }).catch(Error => {
                    CancelActionLog(Messages, message, Error);
                });
            }).catch(Error => {
                CancelActionLog(Messages, message, Error);
            });
        }).catch(Error => {
            CancelActionLog(Messages, message, Error);
        });
    }).catch(Error => {
        CancelActionLog(Messages, message, Error);
    });
}
async function CancelActionLog(Messages, message, reason) {
    message.channel.bulkDelete(Messages).catch(error => { utils.ConsoleMessage(error, `error`) });

    message.channel.send(`Logging has been canceled!\nReason: ${reason}`);
}

async function ListPunishments(client, message) {
    let MsgContent = message.content.split(" ");
    if (MsgContent.length < 2) return message.channel.send("**Usage:** `?listbans <SteamID>`")

    statssqlcon.query(`SELECT * FROM punishments WHERE SteamID = '${MsgContent[1]}'`, async (err, rows) => {
        if (err) utils.ConsoleMessage(err, client)

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