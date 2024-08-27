This project is an API for managing Discord user status.

## Installation

1. Clone this repository to your local machine or use the following link: https://api.zaphir.me/discord/info/:discord_id
2. Make sure you have Node.js installed.
3. Run `npm install` to install the dependencies.

## Configuration

1. Modify the config.json file with the given instructions.

## Usage

1. Run `npm start` to start the server.
2. Access `http://localhost:1412/discord/info/your_discord_id` to access the API.

## Contributing

Contributions are welcome! Feel free to open a pull request.

## API Information
The API returns the globalName, username, avatar, and banner. If you are on [Discord](https://discord.gg/uMCcfcwkPA), it will also provide your online, idle, dnd, offline status, as well as the music you are listening to if you have connected your Spotify to your Discord, and the games you are playing.
