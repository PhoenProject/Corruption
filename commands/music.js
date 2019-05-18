const Discord = require("discord.js");
const ytdl = require('ytdl-core');
const YouTube = require('simple-youtube-api');
const utils = require("../utilities/utils.js");
const base = require("../utilities/basebot.js")
const dscp = require("../utilities/dscpcmds.js")
const config = require("../config.json");
const moment = require("moment");
const fs = require("fs");
const queue = new Map();
const youtube = new YouTube(config.APIkey);

module.exports.run = async (client, message, args, sqlcon) => {
    const searchString = args.slice(1).join(' ');
    const url = args[1] ? args[1].replace(/<(.+)>/g, '$1') : '';
    const serverQueue = queue.get(message.guild.id);

    if (args[0] === 'play') {
        const voiceChannel = message.member.voiceChannel;
        if (!voiceChannel) return message.channel.send('I\'m sorry but you need to be in a voice channel to play music!');
        const permissions = voiceChannel.permissionsFor(message.client.user);
        if (!permissions.has('CONNECT')) {
            return message.channel.send('I cannot connect to your voice channel, make sure I have the proper permissions!');
        }
        if (!permissions.has('SPEAK')) {
            return message.channel.send('I cannot speak in this voice channel, make sure I have the proper permissions!');
        }

        if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
            const playlist = await youtube.getPlaylist(url);
            const videos = await playlist.getVideos();
            for (const video of Object.values(videos)) {
                const video2 = await youtube.getVideoByID(video.id); // eslint-disable-line no-await-in-loop
                await handleVideo(video2, message, voiceChannel, true); // eslint-disable-line no-await-in-loop
            }
            return message.channel.send(`✅ Playlist: **${playlist.title}** has been added to the queue!`);
        } else {
            try {
                var video = await youtube.getVideo(url);
            } catch (error) {
                try {
                    var videos = await youtube.searchVideos(searchString, 10);
                    let index = 0;
                    message.channel.send(`
__**Song selection:**__

${videos.map(video2 => `**${++index} -** ${video2.title}`).join('\n')}

Please provide a value to select one of the search results ranging from 1-10.
					`);
                    // eslint-disable-next-line max-depth
                    try {
                        var response = await message.channel.awaitMessages(msg => msg.content > 0 && msg.content < 11, {
                            maxMatches: 1,
                            time: 10000,
                            errors: ['time']
                        });
                    } catch (err) {
                        console.error(err);
                        return message.channel.send('No or invalid value entered, cancelling video selection.');
                    }
                    const videoIndex = parseInt(response.first().content);
                    var video = await youtube.getVideoByID(videos[videoIndex - 1].id);
                } catch (err) {
                    console.error(err);
                    return message.channel.send('🆘 I could not obtain any search results.');
                }
            }
            return handleVideo(video, message, voiceChannel);
        }
    } else if (args[0] === 'skip') {
        sqlcon.query(`SELECT * FROM guildprefs WHERE GuildID = '${message.guild.id}'`, (err, rows) => {
            if (err) throw err
            if (message.member.roles.find(role => role.id === rows[0].ModRole) || message.member.roles.find(role => role.id === rows[0].AdminRole) || message.member.hasPermission("ADMINISTRATOR")) {
                if (!message.member.voiceChannel) return message.channel.send('You are not in a voice channel!');
                if (!serverQueue) return message.channel.send('There is nothing playing that I could skip for you.');
                serverQueue.connection.dispatcher.end('Skip command has been used!');
                return undefined;
            }
        })
    } else if (args[0] === 'stop') {
        if (!message.member.voiceChannel) return message.channel.send('You are not in a voice channel!');
        if (!serverQueue) return message.channel.send('There is nothing playing that I could stop for you.');
        serverQueue.songs = [];
        serverQueue.connection.dispatcher.end('Stop command has been used!');
        return undefined;
    } else if (args[0] === 'volume') {
        sqlcon.query(`SELECT * FROM guildprefs WHERE GuildID = '${message.guild.id}'`, (err, rows) => {
            if (err) throw err
            if (message.member.roles.find(role => role.id === rows[0].AdminRole) || message.member.hasPermission("ADMINISTRATOR")) {
                if (!message.member.voiceChannel) return message.channel.send('You are not in a voice channel!');
                if (!serverQueue) return message.channel.send('There is nothing playing.');
                if (!args[1]) return message.channel.send(`The current volume is: **${serverQueue.volume}**`);
                if (args[1] > 10) return message.channel.send(`The volume can not be set higher than 10!`);
                serverQueue.volume = args[1];
                serverQueue.connection.dispatcher.setVolumeLogarithmic(args[1] / 10);
                return message.channel.send(`I set the volume to: **${args[1]}**`);
            }
        })
    } else if (args[0] === 'np') {
        if (!serverQueue) return message.channel.send('There is nothing playing.');
        return message.channel.send(`🎶 Now playing: **${serverQueue.songs[0].title}**`);
    } else if (args[0] === 'queue') {
        if (!serverQueue) return message.channel.send('There is nothing playing.');
        return message.channel.send(`
__**Song queue:**__

${serverQueue.songs.map(song => `**-** ${song.title}`).join('\n')}

**Now playing:** ${serverQueue.songs[0].title}
		`);
    } else if (args[0] === 'pause') {
        if (serverQueue && serverQueue.playing) {
            serverQueue.playing = false;
            serverQueue.connection.dispatcher.pause();
            return message.channel.send('⏸ Paused the music for you!');
        }
        return message.channel.send('There is nothing playing.');
    } else if (args[0] === 'resume') {
        if (serverQueue && !serverQueue.playing) {
            serverQueue.playing = true;
            serverQueue.connection.dispatcher.resume();
            return message.channel.send('▶ Resumed the music for you!');
        }
        return message.channel.send('There is nothing playing.');
    } else {
        let msgvoteemd = new Discord.RichEmbed()
            .setAuthor("Corruption bot logging", client.user.avatarURL)
            .setDescription("Changes the logging settings for this server")
            .addField("**__Commands:__**",
                "**play** - Adds a song to the music queue"
                + "\n**skip** - Skips the current song"
                + "\n**stop** - Stops the music, clears the queue and disconnects the bot from the voice channel"
                + "\n**volume** - Sets the bot's volume"
                + "\n**np** - Shows what song is currently playing"
                + "\n**pause** - Pauses the current song"
                + "\n**resume** - Resumes the current song")
            .setFooter(`Do ${gPrefix}help for help with commands`)
            .setTimestamp()
            .setColor(message.member.displayHexColor)
        message.channel.send(msgvoteemd)
    }
    async function handleVideo(video, msg, voiceChannel, playlist = false) {
        const serverQueue = queue.get(msg.guild.id);
        const song = {
            id: video.id,
            title: Discord.escapeMarkdown(video.title),
            url: `https://www.youtube.com/watch?v=${video.id}`
        };
        if (!serverQueue) {
            const queueConstruct = {
                textChannel: msg.channel,
                voiceChannel: voiceChannel,
                connection: null,
                songs: [],
                volume: 5,
                playing: true
            };
            queue.set(msg.guild.id, queueConstruct);

            queueConstruct.songs.push(song);

            try {
                var connection = await voiceChannel.join();
                queueConstruct.connection = connection;
                play(msg.guild, queueConstruct.songs[0]);
            } catch (error) {
                console.error(`I could not join the voice channel: ${error}`);
                queue.delete(msg.guild.id);
                return msg.channel.send(`I could not join the voice channel: ${error}`);
            }
        } else {
            serverQueue.songs.push(song);
            let cmessage = serverQueue.songs;
            utils.Console(cmessage, client)
            if (playlist) return undefined;
            else return msg.channel.send(`✅ **${song.title}** has been added to the queue!`);
        }
        return undefined;
    }
    function play(guild, song) {
        const serverQueue = queue.get(guild.id);
        if (!song) {
            serverQueue.voiceChannel.leave();
            queue.delete(guild.id);
            return;
        }
        let stream = ytdl(song.url, { highWaterMark: 1024 * 1024 * 64, filter: "audio", passes: 5, bitrate: 192000 })
        stream.on("error", console.error)
        setTimeout(function () {
            const dispatcher = serverQueue.connection.playStream(stream)
                .on('end', reason => {
                    let cmessage = reason;
                    utils.Console(cmessage, client)
                    setTimeout((reason) => {
                        serverQueue.songs.shift();
                        play(guild, serverQueue.songs[0]);
                    }, 200)
                })
                .on('error', error => console.error(error));
            dispatcher.setVolumeLogarithmic(serverQueue.volume / 10);
        }, 500);

        serverQueue.textChannel.send(`🎶 Start playing: **${song.title}**`);
    }
}
module.exports.config = {
    name: "music",
    aliases: ["m"],
    info: "Music commands for the bot",
    type: "test"
}