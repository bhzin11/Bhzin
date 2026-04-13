const fs = require("fs");
const colour = require("colour");
const {
  Client,
  Intents,
  Collection,
  GatewayIntentBits,
} = require("discord.js");
const config = require("./config.json");
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

client.commands = new Collection();

const functions = fs
  .readdirSync("./functions")
  .filter((file) => file.endsWith(".js"));
const eventsFiles = fs
  .readdirSync("./events")
  .filter((file) => file.endsWith(".js"));
const commandFolders = fs.readdirSync("./commands");

(async () => {
  for (file of functions) {
    require(`./functions/${file}`)(client);
  }

  client.handleEvents(eventsFiles, "./events");
  client.handleCommands(commandFolders, "./commands");
  client.login(process.env.TOKEN || config.token);
})();

client.on("messageCreate", (message) => {
  if (message.mentions.has(client.user)) {
    message.reply({
      content: `**_Olá ${message.author.username}, para começar a me configurar, utilize \`\`/setdono (SEU USUÁRIO)\`\`_**`,
    });
  }
});

process.on("uncaughtException", (error, origin) => {
  console.log(`🚫 Erro Detectado:\n\n` + error, origin);
});
process.on("uncaughtExceptionMonitor", (error, origin) => {
  console.log(`🚫 Erro Detectado:\n\n` + error, origin);
});
