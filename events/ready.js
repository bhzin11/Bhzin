const { WebhookClient, EmbedBuilder } = require("discord.js");

module.exports = {
  name: "ready",
  once: true,
  async execute(client) {
    console.log(`Successfully logged in to ${client.user.tag}`.green);

    client.user.setPresence({
      activities: [{ name: `Hot Applications` }],
      status: "dnd",
    });

    function clearConsole() {
      console.clear();
    }

    setInterval(clearConsole, 10000);
  },
};
