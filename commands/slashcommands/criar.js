const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

const wio = require("wio.db");

const ticket = new wio.JsonDatabase({
  databasePath: "database/ticketsBotao.json",
});

module.exports = {
  data: new SlashCommandBuilder()
    .setName("criar")
    .setDescription("Crie um novo ticket.")
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

    ticket.set(
      `${id}.nome`,
      `${client.user.username} | ${interaction.guild.name} | Sistema de Ticket`
    );
    ticket.set(`${id}.configs`, {});
    ticket.set(`${id}.permissoes`, {});
    ticket.set(`${id}.buttonConfig`, {
      label: "Abrir Ticket",
      emoji: "👋",
      color: "Azul",
    });
    ticket.set(`${id}.configsAv`, [
      {
        SistemaModal: "Desligado",
        SistemaProtocolo: "Desligado",
        CategoriaSelecionada: "Desligado",
      },
    ]);
    ticket.set(`${id}.functions`, [
      {
        CriarCall: "Ligado",
        Poke: "Ligado",
        Assumir: "Ligado",
        Renomear: "Ligado",
        Pagamentos: "Ligado",
        GerenciarMembro: "Ligado",
      },
    ]);
    ticket.set(`${id}.guildId`, interaction.guild.id);

    interaction.reply({
      content: `✅ | Ticket criado com sucesso, use /config \`\`${id}\`\` Para configura-lo`,
      ephemeral: true,
    });

    await interaction.channel
      .send({
        embeds: [
          new EmbedBuilder()
            .setTitle(
              `${client.user.username} | ${interaction.guild.name} | Sistema de Ticket`
            )
            .setDescription(
              `:arrow_forward: Clique abaixo para abrir um TICKET na categoria \`\`Não configurado ainda...\`\``
            ),
        ],
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`abrirTicket-${id}`)
              .setLabel("Abrir Ticket")
              .setEmoji("👋")
              .setStyle(ButtonStyle.Primary)
          ),
        ],
      })
      .then((msg) => {
        ticket.set(`${id}.msgId`, msg.id);
        ticket.set(`${id}.channelId`, interaction.channel.id);
      });
  },
};
