const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ChannelSelectMenuBuilder,
  ChannelType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require(`discord.js`);

const wio = require("wio.db");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(`botconfig`)
    .setDescription(`⚒ [Gerencie seu bot].`)
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

    const embed = new EmbedBuilder()
      .setTitle(`${client.user.username} | Gerenciar Ticket`)
      .setDescription("**_Selecione abaixo a opção que deseja configurar_**");

    const buttons = [
      new ButtonBuilder()
        .setCustomId("configLogs")
        .setEmoji("📰")
        .setLabel("Configurar LOGS")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("configAvaliacao")
        .setEmoji("⭐")
        .setLabel("Configurar AVALIAÇÃO")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("configMp")
        .setEmoji("💰")
        .setLabel("Configurar TOKEN MP")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("configCategorias")
        .setEmoji("📒")
        .setLabel("Configurar CATEGORIAS")
        .setStyle(ButtonStyle.Secondary),
    ];

    interaction.reply({
      embeds: [embed],
      components: [new ActionRowBuilder().addComponents(buttons)],
      ephemeral: true,
    });
  },
};
