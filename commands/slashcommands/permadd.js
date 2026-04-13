const { SlashCommandBuilder, PermissionFlagsBits } = require(`discord.js`);
const wio = require(`wio.db`);

const botConfig = new wio.JsonDatabase({
  databasePath: `database/botConfig.json`,
});

module.exports = {
  data: new SlashCommandBuilder()
    .setName(`permadd`)
    .setDescription(`Adicione uma pessoa para gerenciar o sistema.`)
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption((option) =>
      option.setName(`user`).setDescription(`Usuário`).setRequired(true)
    ),

  async execute(interaction, client) {
    const member = interaction.options.getMember(`user`);

    if (botConfig.get("dono") !== interaction.user.id) {
      return interaction.reply({
        content: "**❌ | Apenas o dono do bot pode executar isso.**",
        ephemeral: true,
      });
    }

    const usersPerms = botConfig.get("usersPerms") || [];

    if (!usersPerms.includes(member.id)) {
      usersPerms.push(member.id);
      botConfig.set("usersPerms", usersPerms);
    }

    interaction.reply({
      content: `**✅ | Usuário ${member} agora possui a permissão de gerenciar o bot.**`,
      ephemeral: true,
    });
  },
};
