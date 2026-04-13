const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require("discord.js");

const wio = require("wio.db");

const ticket = new wio.JsonDatabase({
  databasePath: "database/ticketsPainel.json",
});

module.exports = {
  data: new SlashCommandBuilder()
    .setName("criar_painel")
    .setDescription("Crie um novo painel de ticket.")
    .addStringOption((option) =>
      option
        .setName("id")
        .setDescription("Coloque o ID do novo ticket aqui!")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    const botConfig = new wio.JsonDatabase({
      databasePath: `database/botConfig.json`,
    });

    const usersPerms = botConfig.get("usersPerms") || [];

    if (!usersPerms.includes(interaction.user.id)) {
      return interaction.reply({
        content: `**❌ | Você não tem permissão.**`,
        ephemeral: true,
      });
    }

    const id = interaction.options.getString("id");

    interaction.reply({
      content: `✅ | Ticket criado com sucesso, use /config_painel \`\`${id}\`\` Para configura-lo`,
      ephemeral: true,
    });

    ticket.set(`${id}.configs`, {});
    ticket.set(`${id}.categorias`, {});

    const novaCategoria = {
      nome: "TICKET",
      descricao: "Opção padrao após criar o painel.",
      emoji: "🎫",
      value: "ticket",
    };

    ticket.push(`${id}.categorias`, novaCategoria);

    await interaction.channel
      .send({
        embeds: [
          new EmbedBuilder()
            .setTitle(`Não configurado ainda...`)
            .setDescription(`Não configurado ainda...`),
        ],
        components: [
          new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId(`abrirTicketMenu-${id}`)
              .setPlaceholder("Selecione um Ticket")
              .addOptions(
                new StringSelectMenuOptionBuilder()
                  .setLabel("TICKET")
                  .setEmoji("🎫")
                  .setDescription("Opção padrao após criar o painel.")
                  .setValue("ticket")
              )
          ),
        ],
      })
      .then((msg) => {
        ticket.set(`${id}.msgId`, msg.id);
        ticket.set(`${id}.channelId`, interaction.channel.id);
      });
  },
};
