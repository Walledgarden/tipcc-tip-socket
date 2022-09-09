import { WebSocket, WebSocketServer } from 'ws';
import {
  Client,
  Collection,
  IntentsBitField,
  Message,
  type OAuth2Guild,
} from 'discord.js';
import * as dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});
let guilds: OAuth2Guild[] = [];

const websocketServer = new WebSocketServer({
  port: parseFloat(process.env.PORT ?? '8080'),
});

const connections: Collection<WebSocket, string[]> = new Collection<
WebSocket,
string[]
>();

websocketServer.on('connection', async (ws: WebSocket, request) => {
  const params = new URLSearchParams(request.url?.split('?', 2)[1] ?? '');
  const guildIds = (params.get('guildIds')?.split(',') ?? []).filter((r) =>
    /^\d{15,}$/.test(r),
  );

  if (guildIds.length === 0) {
    await ws.send(
      JSON.stringify({
        type: 'error',
        message:
          'Please provide at least one Guild ID in the guildIds query parameter.',
      }),
    );
    return ws.close();
  }

  const validGuilds: string[] = guildIds.filter((r) =>
    guilds.some((f) => f.id === r),
  );
  const invalidGuilds: string[] = guildIds.filter(
    (r) => !validGuilds.includes(r),
  );

  connections.set(ws, validGuilds);

  ws.send(
    JSON.stringify({
      type: 'connected',
      guildIds: validGuilds,
      invalidGuildIds: invalidGuilds,
      version: 1,
    }),
  );
});

websocketServer.on('close', (ws: WebSocket) => connections.delete(ws));

websocketServer.on('listening', () =>
  console.log(
    `[WEBSOCKET SERVER] Ready and listening on Port ${parseFloat(
      process.env.PORT ?? '8080',
    )}`,
  ),
);

client.on('ready', async () => {
  console.log(`[DISCORD CLIENT] Ready and logged in as ${client.user?.tag}`);
  guilds = (await client.guilds.fetch()).map((r) => r);
});
client.on('guildCreate', async () => {
  guilds = (await client.guilds.fetch()).map((r) => r);
});

client.on('messageCreate', async (message: Message) => {
  if (
    message.author.id !== '617037497574359050' ||
    message.embeds[0]?.fields.length !== 4 ||
    message.embeds[0]?.title !== '📝 New tip'
  )
    return;

  const fromField = message.embeds[0]?.fields.find((r) => r.name === 'From');
  const channelField = message.embeds[0]?.fields.find(
    (r) => r.name === 'Channel',
  );
  const amountField = message.embeds[0]?.fields.find(
    (r) => r.name === 'Amount',
  );
  const recipientsField = message.embeds[0]?.fields.find(
    (r) => r.name === 'Recipient(s)',
  );

  if (!fromField || !channelField || !amountField || !recipientsField) return;

  const from: string = (fromField.value.match(/<@!?(\d+)>/) ?? [])[1];
  const channelId: string = (channelField.value.match(/<#(\d+)>/) ?? [])[1];
  let [, emote, amount, currency, usdValue]: string[] =
    amountField.value
      .replace(/\*/g, '')
      .match(/^(<.+>|:.+:)\s([\d.,]+)\s(.+)\s\(≈\s\$([\d.,]+)\)/) ?? [];
  amount = amount.replace(/,/g, '');
  usdValue = usdValue.replace(/,/g, '');
  const recipientIds: string[] =
    recipientsField.value
      .match(/<@!?(\d+)>/g)
      ?.map((r) => r.replace(/\D/g, '')) ?? [];
  const isRain: boolean = recipientIds.length > 1;

  connections
    .filter((r) => r.includes(message.guild?.id ?? ''))
    .forEach((guildIds, ws) => {
      ws.send(
        JSON.stringify({
          type: 'tip',
          guildId: message.guild?.id,
          senderId: from,
          channelId,
          currencyEmote: emote,
          value: amount,
          currency,
          usdValue,
          recipientIds,
          valueIsEach: isRain,
          timestamp: message.createdTimestamp,
        }),
      );
    });
});

client.login(process.env.TOKEN).catch(console.error);
