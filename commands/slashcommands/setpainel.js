const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require(`discord.js`);
const wio = require(`wio.db`);

const ticketsBotao = new wio.JsonDatabase({
  databasePath: `database/ticketsPainel.json`,
});

module.exports = {
  data: new SlashCommandBuilder()
    .setName(`set_painel`)
    .setDescription(`Envie o painel ticket no canal.`)
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
      option
        .setName(`id`)
        .setDescription(`ID do seu ticket.`)
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
        name: `ID - ${choice} | PAINEL |Nome - ${id}`,
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

    const embed = new EmbedBuilder()
    .setFooter({ text: ticketsBotao.get(`${id}.configs.footer`) || null})
      .setTitle(
        ` ${
          ticketsBotao.get(`${id}.configs.titulo`) || `Não configurado ainda...`
        }`
      )
      .setDescription(
        `${
          ticketsBotao.get(`${id}.configs.descricao`) ||
          `Não configurado ainda...`
        }`
      );

    if (ticketsBotao.get(`${id}.configs.banner`)) {
      embed.setImage(ticketsBotao.get(`${id}.configs.banner`));
    }

    if (ticketsBotao.get(`${id}.configs.miniatura`)) {
      embed.setThumbnail(ticketsBotao.get(`${id}.configs.miniatura`));
    }
    const menu = new StringSelectMenuBuilder().setCustomId(
      `abrirTicketMenu-${id}`
    ).setPlaceholder(ticketsBotao.get(`${id}.configs.placeholder`));

    const categorias = ticketsBotao.get(`${id}.categorias`);

    if (categorias) {
      const listaCategorias = Object.values(categorias);

      listaCategorias.forEach((categoria) => {
        menu.addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel(`${categoria.nome.toUpperCase()}`)
            .setDescription(`${categoria.descricao}`)
            .setEmoji(`${categoria.emoji}`)
            .setValue(`${categoria.value}`)
        );
      });
    } else {
      menu.addOptions(
        new StringSelectMenuOptionBuilder()
          .setDescription("Nenhuma categoria disponivel")
          .setValue(".")
          .setEmoji("❌")
      );
    }

    const row = new ActionRowBuilder().addComponents(menu);

    interaction.reply({
      content: `**✅ | Painel enviado com sucesso.**`,
      ephemeral: true,
    });

    await interaction.channel
      .send({
        embeds: [embed],
        components: [row],
      })
      .then((msg) => {
        ticketsBotao.set(`${id}.msgId`, msg.id);
        ticketsBotao.set(`${id}.channelId`, interaction.channel.id);
      });
  },
};
