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
  databasePath: `database/ticketsBotao.json`,
});

module.exports = {
  data: new SlashCommandBuilder()
    .setName(`set`)
    .setDescription(`Envie o ticket no canal.`)
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
        choicesMain.push(`Nenhum ticket criado!`);
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
        name: `ID - ${choice} | Nome - ${ticketsBotao.get(`${choice}.nome`)}`,
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
        `${
          ticketsBotao.get(`${id}.configs.titulo`) ||
          `${client.user.username} | ${interaction.guild.name} | Sistema de Ticket`
        }`
      )
      .setDescription(
        `${
          ticketsBotao.get(`${id}.configs.descricao`) ||
          `:arrow_forward: Clique abaixo para abrir um TICKET na categoria \`\`Não configurado ainda...\`\``
        }`
      );

    if (ticketsBotao.get(`${id}.configs.banner`)) {
      embed.setImage(ticketsBotao.get(`${id}.configs.banner`));
    }

    if (ticketsBotao.get(`${id}.configs.miniatura`)) {
      embed.setThumbnail(ticketsBotao.get(`${id}.configs.miniatura`));
    }

    let buttonStyle;

    const color = ticketsBotao.get(`${id}.buttonConfig.color`);

    if (color === "Azul") {
      buttonStyle = ButtonStyle.Primary;
    } else if (color === "Vermelho") {
      buttonStyle = ButtonStyle.Danger;
    } else if (color === "Verde") {
      buttonStyle = ButtonStyle.Success;
    } else if (color === "Cinza") {
      buttonStyle = ButtonStyle.Secondary;
    }

    interaction.reply({
      content: `**✅ | Painel enviado com sucesso.**`,
      ephemeral: true,
    });

    if (buttonStyle) {
      interaction.channel
        .send({
          embeds: [embed],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`abrirTicket-${id}`)
                .setLabel(
                  `${
                    ticketsBotao.get(`${id}.buttonConfig.label`) ||
                    "Abrir Ticket"
                  }`
                )
                .setEmoji(
                  `${ticketsBotao.get(`${id}.buttonConfig.emoji`) || "👋"}`
                )
                .setStyle(buttonStyle)
            ),
          ],
        })
        .then((msg) => {
          ticketsBotao.set(`${id}.msgId`, msg.id);
          ticketsBotao.set(`${id}.channelId`, interaction.channel.id);
        });
    } else {
      console.error("Estilo de botão inválido:", color);
    }
  },
};
