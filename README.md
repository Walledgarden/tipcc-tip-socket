# tip.cc tip socket
> With this Node.JS App, you can easily broadcast tip.cc tips made in a Discord Server over a WebSocket by reading the tip.cc log channel messages.

## Features
- [x] Subscribe only to certain Guilds by ID on Connection
- [x] Broadcast Guild ID, Sender ID, Recipient(s) ID(s), Amount, Currency, USD Value, Currency Emote and Timestamp
- [ ] Subscribe only to certain Channels by ID on Connection

## How to install?
1. Clone this repository
2. Install the dependencies with `yarn`
3. Copy the `.env.example` file into `.env` and fill it with your values<br>=> Obtain a bot token [here](https://discord.com/developers/applications).
4. Add the bot to the servers which should be monitored
5. Start the server with `yarn run serve`

## Contribution
This project is open source and contributions are welcome. If you want to contribute, please open a pull request.

## Creator
This project was created and is maintained by [Walledgarden](https://walledgarden.cc/).