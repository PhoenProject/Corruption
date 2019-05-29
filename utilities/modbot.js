const Discord = require("discord.js");
const config = require("../config.json");
const utils = require("./utils.js");
const moment = require("moment");
const fs = require("fs");

module.exports.AutoModLogChan = (client, message, sqlcon) => {
    if (message.content.includes("**Player Banned**")) {
        BanSync(message)
    }
    if (message.content.includes("**Player Kicked**")) {
        BanSync(message)
    }
}
module.exports.CommandChans = (client, message, sqlcon) => {
    if (message.content.startsWith("?rban")) {

        let bmessage = message.content.replace('?r', '+')
        message.guild.channels.find(channel => channel.id === `473400727717281793`).send(bmessage);
        message.guild.channels.find(channel => channel.id === `473403553013301248`).send(bmessage);
        message.guild.channels.find(channel => channel.id === `519867312090644490`).send(bmessage);

        message.channel.send(`User has been offline banned`)
        message.delete(10000).catch(error => {console.log(error)})
    }
    if (message.content.startsWith("?rbanip")) {

        let bmessage = message.content.replace('?r', '+')
        message.guild.channels.find(channel => channel.id === `473400727717281793`).send(bmessage);
        message.guild.channels.find(channel => channel.id === `473403553013301248`).send(bmessage);
        message.guild.channels.find(channel => channel.id === `519867312090644490`).send(bmessage);

        message.channel.send(`User has been offline banned`)
        message.delete(10000).catch(error => {console.log(error)})
    }
    else if (message.content.startsWith("?runban")) {
        if ((message.member.roles.has("511249444855873547") || message.member.roles.has("431866226982256642") || message.member.hasPermission("ADMINISTRATOR"))) {
            Unban(message)
        } else {
            message.channel.send("Sorry, but only commanders, captains and ban managers can use this command!")
        }
    }
    else if (message.content.startsWith("?hacker") && (message.member.roles.has("418396672108920832") || message.member.roles.has("456171232065224705"))) {
        Hacker(client, message, sqlcon)
    }
    else if (message.content.startsWith("?watch") && (message.member.roles.has("418396672108920832") || message.member.roles.has("456171232065224705"))) {
        Watch(client, message, sqlcon)
    }
    else if (message.content.startsWith("?unhacker") && (message.member.roles.has("418396672108920832") || message.member.roles.has("456171232065224705"))) {
        let args = message.content.split(' ')

        if (args[1].length != 17 || args[1] === undefined) message.reply("That is not a valid SteamID64")
        else {
            sqlcon.query(`SELECT * FROM watchlist WHERE SteamID = '${args[1]}'`, (err, List) => {
                if (List.length > 1) return message.channel.send("User is not on the watchlist")
                else {
                    sqlcon.query(`DELETE FROM watchlist WHERE  SteamID = '${args[1]}'`)
                    setTimeout(() => {
                        message.channel.send('User has been removed from the hacker watch list!')
                    }, 150);
                }
            })
        }
    }
    else if (message.content.startsWith("?unwatch") && (message.member.roles.has("418396672108920832") || message.member.roles.has("456171232065224705"))) {
        let args = message.content.split(' ')

        if (args[1].length != 17 || args[1] === undefined) message.reply("That is not a valid SteamID64")
        else {
            sqlcon.query(`SELECT * FROM watchlist WHERE SteamID = '${args[1]}'`, (err, List) => {
                if (List.length > 1) return message.channel.send("User is not on the watchlist")
                else {
                    sqlcon.query(`DELETE FROM watchlist WHERE  SteamID = '${args[1]}'`)
                    setTimeout(() => {
                        message.channel.send('User has been removed from the watch list!')
                    }, 150);
                }
            })
        }
    }
    else if (message.content.startsWith("?actionlog") && (message.member.roles.has("418396672108920832") || message.member.roles.has("456171232065224705"))) {
        Actionlog(client, message)
    }
    else if (message.content.startsWith("?ontime") && (message.member.roles.has("418396672108920832") || message.member.roles.has("456171232065224705"))) {
        sqlcon.query(`SELECT * FROM stafflist WHERE DiscordID = '${message.author.id}'`, (err, staff) => {
            if (staff === undefined || staff.length < 1) {
                message.reply("Sorry, but i can not find you in the database!")
            }
            else {
                message.delete(250).catch(error => {console.log(error)})
                message.author.send("```ini"
                    + `\n[This week]`
                    + `\n${staff[0].PlayTime} minutes \n(${(parseInt(staff[0].PlayTime) / 60).toFixed(2)} hours)`
                    + `\n\n[Total]`
                    + `\n${staff[0].PlayTimeTotal} minutes \n(${(parseInt(staff[0].PlayTimeTotal) / 60).toFixed(2)} hours)`
                    + "```");
            }
        })
    }
    else if (message.content.startsWith("?adminontime") && (message.member.roles.has("541986233807536129") || message.member.hasPermission("ADMINISTRATOR"))) {
        message.delete(250).catch(error => {console.log(error)})
        sqlcon.query(`SELECT * FROM stafflist ORDER BY PlayTime DESC`, (err, staff) => {
            if (staff == undefined) message.channel.send(err)
            else {
                let staffstats = "Current staff stats:\n\n"
                staff.forEach(staffmember => {
                    staffstats += `<@${staffmember.DiscordID}>\n[Time this week] ${staffmember.PlayTime}    [Total time] ${staffmember.PlayTimeTotal}\n`;
                })
                message.author.send(staffstats)
            }
        })
    }
    else if (message.content.startsWith("?staff") && message.member.hasPermission("ADMINISTRATOR")) {
        let args = message.content.split(' ')
        if (!args[1] || !args[2] || args[2].length !== "17") return message.channel.send("```?staff <DiscordID> <SteamID64>```")

        sqlcon.query(`INSERT INTO stafflist (DiscordID, SteamID) VALUES ('${args[1]}', '${args[2]}')`)
        message.channel.send("User was added to the staff list")
    }
    else if (message.content.startsWith("?unstaff") && message.member.hasPermission("ADMINISTRATOR")) {
        let args = message.content.split(' ')
        if (!args[1] || args[1].length != "17") return message.channel.send("```?unstaff <SteamID>```")

        sqlcon.query(`DELETE FROM stafflist WHERE SteamID = '${args[1]}'`)
        message.channel.send("User was removed from the staff list")
    }
    else if (message.mentions.users.first() != undefined) {
        if (message.mentions.users.first().id === "448575969981235211") { // Server 1
            let reason = message.content.split(" ")
            message.channel.send(`${server1}${reason.splice(1).join(' ')}`)
        }
        else if (message.mentions.users.first().id === "432717311678349342") { // Server 2
            let reason = message.content.split(" ")
            message.channel.send(`${server2}${reason.splice(1).join(' ')}`)
        }
        else if (message.mentions.users.first().id === "519617194280353805") { // Server 3
            let reason = message.content.split(" ")
            message.channel.send(`${server3}${reason.splice(1).join(' ')}`)
        }
    }
}

