// Declare all important variables
const { Client, Events, GatewayIntentBits, ActivityType } = require('discord.js');
const { tokenDiscord, tokenTwitch } = require('./config.json');
const axios = require('axios');
const express = require('express');



// Declare Intents
const client = new Client({ intents: [Object.keys(GatewayIntentBits)] });


// Function to get game cover from Twitch
async function getGameCover(gameName) {
        try {
                // Request to Twitch API to get game information
                const response = await axios.get('https://api.twitch.tv/helix/games', {
                        params: {
                                'name': gameName
                        },
                        headers: {
                                'Client-ID': 'gp762nuuoqcoxypju8c569th9wz7q5', // Replace with your Client ID
                                'Authorization': `Bearer ${tokenTwitch}`
                        }
                });

                const games = response.data.data;
                if (games.length > 0) {
                        const game = games[0];
                        if (game.box_art_url) {
                                const coverUrl = game.box_art_url.replace('{width}', '600').replace('{height}', '800'); // Modify size if necessary
                                
                                return coverUrl
                        } else {
                                console.log('No cover image available.');
                        }
                } else {
                        console.log(`No game found for the name ${gameName}.`);
                }
        } catch (error) {
                console.error('Error fetching game cover:', error);
        }
}
async function myStatus(id) {
        const info = {
                globalName: "",
                username: "",
                status: "",
                avatar: "",
                banner: "",
                avatarDecoration: "",
                statusMusic: {
                        name: "No music",
                        author: "No author",
                        cover: "No cover"
                },
                statusPerso: {
                        name: "",
                        emoji: "",
                }
                
        }
        const infoPre = {
                globalName: "",
                username: "",
                avatar: "",
                banner: "",
                avatarDecoration: "",
        }
        let myUser;
        let member;
        try{
        myUser = await client.users.fetch(id, { force: true });
        const avatarURL = myUser.displayAvatarURL({ dynamic: true });
        const bannerURL = myUser.bannerURL({ dynamic: true, size: 2048 });
        const avatarDecoration = myUser.avatarDecorationURL({ dynamic: true });
        console.log(myUser.avatarDecorationURL({ dynamic: true }));
        infoPre.avatar = avatarURL;
        infoPre.banner = bannerURL;
        infoPre.avatarDecoration = avatarDecoration;
        infoPre.username = myUser.username;
        infoPre.globalName = myUser.globalName;
        member;
        for (const guild of client.guilds.cache.values()) {
            try {
                member = await guild.members.fetch(id);
                
                if (member) break;
            } catch (e) {
                // If the member is not found in this guild, continue to the next one
                continue;
            }
        }
                }catch(e){
                        console.log("Error retrieving user information");
                        return infoPre;
                }

        try{
        let i = 0;
        const status = await Promise.all(member.presence.activities.map(async activity => {
                
                switch (activity.type) {
                        case 0:
                                // Fallback image handling
                                if (activity.assets) {
                                        i++;
                                info[`statusGame${i}`] = {
                                        name: "",
                                        largeImage: "",
                                        smallImage: "",
                                };
                                        info[`statusGame${i}`].name = activity.name;
                                        if (activity.assets.largeImage) {
                                                info[`statusGame${i}`].largeImage = activity.assets.largeImage.startsWith('mp:external')
                                                        ? `https://${activity.assets.largeImage.split('/https/')[1]}`
                                                        : `https://cdn.discordapp.com/app-assets/${activity.applicationId}/${activity.assets.largeImage}.png`;
                                        }else{
                                                info[`statusGame${i}`].largeImage = "No cover";
                                        }
                                        if (activity.assets.smallImage) {

                                                info[`statusGame${i}`].smallImage = activity.assets.smallImage.startsWith('mp:external')
                                                        ? `https://${activity.assets.smallImage.split('/https/')[1]}`
                                                        : `https://cdn.discordapp.com/app-assets/${activity.applicationId}/${activity.assets.smallImage}.png`;
                                        }else{
                                                info[`statusGame${i}`].smallImage = "No cover";
                                        }
                                        if(activity.createdTimestamp){
                                                const unixTimestampMilliseconds = Date.now();
                                                let result = unixTimestampMilliseconds - 1724783155174;
                                                result = result / 1000;
                                                info[`statusGame${i}`].TimeInSecond = result;
                                                result = result / 60;
                                                info[`statusGame${i}`].TimeInMinute = result; 
                                                info[`statusGame${i}`].createdTimestamp = activity.createdTimestamp;
                                        }else{
                                                info[`statusGame${i}`].createdTimestamp = "No date";
                                        }
                                } else if (activity.applicationId) {
                                        info.statusGameCheck = {
                                                name: "No game",
                                                cover: "No cover"
                                        }
                                        // Get the application's icon
                                        info.statusGameCheck.name = activity.name;
                                        info.statusGameCheck.cover = await getGameCover(activity.name);

                                }
                                break;
                        case 2:
                                info.statusMusic.name = activity.name;
                                info.statusMusic.music = activity.details;
                                info.statusMusic.author = activity.state;
                                info.statusMusic.cover = `https://i.scdn.co/image/${activity.assets.largeImage.split(':')[1]}`;
                                break;
                        case 4:
                                info.statusPerso.name = activity.state == null ? "" : activity.state;
                                if (activity.emoji != null) {
                                        if (activity.emoji.animated) {
                                                info.statusPerso.emoji = `https://cdn.discordapp.com/emojis/${activity.emoji.id}.gif`;
                                        } else {
                                                info.statusPerso.emoji = `https://cdn.discordapp.com/emojis/${activity.emoji.id}.png`;
                                        }
                                }
                                break;
                        default:
                                return "Unknown";
                }
        }));
        const avatarURL = myUser.displayAvatarURL({ dynamic: true });
        const bannerURL = myUser.bannerURL({ dynamic: true, size: 2048 });
        info.avatar = avatarURL;
        info.banner = bannerURL;
        info.avatarDecoration = myUser.avatarDecorationURL({ dynamic: true });
        
        info.username = myUser.username;
        info.globalName = myUser.globalName;
        try {
                info.status = member.presence.status;
        } catch (e) {
                info.status = "offline";
        }
        return info;}catch(e){
                console.log("Error retrieving user information");
                return infoPre;
        }
}

const port = 1412; // Your server port
const app = express();

app.get('/discord/info/:id', async (req, res) => {
        const id = req.params.id;
        // Your code to process the ID and perform desired operations
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        const info = await myStatus(id);
        res.json(info);
});

app.listen(port, () => {
        console.log(`Server web listen : http://localhost:${port}/discord/info/:id`);
});


client.login(tokenDiscord);
