const Discord = require("discord.js");
const moment = require("moment");
const bot = require('../CorruptionBot.js')

module.exports.AddDonator = (member) => {

    if (member.roles.find(role => role.id === "595625984582090764") && (member.roles.find(role => role.id === "595625982426218501")
        || member.roles.find(role => role.id === "595625980576530432") || member.roles.find(role => role.id === "595625978332577803")
        || member.roles.find(role => role.id === "595625976625627136"))) {

        let DonateEmbed = new Discord.RichEmbed()
            .setAuthor("Thank you for donating to DragonSCP")
            .setDescription("As a thank you for donating to DragonSCP, you are able to claim some ingame perks on our servers")
            .addField("Your rewards are available to be claimed on the following game servers", "SCP: Secret Laboratory"
                + "\nGarrys mod (Trouble in Terrorist Town)"
                + "\nMinecraft")
            .addField("How to claim", "To claim your rewards, go into the <#595757634334752778> channel, "
                + "ping a <@124241068727336963> along with your [SteamID64](https://steamid.io/lookup) "
                + "and which reward(s) you would like to claim");
        //+ "\nTo claim your Rewards available for SCP, please reply using the ?scp command, followed by your [SteamID64](https://steamid.io/lookup). `?scp 76561198163284469`");

        if (member.roles.find(role => role.id === "595625982426218501")) {
            DonateEmbed.addField("Available Rewards",
                `**SCP: Secret Laboratory**\nIngame Tag - Safe Donator\n`
                + `**Garry's mod (Trouble in Terrorist Town)**\nIngame Tag - Safe Donator\n`
                + `**Minecraft**\nIngame Tag - Safe Donator`);
        }
        if (member.roles.find(role => role.id === "595625980576530432")) {
            DonateEmbed.addField("Available Rewards",
                `**Discord**\nCustom Emoji\n`
                + `**SCP: Secret Laboratory**\nIngame Tag - Euclid Donator\n`
                + `**Garry's mod (Trouble in Terrorist Town)**\nIngame Tag - Euclid Donator\n`
                + `**Minecraft**\nIngame Tag - Euclid Donator`);
        }
        if (member.roles.find(role => role.id === "595625978332577803")) {
            DonateEmbed.addField("Available Rewards",
                `**Discord**\nCustom Emoji\n`
                + `**SCP: Secret Laboratory**\nIngame Tag - Keter Donator\nReserved slot\n`
                + `**Garry's mod (Trouble in Terrorist Town)**\nIngame Tag - Keter Donator\n`
                + `**Minecraft**\nIngame Tag - Keter Donator`);
        }
        if (member.roles.find(role => role.id === "595625976625627136")) {
            DonateEmbed.addField("Available Rewards",
                `**Discord**\nCustom Emoji\n`
                + `**SCP: Secret Laboratory**\nIngame Tag - Thuamiel Donator\nReserved slot\n`
                + `**Garry's mod (Trouble in Terrorist Town)**\nIngame Tag - Thuamiel Donator\n`
                + `**Minecraft**\nIngame Tag - Thuamiel Donator\n\n`
                + `**Note:** As a thaumiel donator, you are able to request a custom tag!`);
        }
        member.send(DonateEmbed)
    }

    //595625984582090764 Donator
    //595625982426218501 Safe
    //595625980576530432 Euclid
    //595625978332577803 Keter
    //595625976625627136 Thaumiel
}

module.exports.AddPerks = (message) => {
    let Guild = client.guilds.find(guild => guild.id === MsgContent[1]);
    if (!Guild.member(message.author)) return

    let member = Guild.member(message.author);
    if (member.roles.find(role => role.id === "595625984582090764") && (member.roles.find(role => role.id === "595625982426218501")
        || member.roles.find(role => role.id === "595625980576530432") || member.roles.find(role => role.id === "595625978332577803")
        || member.roles.find(role => role.id === "595625976625627136"))) {

        let Result = fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${config.SteamAIPKey}&steamids=${MsgContent[1]}`)
            .then(res => res.json())
            .then(json => {
                if (!JSON.stringify(json).includes(`,"communityvisibilitystate"`)) return message.channel.send("That is an invalid SteamID64");


            })
    }
}