async function BanSync(message) {
    let banmessage = message.content.split("**Player Banned**")
    let SteamIDDirty = banmessage[1].split(':')
    let SteamID = SteamIDDirty[2].slice(1, 18)
    let length = SteamIDDirty[5].replace('```', '').slice(1)

    message.guild.channels.find(channel => channel.id === 473400727717281793).send("+ban " + SteamID + " " + length + "m Ban syncing");
    message.guild.channels.find(channel => channel.id === 473403553013301248).send("+ban " + SteamID + " " + length + "m Ban syncing");
    message.guild.channels.find(channel => channel.id === 519867312090644490).send("+ban " + SteamID + " " + length + "m Ban syncing");
}
async function Unban(message) {

    let args = message.content.split(' ')
    let ID = args[1]

    if (args[1]) {
        let bmessage = message.content.replace('?r', '+')
        message.guild.channels.find(channel => channel.id === `473400727717281793`).send(bmessage);
        message.guild.channels.find(channel => channel.id === `473403553013301248`).send(bmessage);
        message.guild.channels.find(channel => channel.id === `519867312090644490`).send(bmessage);
        message.delete(250).catch(error => {console.log(error)})
    }
    else if (args[1] === undefined) {
        message.channel.send(`Please specify a SteamID/IP to unban`)
    }
}
async function Actionlog(client, message) {
    const filter = m => m.author.id === message.author.id

    let name = message.content.split(`'`)
    if (name[2] === undefined) {
        message.channel.send('Now state the name of the user! (Type `cancel` to cancel)')
        message.channel.awaitMessages(filter, { max: 1, time: 35000, errors: ['time'] }).then((Name) => {
            if (Name.first().toString().toLowerCase() != "cancel") {
                let wantedember = new Discord.RichEmbed()
                    .setAuthor(`DragonSCP Mod Log`, client.user.avatarURL)
                    .setColor(8528115)
                    .setTimestamp()
                    .addField(`Steam name`, Name.first().content)
                    .setFooter(`Filed by DragonSCP staff`);

                message.channel.send('Now state the SteamID of the user! (Type `cancel` to cancel, or `unknown` if unknown)')
                message.channel.awaitMessages(filter, { max: 1, time: 35000, errors: ['time'] }).then((ID) => {
                    if (ID.first().toString().toLowerCase() != "cancel") {

                        if (ID.first().content.length === 17) {
                            wantedember.addField(`SteamID`, `[${ID.first().content}](https://steamcommunity.com/profiles/${ID.first().content})`)
                        }
                        else if (ID.first().content.length != 17 && ID.first().content.toLowerCase() === "unknown") {
                            wantedember.addField(`SteamID`, `Unknown SteamID`)
                        }
                        if (ID.first().content.length === 17 || ID.first().content.toLowerCase() === "unknown") {

                            message.channel.send('Now state the offence of the user! (Type `cancel` to cancel)')
                            message.channel.awaitMessages(filter, { max: 1, time: 35000, errors: ['time'] }).then((offence) => {
                                if (offence.first().toString().toLowerCase() != "cancel") {
                                    wantedember.addField(`Offence`, offence.first().content)

                                    message.channel.send('Now state the action taken against the user! (Type `cancel` to cancel)')
                                    message.channel.awaitMessages(filter, { max: 1, time: 35000, errors: ['time'] }).then((action) => {
                                        if (action.first().toString().toLowerCase() != "cancel") {
                                            wantedember.addField(`Action taken`, action.first().content)
                                            wantedember.addField(`Staff member`, message.author)

                                            message.channel.send('Now state any additional notes you have (Type `none` if you have no additional notes, or `cancel` to cancel)')
                                            message.channel.awaitMessages(filter, { max: 1, time: 90000, errors: ['time'] }).then((addnotes) => {
                                                if (addnotes.first().toString().toLowerCase() != "cancel") {
                                                    let AddNotes = addnotes.first().content
                                                    if (AddNotes.toLowerCase() != "none") wantedember.addField(`Additional notes`, AddNotes)

                                                    message.guild.channels.find(channel => channel.id === "513154685117661205").send(wantedember)
                                                    message.channel.bulkDelete(10).catch(error => {console.log(error)})
                                                    message.reply("Your log has been added to <#513154685117661205>")
                                                }
                                                else if (addnotes.first().toString().toLowerCase() === "cancel") {
                                                    message.channel.bulkDelete(10).catch(error => {console.log(error)})
                                                    message.reply("Action log canceled")
                                                }
                                            }).catch(Error => {
                                                message.guild.channels.find(channel => channel.id === "513154685117661205").send(wantedember)
                                                message.channel.bulkDelete(9).catch(error => {console.log(error)})
                                                message.reply("Your log has been added to <#513154685117661205>")
                                            });
                                        }
                                        else if (action.first().toString().toLowerCase() === "cancel") {
                                            message.channel.bulkDelete(8).catch(error => {console.log(error)})
                                            message.reply("Action log canceled")
                                        }
                                    }).catch(Error => {
                                        message.channel.bulkDelete(7).catch(error => {console.log(error)})
                                        message.reply("The form has timed out!")
                                    });
                                }
                                else if (offence.first().toString().toLowerCase() === "cancel") {
                                    message.channel.bulkDelete(6).catch(error => {console.log(error)})
                                    message.reply("Action log canceled")
                                }
                            }).catch(Error => {
                                message.channel.bulkDelete(5).catch(error => {console.log(error)})
                                message.reply("The form has timed out!")
                            });
                        }
                        else {
                            message.channel.bulkDelete(4).catch(error => {console.log(error)})
                            message.reply("Invalid SteamID")
                        }
                    }
                    else if (ID.first().toString().toLowerCase() === "cancel") {
                        message.channel.bulkDelete(4).catch(error => {console.log(error)})
                        message.reply("Action log canceled")
                    }
                }).catch(Error => {
                    message.channel.bulkDelete(3).catch(error => {console.log(error)})
                    message.reply("The form has timed out!")
                });
            }
            else if (Name.first().toString().toLowerCase() === "cancel") {
                message.channel.bulkDelete(2).catch(error => {console.log(error)})
                message.reply("Action log canceled")
            }
        }).catch(Error => {
            message.channel.bulkDelete(1).catch(error => {console.log(error)})
            utils.ConsoleMessage(Error, client)
            message.reply("The form has timed out!")
        });
    }
    else {
        let SteamID = name[2].slice(1, 18)
        if (SteamID.length != 17) return message.channel.send("```?actionlog 'Name' SteamID (Action) Reason```")
        let reason = name[2].split('(')
        let ReasonLength = reason[1].split(')')

        if (SteamID.length != 17) return message.channel.send("```?actionlog 'Name' SteamID (Action) Reason```")
        else {
            let wantedember = new Discord.RichEmbed()
                .setAuthor(`DragonSCP Mod Log`, client.user.avatarURL)
                .setColor(8528115)
                .setTimestamp()
                .addField(`Steam name`, name[1])
                .addField(`SteamID`, SteamID)
                .addField(`Offence`, ReasonLength[1].slice(1))
                .addField(`Action taken`, ReasonLength[0])
                .addField(`Staff member`, message.author)
                .setFooter(`Filed by DragonSCP staff`)

            message.guild.channels.find(channel => channel.id === "513154685117661205").send(wantedember)
            message.channel.bulkDelete(1).catch(error => {console.log(error)})
            message.reply("Your log has been added to <#513154685117661205>")
        }
    }
}
async function Hacker(client, message, sqlcon) {
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
                            sqlcon.query(`INSERT INTO watchlist (Name, SteamID, IP, Reason, Hacker, Watch) VALUES ('${Hname.first().content}', '${Hsteamid.first().toString()}', '', '${SQLreason}', '1', '0')`)

                            wantedembed.addField("Warning!", "This user has been flagged as a possible hacker")
                            message.guild.channels.find(channel => channel.id === "440887611406680096").send(wantedembed)
                            message.channel.bulkDelete(6).catch(error => {console.log(error)})
                            message.reply("Your log has been added to <#440887611406680096>")

                        }
                        else if (Haddnotes.first().toString().toLowerCase() === "cancel") {
                            message.channel.bulkDelete(6).catch(error => {console.log(error)})
                            message.reply(`Hacker logging canceled`)
                        }
                    }).catch(Error => {
                        utils.ConsoleMessage(Error, client)
                        message.channel.bulkDelete(5).catch(error => {console.log(error)})
                        message.reply("The form has timed out!")
                    });
                }
                else if (Hsteamid.first().toString().toLowerCase() === "cancel") {
                    message.channel.bulkDelete(4).catch(error => {console.log(error)})
                    message.reply(`Hacker logging canceled`)
                }
            }).catch(Error => {
                message.channel.bulkDelete(3).catch(error => {console.log(error)})
                message.reply("The form has timed out!")
            });
        }
        else if (Hname.first().toString().toLowerCase() === "cancel") {
            message.channel.bulkDelete(2).catch(error => {console.log(error)})
            message.reply(`Hacker logging canceled`)
        }
    }).catch(Error => {
        message.channel.bulkDelete(1).catch(error => {console.log(error)})
        message.reply("The form has timed out!")
    });
}
async function Watch(client, message, sqlcon) {
    const filter = m => m.author.id === message.author.id

    message.channel.send('Now state the name of the player! (Type `cancel` to cancel)')
    message.channel.awaitMessages(filter, { max: 1, time: 15000, errors: ['time'] }).then((Hname) => {
        if (Hname.first().toString().toLowerCase() != "cancel") {
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

                            sqlcon.query(`INSERT INTO watchlist (Name, SteamID, IP, Reason, Hacker, Watch) VALUES ('${Hname.first().content}', '${Hsteamid.first().toString()}', '', '${SQLreason}', '0', '1')`)

                            message.guild.channels.find(channel => channel.id === "440887611406680096").send(wantedembed)
                            message.channel.bulkDelete(6).catch(error => {console.log(error)})
                            message.reply("Your log has been added to <#440887611406680096>")

                        }
                        else if (Haddnotes.first().toString().toLowerCase() === "cancel") {
                            message.channel.bulkDelete(6).catch(error => {console.log(error)})
                            message.reply(`Suspicious player logging canceled`)
                        }
                    }).catch(Error => {
                        message.channel.bulkDelete(5).catch(error => {console.log(error)})
                        message.reply(Error.toString())
                    });
                }
                else if (Hsteamid.first().toString().toLowerCase() === "cancel") {
                    message.channel.bulkDelete(4).catch(error => {console.log(error)})
                    message.reply(`Suspicious player logging canceled`)
                }
            }).catch(Error => {
                message.channel.bulkDelete(3).catch(error => {console.log(error)})
                message.reply(Error.toString())
            });
        }
        else if (Hname.first().toString().toLowerCase() === "cancel") {
            message.channel.bulkDelete(2).catch(error => {console.log(error)})
            message.reply(`Suspicious player logging canceled`)
        }
    }).catch(Error => {
        message.channel.bulkDelete(1).catch(error => {console.log(error)})
        message.reply(Error.toString())
    });
}