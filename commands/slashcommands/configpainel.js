const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require(`discord.js`);
const wio = require(`wio.db`);

const ticketsBotao = new wio.JsonDatabase({
  databasePath: `database/ticketsPainel.json`,
});

module.exports = {
  data: new SlashCommandBuilder()
    .setName(`config_painel`)
    .setDescription(`Configure um painel ticket`)
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
      option
        .setName(`id`)
        .setDescription(`Configure um ticket.`)
        .setRequired(true)
        .setAutocomplete(true)
    ),

  async autocomplete(interaction) {
    const focusedOption = interaction.options.getFocused(true);
    let choices;

    if (focusedOption.name === `id`) {
      const choicesMain = [];

      const all = ticketsBotao.all();

      if (all.length < 1) {
        choicesMain.push(`Nenhum painel ticket criado!`);
      } else {
        all.map((p) => {
          choicesMain.push(p.ID);
        });
      }

      choices = choicesMain;
    }

    const filtered = choices.filter((choice) =>
      choice.startsWith(focusedOption.value)
    );
    await interaction.respond(
      filtered.map((choice) => ({
        name: `ID - ${choice} | PAINEL `,
        value: choice,
      }))
    );
  },

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

    const id = interaction.options.getString(`id`);

    interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle(`${client.user.username} | Gerenciar Ticket`)
          .setFooter({
            text: `${client.user.username} - Todos os direitos reservados.`,
            iconURL: client.user.avatarURL(),
          })
          .setDescription(`Escolha oque deseja gerenciar.`),
      ],
      ephemeral: true,
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`embed-${id}`)
            .setEmoji(`<:Lost100:1098257166793715782>`)
            .setLabel(`Configurar Embed`)
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`tickets-${id}`)
            .setEmoji(`<:TermosLost7:1098144396551147561>`)
            .setLabel(`Configurar Tickes`)
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`atualizarP-${id}`)
            .setEmoji(`<a:loading:1107106161657905242>`)
            .setLabel(`Atualizar Painel`)
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(`deleteP-${id}`)
            .setEmoji(`<:LixoLost7:1106015127184085052>`)
            .setLabel(`Deletar Painel`)
            .setStyle(ButtonStyle.Danger)
        ),
      ],
    });
  },
};
