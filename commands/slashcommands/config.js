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
    .setName(`config`)
    .setDescription(`Configure um ticket`)
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

    const functions = ticketsBotao.get(`${id}.functions`);

    let formattedFunctions = ``;

    for (const func in functions[0]) {
      formattedFunctions += `${func}: \`\`${functions[0][func]}\`\`\n`;
    }

    interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle(`${client.user.username} | Gerenciar Ticket`)
          .setFooter({
            text: `${client.user.username} - Todos os direitos reservados.`,
            iconURL: client.user.avatarURL(),
          })
          .setDescription(
            `**📰 Descrição:**\n\n${
              ticketsBotao.get(`${id}.configs.descricao`) ||
              `:arrow_forward: Clique abaixo para abrir um TICKET na categoria \`\`Não configurado ainda...\`\``
            }\n\n🔍 | Id: ${id}\n🏷 | Title: ${
              ticketsBotao.get(`${id}.configs.titulo`) ||
              `${client.user.username} | ${interaction.guild.name} | Sistema de Ticket`
            }\n\n⚙ Funções:\n${formattedFunctions}`
          ),
      ],
      ephemeral: true,
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`titulo-${id}`)
            .setEmoji(`<:Lost100:1098257166793715782>`)
            .setLabel(`Titulo`)
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`descricao-${id}`)
            .setEmoji(`<:TermosLost7:1098144396551147561>`)
            .setLabel(`Descrição`)
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`functions-${id}`)
            .setEmoji(`<a:config:1104887819454906469>`)
            .setLabel(`Funções`)
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`banner-${id}`)
            .setEmoji(`<:lb9:1113897601620770836>`)
            .setLabel(`Banner`)
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`miniatura-${id}`)
            .setEmoji(`<:lb9:1113897601620770836>`)
            .setLabel(`Miniatura`)
            .setStyle(ButtonStyle.Success)
        ),
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`configAv-${id}`)
            .setEmoji(`<:config7:1107098507413827644>`)
            .setLabel(`Configurações Avançadas`)
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`atualizar-${id}`)
            .setEmoji(`<a:loading:1107106161657905242>`)
            .setLabel(`Atualizar Mensagem`)
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`delete-${id}`)
            .setEmoji(`<:LixoLost7:1106015127184085052>`)
            .setLabel(`DELETAR`)
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId(`info-${id}`)
            .setEmoji(`<:info:1107104152959602719>`)
            .setStyle(ButtonStyle.Primary)
        ),
      ],
    });
  },
};
