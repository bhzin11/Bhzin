const { SlashCommandBuilder, PermissionFlagsBits } = require(`discord.js`);
const wio = require(`wio.db`);

const botConfig = new wio.JsonDatabase({
  databasePath: `database/botConfig.json`,
});

module.exports = {
  data: new SlashCommandBuilder()
    .setName(`setdono`)
    .setDescription(`⚒ [Developer Only].`)
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption((option) =>
      option.setName(`user`).setDescription(`Usuário`).setRequired(true)
    ),

  async execute(interaction, client) {
    const member = interaction.options.getMember(`user`);

    if (botConfig.get(`dono`)) {
      return interaction.reply({
        content:
          "**❌ | Já existe um dono setado na database, use _/permadd_**",
        ephemeral: true,
      });
    }

    const user = member.id;

    botConfig.set(`dono`, user);

    const usersPerms = botConfig.get("usersPerms") || [];

    if (!usersPerms.includes(member.id)) {
      usersPerms.push(member.id);
      botConfig.set("usersPerms", usersPerms);
    }

    interaction.reply({
      content: `**✅ | Usuário ${member} foi setado como dono do bot.**`,
      ephemeral: true,
    });
  },
};
