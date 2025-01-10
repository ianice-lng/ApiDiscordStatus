const { Client, GatewayIntentBits, Events } = require('discord.js');
const { tokenDiscord, tokenTwitch } = require('./config.json');
const axios = require('axios');
const express = require('express');

// Déclare les intentions nécessaires
const client = new Client({
        intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildPresences,
        ],
});


client.on(Events.PresenceUpdate, async (oldPresence, newPresence) => {
        console.log(newPresence)


})

// Fonction pour obtenir la couverture d'un jeu depuis Twitch
async function getGameCover(gameName) {
        try {
                const response = await axios.get('https://api.twitch.tv/helix/games', {
                        params: { query: gameName },
                        headers: {
                                'Client-ID': 'gp762nuuoqcoxypju8c569th9wz7q5', // Remplace avec ton Client ID
                                'Authorization': `Bearer ${tokenTwitch}`,
                        },
                });

                const games = response.data.data;
                if (games.length > 0) {
                        const game = games[0];
                        return game.box_art_url.replace('{width}', '600').replace('{height}', '800'); // Image formatée
                } else {
                        console.log(`Aucun jeu trouvé pour le nom ${gameName}.`);
                }
        } catch (error) {
                console.error('Erreur lors de la récupération de la couverture du jeu :', error.message);
        }
        return 'No cover';
}

// Fonction pour obtenir les informations utilisateur
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
                        cover: "No cover",
                },
                statusPerso: {
                        name: "",
                        emoji: "",
                },
                statusGames: [],
        };

        try {
                // Récupération de l'utilisateur
                const myUser = await client.users.fetch(id, { force: true });
                const member = client.guilds.cache
                    .map(guild => guild.members.cache.get(id))
                    .find(member => member?.presence);

                if (!member) {
                        console.log("Membre introuvable ou hors ligne.");
                        return info;
                }

                // Ajoute les informations de base
                info.globalName = myUser.globalName;
                info.username = myUser.username;
                info.avatar = myUser.displayAvatarURL({ dynamic: true });
                info.banner = myUser.bannerURL({ dynamic: true, size: 2048 });
                info.avatarDecoration = myUser.avatarDecorationURL({ dynamic: true });
                info.status = member.presence?.status || 'offline';

                console.log(member.presence.activities);

                member.presence.activities.forEach(activity => {
                        switch (activity.type) {
                                case 0: // Jeu
                                        info.statusGames.push({
                                                name: activity.name,
                                                details: activity.details || "No details",
                                                state: activity.state || "No state",
                                                assets: {
                                                        largeImage: activity.assets?.largeImage
                                                            ? activity.assets.largeImage.startsWith('mp:external')
                                                                ? `https://${activity.assets.largeImage.split('/https/')[1]}`
                                                                : `https://cdn.discordapp.com/app-assets/${activity.applicationId}/${activity.assets.largeImage}.png`
                                                            : 'No cover',
                                                        smallImage: activity.assets?.smallImage
                                                            ? activity.assets.smallImage.startsWith('mp:external')
                                                                ? `https://${activity.assets.smallImage.split('/https/')[1]}`
                                                                : `https://cdn.discordapp.com/app-assets/${activity.applicationId}/${activity.assets.smallImage}.png`
                                                            : 'No cover',
                                                        largeTextImage: activity.assets?.largeText || "No large text",
                                                        smallTextImage: activity.assets?.smallText || "No small text",
                                                },
                                                timeStamp: activity.createdTimestamp,
                                        });
                                        break;

                                case 2: // Spotify
                                        info.statusMusic = {
                                                name: activity.details || "No music",
                                                author: activity.state || "No author",
                                                cover: activity.assets?.largeImage
                                                    ? `https://i.scdn.co/image/${activity.assets.largeImage.split(':')[1]}`
                                                    : 'No cover',
                                        };
                                        break;

                                case 4: // Statut personnalisé
                                        info.statusPerso = {
                                                name: activity.state || "",
                                                emoji: activity.emoji
                                                    ? activity.emoji.animated
                                                        ? `https://cdn.discordapp.com/emojis/${activity.emoji.id}.gif`
                                                        : `https://cdn.discordapp.com/emojis/${activity.emoji.id}.png`
                                                    : "",
                                        };
                                        break;

                                default:
                                        console.log("Activité inconnue : ", activity.type);
                                        break;
                        }
                });
        } catch (error) {
                console.error("Erreur lors de la récupération des informations :", error.message);
        }

        return info;
}

// Configuration du serveur web
const port = 1412;
const app = express();

app.get('/discord/info/:id', async (req, res) => {
        const id = req.params.id;
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        const info = await myStatus(id);
        res.json(info);
});

// Lancement du serveur web
app.listen(port, () => {
        console.log(`Serveur web en écoute : http://localhost:${port}/discord/info/:id`);
});

// Connexion au bot Discord
client.login(tokenDiscord);
