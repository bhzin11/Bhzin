const {
  ComponentType,
  AttachmentBuilder,
  EmbedBuilder,
  ChannelType,
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  UserSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  MessageCollector,
  RoleSelectMenuBuilder,
  ChannelSelectMenuBuilder,
} = require("discord.js");
const wio = require("wio.db");

const ticketsB = new wio.JsonDatabase({
  databasePath: "database/ticketsBotao.json",
});

const cat = new wio.JsonDatabase({
  databasePath: "database/cat.json",
});

const ticketsP = new wio.JsonDatabase({
  databasePath: "database/ticketsPainel.json",
});

const createdTickesdb = new wio.JsonDatabase({
  databasePath: "database/tickets.json",
});

const axios = require("axios");

function generateUUID() {
  let uuid = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < 8; i++) {
    uuid += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return uuid;
}

const uuid = generateUUID();

const mercadopago = require("mercadopago");

const vendas = new wio.JsonDatabase({ databasePath: "database/vendas.json" });

const botconfig1 = new wio.JsonDatabase({
  databasePath: "database/botConfig.json",
});

mercadopago.configure({
  access_token: botconfig1.get("token"),
});

const categoriaSelecionada = new wio.JsonDatabase({
  databasePath: "database/categoriasSel.json",
});

module.exports = {
  name: "interactionCreate",
  async execute(interaction, client) {
    if (interaction.isCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction, interaction.client);
      } catch (error) {
        console.log(`${error}`);
        const err = new EmbedBuilder()
          .setDescription(
            `**🔔 | Atenção, ${interaction.user.username} Detectamos um __ERRO__ ao executar o comando:**\n\n\`\`\`${error}\`\`\``
          )
          .setColor("NotQuiteBlack");
        await interaction.reply({
          embeds: [err],
          ephemeral: true,
        });
      }
    }
    if (interaction.isAutocomplete()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) {
        return;
      }
      try {
        await command.autocomplete(interaction);
      } catch (err) {
        return;
      }
    }

    if (interaction.customId === `addCatM`) {
      const nome = interaction.fields.getTextInputValue("nome");
      const emoji = interaction.fields.getTextInputValue("emoji");
      const descricao = interaction.fields.getTextInputValue("descricao");

      const novaCategoria = {
        nome: nome,
        descricao: descricao,
        emoji: emoji,
        value: nome.toLowerCase(),
      };

      categoriaSelecionada.push(`categorias`, novaCategoria);

      interaction.reply({
        content: "✅ | Categoria adicionada com sucesso.",
        ephemeral: true,
      });
    }

    if (interaction.customId === "addCat") {
      const catModal = new ModalBuilder()
        .setCustomId(`addCatM`)
        .setTitle("Adicionar Categoria");

      const nome = new TextInputBuilder()
        .setCustomId("nome")
        .setLabel("NOME")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const emoji = new TextInputBuilder()
        .setCustomId("emoji")
        .setLabel("EMOJI")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const desc = new TextInputBuilder()
        .setCustomId("descricao")
        .setLabel("DESCRIÇÃO")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const row1 = new ActionRowBuilder().addComponents(nome);
      const row2 = new ActionRowBuilder().addComponents(desc);
      const row3 = new ActionRowBuilder().addComponents(emoji);
      catModal.addComponents(row1, row2, row3);

      interaction.showModal(catModal);
    }

    if (interaction.customId === `removeCat`) {
      const categorias = categoriaSelecionada.get(`categorias`);

      const menu = new StringSelectMenuBuilder()
        .setPlaceholder("Selecione uma categoria")
        .setCustomId(`removeCatM`);

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
        components: [row],
        ephemeral: true,
      });
    }

    if (interaction.customId === `removeCatM`) {
      const categoriaValue = interaction.values[0];
      const categorias = categoriaSelecionada.get(`categorias`);

      const categoriaIndex = categorias.findIndex(
        (categoria) => categoria.value === categoriaValue
      );

      if (categoriaIndex !== -1) {
        categorias.splice(categoriaIndex, 1);
        categoriaSelecionada.set(`categorias`, categorias);
      }

      const menu = new StringSelectMenuBuilder()
        .setPlaceholder("Selecione uma categoria")
        .setCustomId(`removeCatM`);

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

      await interaction.update({
        components: [row],
        ephemeral: true,
      });

      await interaction.followUp({
        content: "**✅ | Categoria excluida com sucesso.**",
        ephemeral: true,
      });
    }

    if (interaction.customId === "configCategorias") {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle(`Categorias Selecionadas`)
            .setDescription(
              "Configure as categorias do menu de **SELEÇÃO DE CATEGORIAS**"
            ),
        ],
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`addCat`)
              .setEmoji("➕")
              .setLabel("Adicionar Categoria")
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId(`removeCat`)
              .setEmoji("➖")
              .setLabel("Remover Categoria")
              .setStyle(ButtonStyle.Danger)
          ),
        ],
        ephemeral: true,
      });
    }

    if (interaction.customId === "configMp") {
      const catModal = new ModalBuilder()
        .setCustomId(`configToken`)
        .setTitle("Configurar TOKEN");

      const nome = new TextInputBuilder()
        .setCustomId("token")
        .setLabel("SEU TOKEN")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const row1 = new ActionRowBuilder().addComponents(nome);
      catModal.addComponents(row1);

      interaction.showModal(catModal);
    }

    if (interaction.customId === "configAvaliacao") {
      interaction.reply({
        ephemeral: true,
        components: [
          new ActionRowBuilder().addComponents(
            new ChannelSelectMenuBuilder()
              .setChannelTypes(ChannelType.GuildText)
              .setCustomId("configAvaliacaoMenu")
          ),
        ],
      });
    }

    if (interaction.customId === "configLogs") {
      interaction.reply({
        ephemeral: true,
        components: [
          new ActionRowBuilder().addComponents(
            new ChannelSelectMenuBuilder()
              .setChannelTypes(ChannelType.GuildText)
              .setCustomId("configLogsMenu")
          ),
        ],
      });
    }

    if (interaction.customId === "configToken") {
      const token = interaction.fields.getTextInputValue("token");

      botconfig1.set("token", token);

      interaction.reply({
        embeds: [
          new EmbedBuilder().setDescription(
            "**✅ | Configurou token com sucesso!**"
          ),
        ],
        components: [],
        ephemeral: true,
      });
    }

    if (interaction.customId === "configAvaliacaoMenu") {
      const channel = interaction.values[0];

      botconfig1.set("avaliacao", channel);

      interaction.update({
        embeds: [
          new EmbedBuilder().setDescription(
            "**✅ | Configurou avalição com sucesso!**"
          ),
        ],
        components: [],
      });
    }

    if (interaction.customId === "configLogsMenu") {
      const channel = interaction.values[0];

      botconfig1.set("logs", channel);

      interaction.update({
        embeds: [
          new EmbedBuilder().setDescription(
            "**✅ | Configurou logs com sucesso!**"
          ),
        ],
        components: [],
      });
    }

    const allTicketsP = ticketsP.all();
    allTicketsP.map(async (p) => {
      if (interaction.customId === `abrirTicketMenu-${p.ID}`) {
        const tipo = interaction.values[0];

        interaction.update({});

        await interaction.guild.channels
          .create({
            name: `🎫・${tipo}丨${interaction.user.username}`,
            topic: `👤 | ID DO MEMBRO: ${interaction.user.id}`,
            parent: interaction.channel.parent,
            permissionOverwrites: [
              {
                id: interaction.guild.id,
                deny: [PermissionsBitField.Flags.ViewChannel],
              },
              {
                id: interaction.user.id,
                allow: [
                  PermissionsBitField.Flags.ViewChannel,
                  PermissionsBitField.Flags.SendMessages,
                  PermissionsBitField.Flags.AttachFiles,
                  PermissionsBitField.Flags.ReadMessageHistory,
                ],
              },
            ],
          })
          .then(async (c) => {
            await interaction
              .followUp({
                embeds: [
                  new EmbedBuilder().setDescription(
                    `**_✅ | <@${interaction.user.id}>, seu TICKET foi aberto, use o botão abaixo para encontra-lo_**`
                  ),
                ],
                components: [
                  new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                      .setURL(
                        `https://discord.com/channels/${interaction.guild.id}/${c.id}`
                      )
                      .setEmoji("<:email:1137104275953156146>")
                      .setLabel("Ir para o Ticket")
                      .setStyle(ButtonStyle.Link)
                  ),
                ],
                ephemeral: true,
              })
              .then(() => {
                const buttons = [
                  new ButtonBuilder()
                    .setCustomId("sairTicket")
                    .setEmoji("<:lb7:1113897476651499620>")
                    .setLabel("Sair do Canal")
                    .setStyle(ButtonStyle.Primary),
                  new ButtonBuilder()
                    .setCustomId("painelStaff")
                    .setEmoji("<:lb12:1113900537063145612>")
                    .setLabel("Painel Staff")
                    .setStyle(ButtonStyle.Secondary),
                  new ButtonBuilder()
                    .setCustomId("painelMembro")
                    .setEmoji("<:InfoLost7:1106003706467590175>")
                    .setLabel("Painel Membro")
                    .setStyle(ButtonStyle.Secondary),
                  new ButtonBuilder()
                    .setCustomId("assumirTicket")
                    .setEmoji("<:verifedLost:1080325994428248174>")
                    .setLabel("Assumir Ticket")
                    .setStyle(ButtonStyle.Secondary),
                  new ButtonBuilder()
                    .setCustomId("finalizarTicket")
                    .setEmoji("<:LixoLost7:1106015127184085052>")
                    .setLabel("Finalizar Ticket")
                    .setStyle(ButtonStyle.Danger),
                ];

                const ticket = interaction.guild.channels.cache.get(c.id);

                createdTickesdb.set(
                  `${c.id}.abertoPor`,
                  interaction.user.username
                );
                createdTickesdb.set(`${c.id}.abertoPorId`, interaction.user.id);
                createdTickesdb.set(`${c.id}.assumido`, "Ningúem");
                createdTickesdb.set(`${c.id}.ticketId`, uuid);
                createdTickesdb.set(`${c.id}.channelId`, c.id);

                ticket.send({
                  components: [new ActionRowBuilder().addComponents(buttons)],
                  embeds: [
                    new EmbedBuilder().setDescription(
                      `\`\`TICKET ${interaction.user.username}\`\` aberto por: <@${interaction.user.id}>\nCaso queira sair do canal, clique em **Sair do Canal**\n\n📒 Assunto:\n\`\`\`A tratar abaixo\`\`\``
                    ),
                  ],
                  content: `<@${interaction.user.id}>`,
                });
              });
          });
      }

      if (interaction.customId === `deleteP-${p.ID}`) {
        setTimeout(() => {
          ticketsP.delete(p.ID);
        }, 3000);

        const msgId = p.data.msgId;
        const channel = interaction.guild.channels.cache.get(p.data.channelId);

        channel.messages.fetch(msgId).then(async (msg) => {
          await msg.delete();
        });

        interaction.reply({
          content: "✅ | Painel deletado com sucesso.",
          ephemeral: true,
        });
      }

      if (interaction.customId === `atualizarP-${p.ID}`) {
        interaction.deferUpdate({});

        const msgId = p.data.msgId;
        const channel = interaction.guild.channels.cache.get(p.data.channelId);

        const embed = new EmbedBuilder()
          .setFooter({ text: ticketsP.get(`${p.ID}.configs.footer`) })
          .setColor(ticketsP.get(`${p.ID}.configs.embedColor`) || 'Navy')
          .setTitle(
            ` ${
              ticketsP.get(`${p.ID}.configs.titulo`) ||
              `Não configurado ainda...`
            }`
          )
          .setDescription(
            `${
              ticketsP.get(`${p.ID}.configs.descricao`) ||
              `Não configurado ainda...`
            }`
          );

        if (ticketsP.get(`${p.ID}.configs.banner`)) {
          embed.setImage(ticketsP.get(`${p.ID}.configs.banner`));
        }

        if (ticketsP.get(`${p.ID}.configs.miniatura`)) {
          embed.setThumbnail(ticketsP.get(`${p.ID}.configs.miniatura`));
        }
        const menu = new StringSelectMenuBuilder()
          .setCustomId(`abrirTicketMenu-${p.ID}`)
          .setPlaceholder(ticketsP.get(`${p.ID}.configs.placeholder`));

        const categorias = ticketsP.get(`${p.ID}.categorias`);

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

        channel.messages.fetch(msgId).then(async (msg) => {
          await msg.edit({
            embeds: [embed],
            components: [row],
          });
        });
      }

      if (interaction.customId === `addCatModal-${p.ID}`) {
        const nome = interaction.fields.getTextInputValue("nome");
        const emoji = interaction.fields.getTextInputValue("emoji");
        const descricao = interaction.fields.getTextInputValue("descricao");

        const novaCategoria = {
          nome: nome,
          descricao: descricao,
          emoji: emoji,
          value: nome.toLowerCase(),
        };

        ticketsP.push(`${p.ID}.categorias`, novaCategoria);

        interaction.reply({
          content: "✅ | Categoria adicionada com sucesso.",
          ephemeral: true,
        });
      }

      if (interaction.customId === `addTicket-${p.ID}`) {
        const catModal = new ModalBuilder()
          .setCustomId(`addCatModal-${p.ID}`)
          .setTitle("Adicionar Categoria");

        const nome = new TextInputBuilder()
          .setCustomId("nome")
          .setLabel("NOME")
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const emoji = new TextInputBuilder()
          .setCustomId("emoji")
          .setLabel("EMOJI")
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const desc = new TextInputBuilder()
          .setCustomId("descricao")
          .setLabel("DESCRIÇÃO")
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const row1 = new ActionRowBuilder().addComponents(nome);
        const row2 = new ActionRowBuilder().addComponents(desc);
        const row3 = new ActionRowBuilder().addComponents(emoji);
        catModal.addComponents(row1, row2, row3);

        interaction.showModal(catModal);
      }

      if (interaction.customId === `removeTicket-${p.ID}`) {
        const categorias = ticketsP.get(`${p.ID}.categorias`);

        const menu = new StringSelectMenuBuilder()
          .setPlaceholder("Selecione uma categoria")
          .setCustomId(`removeCategoriaMenu-${p.ID}`);

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
          components: [row],
          ephemeral: true,
        });
      }

      if (interaction.customId === `removeCategoriaMenu-${p.ID}`) {
        const categoriaValue = interaction.values[0];
        const categorias = ticketsP.get(`${p.ID}.categorias`);

        const categoriaIndex = categorias.findIndex(
          (categoria) => categoria.value === categoriaValue
        );

        if (categoriaIndex !== -1) {
          categorias.splice(categoriaIndex, 1);
          ticketsP.set(`${p.ID}.categorias`, categorias);
        }

        const menu = new StringSelectMenuBuilder()
          .setPlaceholder("Selecione uma categoria")
          .setCustomId(`removeCategoriaMenu-${p.ID}`);

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

        await interaction.update({
          components: [row],
          ephemeral: true,
        });

        await interaction.followUp({
          content: "**✅ | Categoria excluida com sucesso.**",
          ephemeral: true,
        });
      }

      if (interaction.customId === `tickets-${p.ID}`) {
        const categorias = ticketsP.get(`${p.ID}.categorias`);
        let descricao = "";

        for (const categoria in categorias) {
          descricao += `- \`\`${categorias[
            categoria
          ].nome.toUpperCase()}\`\`\n`;
        }

        await interaction.update({
          embeds: [
            new EmbedBuilder()
              .setTitle(`Categorias do ticket de ID: \`\`${p.ID}\`\``)
              .setDescription(descricao),
          ],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`addTicket-${p.ID}`)
                .setEmoji("➕")
                .setLabel("Adicionar Categoria")
                .setStyle(ButtonStyle.Success),
              new ButtonBuilder()
                .setCustomId(`removeTicket-${p.ID}`)
                .setEmoji("➖")
                .setLabel("Remover Categoria")
                .setStyle(ButtonStyle.Danger),
              new ButtonBuilder()
                .setCustomId(`editCategoria-${p.ID}`)
                .setEmoji("⚙")
                .setLabel("Editar Categoria")
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId(`voltarProTicket-${p.ID}`)
                .setEmoji("◀")
                .setLabel("Voltar")
                .setStyle(ButtonStyle.Primary)
            ),
          ],
        });
      }

      if (interaction.customId === `voltarProTicket-${p.ID}`) {
        interaction.update({
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
                .setCustomId(`embed-${p.ID}`)
                .setEmoji(`<:Lost100:1098257166793715782>`)
                .setLabel(`Configurar Embed`)
                .setStyle(ButtonStyle.Success),
              new ButtonBuilder()
                .setCustomId(`tickets-${p.ID}`)
                .setEmoji(`<:TermosLost7:1098144396551147561>`)
                .setLabel(`Configurar Tickes`)
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId(`atualizarP-${p.ID}`)
                .setEmoji(`<a:loading:1107106161657905242>`)
                .setLabel(`Atualizar Painel`)
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`deleteP-${p.ID}`)
                .setEmoji(`<:LixoLost7:1106015127184085052>`)
                .setLabel(`Deletar Painel`)
                .setStyle(ButtonStyle.Danger)
            ),
          ],
        });
      }

      if (interaction.customId === `editCategoria-${p.ID}`) {
        const categorias = ticketsP.get(`${p.ID}.categorias`);

        const menu = new StringSelectMenuBuilder()
          .setPlaceholder("Selecione uma categoria")
          .setCustomId(`editCategoriaMenu-${p.ID}`);

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
          components: [row],
          ephemeral: true,
        });
      }

      if (interaction.customId === `editCategoriaMenu-${p.ID}`) {
        const categoriaSelecionada = interaction.values[0];
        cat.set(`categoria`, categoriaSelecionada);

        const catModal = new ModalBuilder()
          .setCustomId(`editCatModal-${p.ID}`)
          .setTitle("Editar Categoria");

        const nome = new TextInputBuilder()
          .setCustomId("nome")
          .setLabel("NOME")
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const emoji = new TextInputBuilder()
          .setCustomId("emoji")
          .setLabel("EMOJI")
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const desc = new TextInputBuilder()
          .setCustomId("descricao")
          .setLabel("DESCRIÇÃO")
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const row1 = new ActionRowBuilder().addComponents(nome);
        const row2 = new ActionRowBuilder().addComponents(desc);
        const row3 = new ActionRowBuilder().addComponents(emoji);
        catModal.addComponents(row1, row2, row3);

        interaction.showModal(catModal);
      }

      if (interaction.customId === `editCatModal-${p.ID}`) {
        const categoriaSelecionada = cat.get("categoria");

        const nome = interaction.fields.getTextInputValue("nome");
        const emoji = interaction.fields.getTextInputValue("emoji");
        const descricao = interaction.fields.getTextInputValue("descricao");

        const categorias = ticketsP.get(`${p.ID}.categorias`);

        const categoriaSelecionadaIndex = categorias.findIndex(
          (categoria) => categoria.value === categoriaSelecionada
        );

        if (categoriaSelecionadaIndex !== -1) {
          categorias[categoriaSelecionadaIndex].nome = nome;
          categorias[categoriaSelecionadaIndex].descricao = descricao;
          categorias[categoriaSelecionadaIndex].emoji = emoji;
          categorias[categoriaSelecionadaIndex].value = nome.toLowerCase();

          ticketsP.set(`${p.ID}.categorias`, categorias);

          await interaction.reply({
            content: "✅ | Categoria editada com sucesso.",
            ephemeral: true,
          });
        } else {
          await interaction.reply({
            content: "❌ | Categoria não encontrada.",
            ephemeral: true,
          });
        }

        setTimeout(() => {
          cat.deleteAll();
        }, 2000);
      }

      if (interaction.customId === `embed-${p.ID}`) {
        interaction.update({
          embeds: [
            new EmbedBuilder()
              .setTitle(
                `Titulo Atual: ${
                  ticketsP.get(`${p.ID}.configs.titulo`) ||
                  "Não configurado ainda..."
                }`
              )
              .setDescription(
                `**📰 | Descrição atual:**\n${
                  ticketsP.get(`${p.ID}.configs.descricao`) ||
                  "Não configurado ainda..."
                }\n\n📦 | Cor da Embed: ${
                  ticketsP.get(`${p.ID}.configs.embedColor`) ||
                  "Não configurado ainda..."
                }\n📒 | Texto Placeholder: ${
                  ticketsP.get(`${p.ID}.configs.placeholder`) ||
                  "Selecione um Ticket"
                }\n🖼 | Banner: ${
                  ticketsP.get(`${p.ID}.configs.banner`) || "Sem banner."
                }\n🖼 Miniatura: ${
                  ticketsP.get(`${p.ID}.configs.miniatura`) || "Sem miniatura."
                }`
              )
              .setFooter({
                iconURL: client.user.avatarURL(),
                text: `${
                  ticketsP.get(`${p.ID}.configs.footer`) || "Sem rodapé"
                }`,
              }),
          ],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`tituloEmbed-${p.ID}`)
                .setEmoji("<:config7:1107098507413827644>")
                .setLabel("Titulo da embed")
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId(`descEmbed-${p.ID}`)
                .setEmoji("<:config7:1107098507413827644>")
                .setLabel("Descrição da embed")
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId(`footerEmbed-${p.ID}`)
                .setEmoji("<:config7:1107098507413827644>")
                .setLabel("Rodapé da embed")
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId(`placeholder-${p.ID}`)
                .setEmoji("<:config7:1107098507413827644>")
                .setLabel("Placeholder")
                .setStyle(ButtonStyle.Primary)
            ),
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`corEmbed-${p.ID}`)
                .setEmoji("<:config7:1107098507413827644>")
                .setLabel("Cor Embed")
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId(`bannerEmbed-${p.ID}`)
                .setEmoji("<:lb9:1113897601620770836>")
                .setLabel("Banner")
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId(`thumbEmbed-${p.ID}`)
                .setEmoji("<:lb9:1113897601620770836>")
                .setLabel("Miniatura")
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId(`atualizarP-${p.ID}`)
                .setEmoji("<a:loading:1107106161657905242>")
                .setLabel("Atualizar Painel")
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId(`voltarProTicket-${p.ID}`)
                .setEmoji("<:lb7:1113897476651499620>")
                .setLabel("Voltar")
                .setStyle(ButtonStyle.Primary)
            ),
          ],
        });
      }

      if (interaction.customId === `tituloEmbed-${p.ID}`) {
        interaction.update({
          embeds: [
            new EmbedBuilder()
              .setTitle(`${client.user.username} | Gerenciar Ticket`)
              .setDescription(
                `**🏷 | Title:** ${
                  ticketsP.get(`${p.ID}.configs.titulo`) ||
                  `Não configurado ainda...`
                }`
              )
              .setFooter({ text: "Envie o novo titulo abaixo:" }),
          ],
          components: [],
        });

        const configs = ticketsP.get(`${p.ID}.configs`) || {};

        ticketsP.set(`${p.ID}.configs`, configs);

        const channel = client.channels.cache.get(interaction.channel.id);

        if (channel) {
          const collector = new MessageCollector(channel, { time: 15000 });

          collector.on("collect", (message) => {
            configs.titulo = message.content;
            ticketsP.set(`${p.ID}.configs`, configs);

            message.delete();
            collector.stop();
          });

          collector.on("end", async (collected) => {
            setTimeout(() => {
              interaction.editReply({
                embeds: [
                  new EmbedBuilder()
                    .setTitle(
                      `Titulo Atual: ${
                        ticketsP.get(`${p.ID}.configs.titulo`) ||
                        "Não configurado ainda..."
                      }`
                    )
                    .setDescription(
                      `**📰 | Descrição atual:**\n${
                        ticketsP.get(`${p.ID}.configs.descricao`) ||
                        "Não configurado ainda..."
                      }\n\n📦 | Cor da Embed: ${
                        ticketsP.get(`${p.ID}.configs.embedColor`) ||
                        "Não configurado ainda..."
                      }\n📒 | Texto Placeholder: ${
                        ticketsP.get(`${p.ID}.configs.placeholder`) ||
                        "Selecione um Ticket"
                      }\n🖼 | Banner: ${
                        ticketsP.get(`${p.ID}.configs.banner`) || "Sem banner."
                      }\n🖼 Miniatura: ${
                        ticketsP.get(`${p.ID}.configs.miniatura`) ||
                        "Sem miniatura."
                      }`
                    )
                    .setFooter({
                      iconURL: client.user.avatarURL(),
                      text: `${
                        ticketsP.get(`${p.ID}.configs.footer`) || "Sem rodapé"
                      }`,
                    }),
                ],
                components: [
                  new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                      .setCustomId(`tituloEmbed-${p.ID}`)
                      .setEmoji("<:config7:1107098507413827644>")
                      .setLabel("Titulo da embed")
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(`descEmbed-${p.ID}`)
                      .setEmoji("<:config7:1107098507413827644>")
                      .setLabel("Descrição da embed")
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(`footerEmbed-${p.ID}`)
                      .setEmoji("<:config7:1107098507413827644>")
                      .setLabel("Rodapé da embed")
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(`placeholder-${p.ID}`)
                      .setEmoji("<:config7:1107098507413827644>")
                      .setLabel("Placeholder")
                      .setStyle(ButtonStyle.Primary)
                  ),
                  new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                      .setCustomId(`corEmbed-${p.ID}`)
                      .setEmoji("<:config7:1107098507413827644>")
                      .setLabel("Cor Embed")
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(`bannerEmbed-${p.ID}`)
                      .setEmoji("<:lb9:1113897601620770836>")
                      .setLabel("Banner")
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(`thumbEmbed-${p.ID}`)
                      .setEmoji("<:lb9:1113897601620770836>")
                      .setLabel("Miniatura")
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(`atualizarP-${p.ID}`)
                      .setEmoji("<a:loading:1107106161657905242>")
                      .setLabel("Atualizar Painel")
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(`voltarProTicket-${p.ID}`)
                      .setEmoji("<:lb7:1113897476651499620>")
                      .setLabel("Voltar")
                      .setStyle(ButtonStyle.Primary)
                  ),
                ],
                ephemeral: true,
              });
            }, 1500);
          });
        } else {
          console.log("Canal não encontrado");
        }
      }

      if (interaction.customId === `tituloEmbed-${p.ID}`) {
        interaction.update({
          embeds: [
            new EmbedBuilder()
              .setTitle(`${client.user.username} | Gerenciar Ticket`)
              .setDescription(
                `**🏷 | Title:** ${
                  ticketsP.get(`${p.ID}.configs.titulo`) ||
                  `Não configurado ainda...`
                }`
              )
              .setFooter({ text: "Envie o novo titulo abaixo:" }),
          ],
          components: [],
        });

        const configs = ticketsP.get(`${p.ID}.configs`) || {};

        ticketsP.set(`${p.ID}.configs`, configs);

        const channel = client.channels.cache.get(interaction.channel.id);

        if (channel) {
          const collector = new MessageCollector(channel, { time: 15000 });

          collector.on("collect", (message) => {
            configs.titulo = message.content;
            ticketsP.set(`${p.ID}.configs`, configs);

            message.delete();
            collector.stop();
          });

          collector.on("end", async (collected) => {
            setTimeout(() => {
              interaction.editReply({
                embeds: [
                  new EmbedBuilder()
                    .setTitle(
                      `Titulo Atual: ${
                        ticketsP.get(`${p.ID}.configs.titulo`) ||
                        "Não configurado ainda..."
                      }`
                    )
                    .setDescription(
                      `**📰 | Descrição atual:**\n${
                        ticketsP.get(`${p.ID}.configs.descricao`) ||
                        "Não configurado ainda..."
                      }\n\n📦 | Cor da Embed: ${
                        ticketsP.get(`${p.ID}.configs.embedColor`) ||
                        "Não configurado ainda..."
                      }\n📒 | Texto Placeholder: ${
                        ticketsP.get(`${p.ID}.configs.placeholder`) ||
                        "Selecione um Ticket"
                      }\n🖼 | Banner: ${
                        ticketsP.get(`${p.ID}.configs.banner`) || "Sem banner."
                      }\n🖼 Miniatura: ${
                        ticketsP.get(`${p.ID}.configs.miniatura`) ||
                        "Sem miniatura."
                      }`
                    )
                    .setFooter({
                      iconURL: client.user.avatarURL(),
                      text: `${
                        ticketsP.get(`${p.ID}.configs.footer`) || "Sem rodapé"
                      }`,
                    }),
                ],
                components: [
                  new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                      .setCustomId(`tituloEmbed-${p.ID}`)
                      .setEmoji("<:config7:1107098507413827644>")
                      .setLabel("Titulo da embed")
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(`descEmbed-${p.ID}`)
                      .setEmoji("<:config7:1107098507413827644>")
                      .setLabel("Descrição da embed")
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(`footerEmbed-${p.ID}`)
                      .setEmoji("<:config7:1107098507413827644>")
                      .setLabel("Rodapé da embed")
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(`placeholder-${p.ID}`)
                      .setEmoji("<:config7:1107098507413827644>")
                      .setLabel("Placeholder")
                      .setStyle(ButtonStyle.Primary)
                  ),
                  new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                      .setCustomId(`corEmbed-${p.ID}`)
                      .setEmoji("<:config7:1107098507413827644>")
                      .setLabel("Cor Embed")
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(`bannerEmbed-${p.ID}`)
                      .setEmoji("<:lb9:1113897601620770836>")
                      .setLabel("Banner")
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(`thumbEmbed-${p.ID}`)
                      .setEmoji("<:lb9:1113897601620770836>")
                      .setLabel("Miniatura")
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(`atualizarP-${p.ID}`)
                      .setEmoji("<a:loading:1107106161657905242>")
                      .setLabel("Atualizar Painel")
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(`voltarProTicket-${p.ID}`)
                      .setEmoji("<:lb7:1113897476651499620>")
                      .setLabel("Voltar")
                      .setStyle(ButtonStyle.Primary)
                  ),
                ],
                ephemeral: true,
              });
            }, 1500);
          });
        } else {
          console.log("Canal não encontrado");
        }
      }

      if (interaction.customId === `descEmbed-${p.ID}`) {
        interaction.update({
          embeds: [
            new EmbedBuilder()
              .setTitle(`${client.user.username} | Gerenciar Ticket`)
              .setDescription(
                `**🏷 | Descricão:** ${
                  ticketsP.get(`${p.ID}.configs.descricao`) ||
                  `Não configurado ainda...`
                }`
              )
              .setFooter({ text: "Envie a nova descrição abaixo:" }),
          ],
          components: [],
        });

        const configs = ticketsP.get(`${p.ID}.configs`) || {};

        ticketsP.set(`${p.ID}.configs`, configs);

        const channel = client.channels.cache.get(interaction.channel.id);

        if (channel) {
          const collector = new MessageCollector(channel, { time: 15000 });

          collector.on("collect", (message) => {
            configs.descricao = message.content;
            ticketsP.set(`${p.ID}.configs`, configs);

            message.delete();
            collector.stop();
          });

          collector.on("end", async (collected) => {
            setTimeout(() => {
              interaction.editReply({
                embeds: [
                  new EmbedBuilder()
                    .setTitle(
                      `Titulo Atual: ${
                        ticketsP.get(`${p.ID}.configs.titulo`) ||
                        "Não configurado ainda..."
                      }`
                    )
                    .setDescription(
                      `**📰 | Descrição atual:**\n${
                        ticketsP.get(`${p.ID}.configs.descricao`) ||
                        "Não configurado ainda..."
                      }\n\n📦 | Cor da Embed: ${
                        ticketsP.get(`${p.ID}.configs.embedColor`) ||
                        "Não configurado ainda..."
                      }\n📒 | Texto Placeholder: ${
                        ticketsP.get(`${p.ID}.configs.placeholder`) ||
                        "Selecione um Ticket"
                      }\n🖼 | Banner: ${
                        ticketsP.get(`${p.ID}.configs.banner`) || "Sem banner."
                      }\n🖼 Miniatura: ${
                        ticketsP.get(`${p.ID}.configs.miniatura`) ||
                        "Sem miniatura."
                      }`
                    )
                    .setFooter({
                      iconURL: client.user.avatarURL(),
                      text: `${
                        ticketsP.get(`${p.ID}.configs.footer`) || "Sem rodapé"
                      }`,
                    }),
                ],
                components: [
                  new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                      .setCustomId(`tituloEmbed-${p.ID}`)
                      .setEmoji("<:config7:1107098507413827644>")
                      .setLabel("Titulo da embed")
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(`descEmbed-${p.ID}`)
                      .setEmoji("<:config7:1107098507413827644>")
                      .setLabel("Descrição da embed")
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(`footerEmbed-${p.ID}`)
                      .setEmoji("<:config7:1107098507413827644>")
                      .setLabel("Rodapé da embed")
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(`placeholder-${p.ID}`)
                      .setEmoji("<:config7:1107098507413827644>")
                      .setLabel("Placeholder")
                      .setStyle(ButtonStyle.Primary)
                  ),
                  new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                      .setCustomId(`corEmbed-${p.ID}`)
                      .setEmoji("<:config7:1107098507413827644>")
                      .setLabel("Cor Embed")
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(`bannerEmbed-${p.ID}`)
                      .setEmoji("<:lb9:1113897601620770836>")
                      .setLabel("Banner")
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(`thumbEmbed-${p.ID}`)
                      .setEmoji("<:lb9:1113897601620770836>")
                      .setLabel("Miniatura")
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(`atualizarP-${p.ID}`)
                      .setEmoji("<a:loading:1107106161657905242>")
                      .setLabel("Atualizar Painel")
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(`voltarProTicket-${p.ID}`)
                      .setEmoji("<:lb7:1113897476651499620>")
                      .setLabel("Voltar")
                      .setStyle(ButtonStyle.Primary)
                  ),
                ],
                ephemeral: true,
              });
            }, 1500);
          });
        } else {
          console.log("Canal não encontrado");
        }
      }

      if (interaction.customId === `footerEmbed-${p.ID}`) {
        interaction.update({
          embeds: [
            new EmbedBuilder()
              .setTitle(`${client.user.username} | Gerenciar Ticket`)
              .setDescription(
                `**🏷 | Rodapé:** ${
                  ticketsP.get(`${p.ID}.configs.footer`) ||
                  `Não configurado ainda...`
                }`
              )
              .setFooter({ text: "Envie o novo rodapé abaixo:" }),
          ],
          components: [],
        });

        const configs = ticketsP.get(`${p.ID}.configs`) || {};

        ticketsP.set(`${p.ID}.configs`, configs);

        const channel = client.channels.cache.get(interaction.channel.id);

        if (channel) {
          const collector = new MessageCollector(channel, { time: 15000 });

          collector.on("collect", (message) => {
            configs.footer = message.content;
            ticketsP.set(`${p.ID}.configs`, configs);

            message.delete();
            collector.stop();
          });

          collector.on("end", async (collected) => {
            setTimeout(() => {
              interaction.editReply({
                embeds: [
                  new EmbedBuilder()
                    .setTitle(
                      `Titulo Atual: ${
                        ticketsP.get(`${p.ID}.configs.titulo`) ||
                        "Não configurado ainda..."
                      }`
                    )
                    .setDescription(
                      `**📰 | Descrição atual:**\n${
                        ticketsP.get(`${p.ID}.configs.descricao`) ||
                        "Não configurado ainda..."
                      }\n\n📦 | Cor da Embed: ${
                        ticketsP.get(`${p.ID}.configs.embedColor`) ||
                        "Não configurado ainda..."
                      }\n📒 | Texto Placeholder: ${
                        ticketsP.get(`${p.ID}.configs.placeholder`) ||
                        "Selecione um Ticket"
                      }\n🖼 | Banner: ${
                        ticketsP.get(`${p.ID}.configs.banner`) || "Sem banner."
                      }\n🖼 Miniatura: ${
                        ticketsP.get(`${p.ID}.configs.miniatura`) ||
                        "Sem miniatura."
                      }`
                    )
                    .setFooter({
                      iconURL: client.user.avatarURL(),
                      text: `${
                        ticketsP.get(`${p.ID}.configs.footer`) || "Sem rodapé"
                      }`,
                    }),
                ],
                components: [
                  new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                      .setCustomId(`tituloEmbed-${p.ID}`)
                      .setEmoji("<:config7:1107098507413827644>")
                      .setLabel("Titulo da embed")
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(`descEmbed-${p.ID}`)
                      .setEmoji("<:config7:1107098507413827644>")
                      .setLabel("Descrição da embed")
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(`footerEmbed-${p.ID}`)
                      .setEmoji("<:config7:1107098507413827644>")
                      .setLabel("Rodapé da embed")
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(`placeholder-${p.ID}`)
                      .setEmoji("<:config7:1107098507413827644>")
                      .setLabel("Placeholder")
                      .setStyle(ButtonStyle.Primary)
                  ),
                  new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                      .setCustomId(`corEmbed-${p.ID}`)
                      .setEmoji("<:config7:1107098507413827644>")
                      .setLabel("Cor Embed")
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(`bannerEmbed-${p.ID}`)
                      .setEmoji("<:lb9:1113897601620770836>")
                      .setLabel("Banner")
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(`thumbEmbed-${p.ID}`)
                      .setEmoji("<:lb9:1113897601620770836>")
                      .setLabel("Miniatura")
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(`atualizarP-${p.ID}`)
                      .setEmoji("<a:loading:1107106161657905242>")
                      .setLabel("Atualizar Painel")
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(`voltarProTicket-${p.ID}`)
                      .setEmoji("<:lb7:1113897476651499620>")
                      .setLabel("Voltar")
                      .setStyle(ButtonStyle.Primary)
                  ),
                ],
                ephemeral: true,
              });
            }, 1500);
          });
        } else {
          console.log("Canal não encontrado");
        }
      }

      if (interaction.customId === `placeholder-${p.ID}`) {
        interaction.update({
          embeds: [
            new EmbedBuilder()
              .setTitle(`${client.user.username} | Gerenciar Ticket`)
              .setDescription(
                `**🏷 | Placeholder:** ${
                  ticketsP.get(`${p.ID}.configs.placeholder`) ||
                  `Não configurado ainda...`
                }`
              )
              .setFooter({ text: "Envie o novo placeholder abaixo:" }),
          ],
          components: [],
        });

        const configs = ticketsP.get(`${p.ID}.configs`) || {};

        ticketsP.set(`${p.ID}.configs`, configs);

        const channel = client.channels.cache.get(interaction.channel.id);

        if (channel) {
          const collector = new MessageCollector(channel, { time: 15000 });

          collector.on("collect", (message) => {
            configs.placeholder = message.content;
            ticketsP.set(`${p.ID}.configs`, configs);

            message.delete();
            collector.stop();
          });

          collector.on("end", async (collected) => {
            setTimeout(() => {
              interaction.editReply({
                embeds: [
                  new EmbedBuilder()
                    .setTitle(
                      `Titulo Atual: ${
                        ticketsP.get(`${p.ID}.configs.titulo`) ||
                        "Não configurado ainda..."
                      }`
                    )
                    .setDescription(
                      `**📰 | Descrição atual:**\n${
                        ticketsP.get(`${p.ID}.configs.descricao`) ||
                        "Não configurado ainda..."
                      }\n\n📦 | Cor da Embed: ${
                        ticketsP.get(`${p.ID}.configs.embedColor`) ||
                        "Não configurado ainda..."
                      }\n📒 | Texto Placeholder: ${
                        ticketsP.get(`${p.ID}.configs.placeholder`) ||
                        "Selecione um Ticket"
                      }\n🖼 | Banner: ${
                        ticketsP.get(`${p.ID}.configs.banner`) || "Sem banner."
                      }\n🖼 Miniatura: ${
                        ticketsP.get(`${p.ID}.configs.miniatura`) ||
                        "Sem miniatura."
                      }`
                    )
                    .setFooter({
                      iconURL: client.user.avatarURL(),
                      text: `${
                        ticketsP.get(`${p.ID}.configs.footer`) || "Sem rodapé"
                      }`,
                    }),
                ],
                components: [
                  new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                      .setCustomId(`tituloEmbed-${p.ID}`)
                      .setEmoji("<:config7:1107098507413827644>")
                      .setLabel("Titulo da embed")
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(`descEmbed-${p.ID}`)
                      .setEmoji("<:config7:1107098507413827644>")
                      .setLabel("Descrição da embed")
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(`footerEmbed-${p.ID}`)
                      .setEmoji("<:config7:1107098507413827644>")
                      .setLabel("Rodapé da embed")
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(`placeholder-${p.ID}`)
                      .setEmoji("<:config7:1107098507413827644>")
                      .setLabel("Placeholder")
                      .setStyle(ButtonStyle.Primary)
                  ),
                  new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                      .setCustomId(`corEmbed-${p.ID}`)
                      .setEmoji("<:config7:1107098507413827644>")
                      .setLabel("Cor Embed")
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(`bannerEmbed-${p.ID}`)
                      .setEmoji("<:lb9:1113897601620770836>")
                      .setLabel("Banner")
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(`thumbEmbed-${p.ID}`)
                      .setEmoji("<:lb9:1113897601620770836>")
                      .setLabel("Miniatura")
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(`atualizarP-${p.ID}`)
                      .setEmoji("<a:loading:1107106161657905242>")
                      .setLabel("Atualizar Painel")
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(`voltarProTicket-${p.ID}`)
                      .setEmoji("<:lb7:1113897476651499620>")
                      .setLabel("Voltar")
                      .setStyle(ButtonStyle.Primary)
                  ),
                ],
                ephemeral: true,
              });
            }, 1500);
          });
        } else {
          console.log("Canal não encontrado");
        }
      }

      if (interaction.customId === `corEmbed-${p.ID}`) {
        interaction.update({
          embeds: [
            new EmbedBuilder()
              .setTitle(`${client.user.username} | Gerenciar Ticket`)
              .setDescription(
                `**🏷 | Cor:** ${
                  ticketsP.get(`${p.ID}.configs.embedColor`) ||
                  `Não configurado ainda...`
                }`
              )
              .setFooter({ text: "Envie a nova cor abaixo:" }),
          ],
          components: [],
        });

        const configs = ticketsP.get(`${p.ID}.configs`) || {};

        ticketsP.set(`${p.ID}.configs`, configs);

        const channel = client.channels.cache.get(interaction.channel.id);

        if (channel) {
          const collector = new MessageCollector(channel, { time: 15000 });

          collector.on("collect", (message) => {
            configs.embedColor = message.content;
            ticketsP.set(`${p.ID}.configs`, configs);

            message.delete();
            collector.stop();
          });

          collector.on("end", async (collected) => {
            setTimeout(() => {
              interaction.editReply({
                embeds: [
                  new EmbedBuilder()
                    .setTitle(
                      `Titulo Atual: ${
                        ticketsP.get(`${p.ID}.configs.titulo`) ||
                        "Não configurado ainda..."
                      }`
                    )
                    .setDescription(
                      `**📰 | Descrição atual:**\n${
                        ticketsP.get(`${p.ID}.configs.descricao`) ||
                        "Não configurado ainda..."
                      }\n\n📦 | Cor da Embed: ${
                        ticketsP.get(`${p.ID}.configs.embedColor`) ||
                        "Não configurado ainda..."
                      }\n📒 | Texto Placeholder: ${
                        ticketsP.get(`${p.ID}.configs.placeholder`) ||
                        "Selecione um Ticket"
                      }\n🖼 | Banner: ${
                        ticketsP.get(`${p.ID}.configs.banner`) || "Sem banner."
                      }\n🖼 Miniatura: ${
                        ticketsP.get(`${p.ID}.configs.miniatura`) ||
                        "Sem miniatura."
                      }`
                    )
                    .setFooter({
                      iconURL: client.user.avatarURL(),
                      text: `${
                        ticketsP.get(`${p.ID}.configs.footer`) || "Sem rodapé"
                      }`,
                    }),
                ],
                components: [
                  new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                      .setCustomId(`tituloEmbed-${p.ID}`)
                      .setEmoji("<:config7:1107098507413827644>")
                      .setLabel("Titulo da embed")
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(`descEmbed-${p.ID}`)
                      .setEmoji("<:config7:1107098507413827644>")
                      .setLabel("Descrição da embed")
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(`footerEmbed-${p.ID}`)
                      .setEmoji("<:config7:1107098507413827644>")
                      .setLabel("Rodapé da embed")
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(`placeholder-${p.ID}`)
                      .setEmoji("<:config7:1107098507413827644>")
                      .setLabel("Placeholder")
                      .setStyle(ButtonStyle.Primary)
                  ),
                  new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                      .setCustomId(`corEmbed-${p.ID}`)
                      .setEmoji("<:config7:1107098507413827644>")
                      .setLabel("Cor Embed")
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(`bannerEmbed-${p.ID}`)
                      .setEmoji("<:lb9:1113897601620770836>")
                      .setLabel("Banner")
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(`thumbEmbed-${p.ID}`)
                      .setEmoji("<:lb9:1113897601620770836>")
                      .setLabel("Miniatura")
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(`atualizarP-${p.ID}`)
                      .setEmoji("<a:loading:1107106161657905242>")
                      .setLabel("Atualizar Painel")
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(`voltarProTicket-${p.ID}`)
                      .setEmoji("<:lb7:1113897476651499620>")
                      .setLabel("Voltar")
                      .setStyle(ButtonStyle.Primary)
                  ),
                ],
                ephemeral: true,
              });
            }, 1500);
          });
        } else {
          console.log("Canal não encontrado");
        }
      }

      if (interaction.customId === `bannerEmbed-${p.ID}`) {
        interaction.update({
          embeds: [
            new EmbedBuilder()
              .setTitle(`${client.user.username} | Gerenciar Ticket`)
              .setDescription(
                `**🏷 | Banner:** ${
                  ticketsP.get(`${p.ID}.configs.banner`) ||
                  `Não configurado ainda...`
                }`
              )
              .setFooter({ text: "Envie o novo banner abaixo:" }),
          ],
          components: [],
        });

        const configs = ticketsP.get(`${p.ID}.configs`) || {};

        ticketsP.set(`${p.ID}.configs`, configs);

        const channel = client.channels.cache.get(interaction.channel.id);

        if (channel) {
          const collector = new MessageCollector(channel, { time: 15000 });

          collector.on("collect", (message) => {
            configs.banner = message.content;
            ticketsP.set(`${p.ID}.configs`, configs);

            message.delete();
            collector.stop();
          });

          collector.on("end", async (collected) => {
            setTimeout(() => {
              interaction.editReply({
                embeds: [
                  new EmbedBuilder()
                    .setTitle(
                      `Titulo Atual: ${
                        ticketsP.get(`${p.ID}.configs.titulo`) ||
                        "Não configurado ainda..."
                      }`
                    )
                    .setDescription(
                      `**📰 | Descrição atual:**\n${
                        ticketsP.get(`${p.ID}.configs.descricao`) ||
                        "Não configurado ainda..."
                      }\n\n📦 | Cor da Embed: ${
                        ticketsP.get(`${p.ID}.configs.embedColor`) ||
                        "Não configurado ainda..."
                      }\n📒 | Texto Placeholder: ${
                        ticketsP.get(`${p.ID}.configs.placeholder`) ||
                        "Selecione um Ticket"
                      }\n🖼 | Banner: ${
                        ticketsP.get(`${p.ID}.configs.banner`) || "Sem banner."
                      }\n🖼 Miniatura: ${
                        ticketsP.get(`${p.ID}.configs.miniatura`) ||
                        "Sem miniatura."
                      }`
                    )
                    .setFooter({
                      iconURL: client.user.avatarURL(),
                      text: `${
                        ticketsP.get(`${p.ID}.configs.footer`) || "Sem rodapé"
                      }`,
                    }),
                ],
                components: [
                  new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                      .setCustomId(`tituloEmbed-${p.ID}`)
                      .setEmoji("<:config7:1107098507413827644>")
                      .setLabel("Titulo da embed")
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(`descEmbed-${p.ID}`)
                      .setEmoji("<:config7:1107098507413827644>")
                      .setLabel("Descrição da embed")
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(`footerEmbed-${p.ID}`)
                      .setEmoji("<:config7:1107098507413827644>")
                      .setLabel("Rodapé da embed")
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(`placeholder-${p.ID}`)
                      .setEmoji("<:config7:1107098507413827644>")
                      .setLabel("Placeholder")
                      .setStyle(ButtonStyle.Primary)
                  ),
                  new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                      .setCustomId(`corEmbed-${p.ID}`)
                      .setEmoji("<:config7:1107098507413827644>")
                      .setLabel("Cor Embed")
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(`bannerEmbed-${p.ID}`)
                      .setEmoji("<:lb9:1113897601620770836>")
                      .setLabel("Banner")
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(`thumbEmbed-${p.ID}`)
                      .setEmoji("<:lb9:1113897601620770836>")
                      .setLabel("Miniatura")
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(`atualizarP-${p.ID}`)
                      .setEmoji("<a:loading:1107106161657905242>")
                      .setLabel("Atualizar Painel")
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(`voltarProTicket-${p.ID}`)
                      .setEmoji("<:lb7:1113897476651499620>")
                      .setLabel("Voltar")
                      .setStyle(ButtonStyle.Primary)
                  ),
                ],
                ephemeral: true,
              });
            }, 1500);
          });
        } else {
          console.log("Canal não encontrado");
        }
      }

      if (interaction.customId === `thumbEmbed-${p.ID}`) {
        interaction.update({
          embeds: [
            new EmbedBuilder()
              .setTitle(`${client.user.username} | Gerenciar Ticket`)
              .setDescription(
                `**🏷 | Miniatura:** ${
                  ticketsP.get(`${p.ID}.configs.miniatura`) ||
                  `Não configurado ainda...`
                }`
              )
              .setFooter({ text: "Envie a nova miniatura abaixo:" }),
          ],
          components: [],
        });

        const configs = ticketsP.get(`${p.ID}.configs`) || {};

        ticketsP.set(`${p.ID}.configs`, configs);

        const channel = client.channels.cache.get(interaction.channel.id);

        if (channel) {
          const collector = new MessageCollector(channel, { time: 15000 });

          collector.on("collect", (message) => {
            configs.miniatura = message.content;
            ticketsP.set(`${p.ID}.configs`, configs);

            message.delete();
            collector.stop();
          });

          collector.on("end", async (collected) => {
            setTimeout(() => {
              interaction.editReply({
                embeds: [
                  new EmbedBuilder()
                    .setTitle(
                      `Titulo Atual: ${
                        ticketsP.get(`${p.ID}.configs.titulo`) ||
                        "Não configurado ainda..."
                      }`
                    )
                    .setDescription(
                      `**📰 | Descrição atual:**\n${
                        ticketsP.get(`${p.ID}.configs.descricao`) ||
                        "Não configurado ainda..."
                      }\n\n📦 | Cor da Embed: ${
                        ticketsP.get(`${p.ID}.configs.embedColor`) ||
                        "Não configurado ainda..."
                      }\n📒 | Texto Placeholder: ${
                        ticketsP.get(`${p.ID}.configs.placeholder`) ||
                        "Selecione um Ticket"
                      }\n🖼 | Banner: ${
                        ticketsP.get(`${p.ID}.configs.banner`) || "Sem banner."
                      }\n🖼 Miniatura: ${
                        ticketsP.get(`${p.ID}.configs.miniatura`) ||
                        "Sem miniatura."
                      }`
                    )
                    .setFooter({
                      iconURL: client.user.avatarURL(),
                      text: `${
                        ticketsP.get(`${p.ID}.configs.footer`) || "Sem rodapé"
                      }`,
                    }),
                ],
                components: [
                  new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                      .setCustomId(`tituloEmbed-${p.ID}`)
                      .setEmoji("<:config7:1107098507413827644>")
                      .setLabel("Titulo da embed")
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(`descEmbed-${p.ID}`)
                      .setEmoji("<:config7:1107098507413827644>")
                      .setLabel("Descrição da embed")
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(`footerEmbed-${p.ID}`)
                      .setEmoji("<:config7:1107098507413827644>")
                      .setLabel("Rodapé da embed")
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(`placeholder-${p.ID}`)
                      .setEmoji("<:config7:1107098507413827644>")
                      .setLabel("Placeholder")
                      .setStyle(ButtonStyle.Primary)
                  ),
                  new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                      .setCustomId(`corEmbed-${p.ID}`)
                      .setEmoji("<:config7:1107098507413827644>")
                      .setLabel("Cor Embed")
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(`bannerEmbed-${p.ID}`)
                      .setEmoji("<:lb9:1113897601620770836>")
                      .setLabel("Banner")
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(`thumbEmbed-${p.ID}`)
                      .setEmoji("<:lb9:1113897601620770836>")
                      .setLabel("Miniatura")
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(`atualizarP-${p.ID}`)
                      .setEmoji("<a:loading:1107106161657905242>")
                      .setLabel("Atualizar Painel")
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(`voltarProTicket-${p.ID}`)
                      .setEmoji("<:lb7:1113897476651499620>")
                      .setLabel("Voltar")
                      .setStyle(ButtonStyle.Primary)
                  ),
                ],
                ephemeral: true,
              });
            }, 1500);
          });
        } else {
          console.log("Canal não encontrado");
        }
      }
    });

    const ticketChannelEmbed = new EmbedBuilder().setDescription(
      `\`\`TICKET ${interaction.user.username}\`\` aberto por: <@${interaction.user.id}>\nCaso queira sair do canal, clique em **Sair do Canal**\n\n📒 Assunto:\n\`\`\`A tratar abaixo\`\`\``
    );

    const allTicketsB = ticketsB.all();
    allTicketsB.map(async (t) => {
      if (interaction.customId === `voltar-${t.ID}`) {
        const functions = ticketsB.get(`${t.ID}.functions`);

        let formattedFunctions = ``;

        for (const func in functions[0]) {
          formattedFunctions += `${func}: \`\`${functions[0][func]}\`\`\n`;
        }

        interaction.update({
          embeds: [
            new EmbedBuilder()
              .setTitle(`${client.user.username} | Gerenciar Ticket`)
              .setFooter({
                text: `${client.user.username} - Todos os direitos reservados.`,
                iconURL: client.user.avatarURL(),
              })
              .setDescription(
                `**📰 Descrição:**\n\n${
                  ticketsB.get(`${t.ID}.configs.descricao`) ||
                  `:arrow_forward: Clique abaixo para abrir um TICKET na categoria \`\`Não configurado ainda...\`\``
                }\n\n🔍 | Id: ${t.ID}\n🏷 | Title: ${
                  ticketsB.get(`${t.ID}.configs.titulo`) ||
                  `${client.user.username} | ${interaction.guild.name} | Sistema de Ticket`
                }\n\n⚙ Funções:\n${formattedFunctions}`
              ),
          ],
          ephemeral: true,
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`titulo-${t.ID}`)
                .setEmoji(`<:Lost100:1098257166793715782>`)
                .setLabel(`Titulo`)
                .setStyle(ButtonStyle.Success),
              new ButtonBuilder()
                .setCustomId(`descricao-${t.ID}`)
                .setEmoji(`<:TermosLost7:1098144396551147561>`)
                .setLabel(`Descrição`)
                .setStyle(ButtonStyle.Success),
              new ButtonBuilder()
                .setCustomId(`functions-${t.ID}`)
                .setEmoji(`<a:config:1104887819454906469>`)
                .setLabel(`Funções`)
                .setStyle(ButtonStyle.Success),
              new ButtonBuilder()
                .setCustomId(`banner-${t.ID}`)
                .setEmoji(`<:lb9:1113897601620770836>`)
                .setLabel(`Banner`)
                .setStyle(ButtonStyle.Success),
              new ButtonBuilder()
                .setCustomId(`miniatura-${t.ID}`)
                .setEmoji(`<:lb9:1113897601620770836>`)
                .setLabel(`Miniatura`)
                .setStyle(ButtonStyle.Success)
            ),
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`configAv-${t.ID}`)
                .setEmoji(`<:config7:1107098507413827644>`)
                .setLabel(`Configurações Avançadas`)
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId(`atualizar-${t.ID}`)
                .setEmoji(`<a:loading:1107106161657905242>`)
                .setLabel(`Atualizar Mensagem`)
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId(`delete-${t.ID}`)
                .setEmoji(`<:LixoLost7:1106015127184085052>`)
                .setLabel(`DELETAR`)
                .setStyle(ButtonStyle.Danger),
              new ButtonBuilder()
                .setCustomId(`info-${t.ID}`)
                .setEmoji(`<:info:1107104152959602719>`)
                .setStyle(ButtonStyle.Primary)
            ),
          ],
        });
      }

      // STYLES EMBED

      if (interaction.customId === `bannerModal-${t.ID}`) {
        const banner = interaction.fields.getTextInputValue("link");

        ticketsB.set(`${t.ID}.configs.banner`, banner);

        interaction.reply({
          content: "**✅ | Banner do Ticket alterado com sucesso.**",
          ephemeral: true,
        });
      }

      if (interaction.customId === `miniaturaModal-${t.ID}`) {
        const miniatura = interaction.fields.getTextInputValue("link");

        ticketsB.set(`${t.ID}.configs.miniatura`, miniatura);

        interaction.reply({
          content: "**✅ | Miniatura do Ticket alterado com sucesso.**",
          ephemeral: true,
        });
      }

      if (interaction.customId === `titulo-${t.ID}`) {
        interaction.update({
          embeds: [
            new EmbedBuilder()
              .setTitle(`${client.user.username} | Gerenciar Ticket`)
              .setDescription(
                `**🏷 | Title:** ${
                  ticketsB.get(`${t.ID}.configs.titulo`) ||
                  `${client.user.username} | ${interaction.guild.name} | Sistema de Ticket`
                }`
              )
              .setFooter({ text: "Envie o novo titulo abaixo:" }),
          ],
          components: [],
        });

        const configs = ticketsB.get(`${t.ID}.configs`) || {};

        ticketsB.set(`${t.ID}.configs`, configs);

        const channel = client.channels.cache.get(interaction.channel.id);

        if (channel) {
          const collector = new MessageCollector(channel, { time: 15000 });

          collector.on("collect", (message) => {
            configs.titulo = message.content;
            ticketsB.set(`${t.ID}.configs`, configs);

            message.delete();
            collector.stop();
          });

          collector.on("end", async (collected) => {
            const functions = ticketsB.get(`${t.ID}.functions`);

            let formattedFunctions = ``;

            for (const func in functions[0]) {
              formattedFunctions += `${func}: \`\`${functions[0][func]}\`\`\n`;
            }

            setTimeout(() => {
              interaction.editReply({
                embeds: [
                  new EmbedBuilder()
                    .setTitle(`${client.user.username} | Gerenciar Ticket`)
                    .setFooter({
                      text: `${client.user.username} - Todos os direitos reservados.`,
                      iconURL: client.user.avatarURL(),
                    })
                    .setDescription(
                      `**📰 Descrição:**\n\n${
                        ticketsB.get(`${t.ID}.configs.descricao`) ||
                        `:arrow_forward: Clique abaixo para abrir um TICKET na categoria \`\`Não configurado ainda...\`\``
                      }\n\n🔍 | Id: ${t.ID}\n🏷 | Title: ${
                        ticketsB.get(`${t.ID}.configs.titulo`) ||
                        `${client.user.username} | ${interaction.guild.name} | Sistema de Ticket`
                      }\n\n⚙ Funções:\n${formattedFunctions}`
                    ),
                ],
                ephemeral: true,
                components: [
                  new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                      .setCustomId(`titulo-${t.ID}`)
                      .setEmoji(`<:Lost100:1098257166793715782>`)
                      .setLabel(`Titulo`)
                      .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                      .setCustomId(`descricao-${t.ID}`)
                      .setEmoji(`<:TermosLost7:1098144396551147561>`)
                      .setLabel(`Descrição`)
                      .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                      .setCustomId(`functions-${t.ID}`)
                      .setEmoji(`<a:config:1104887819454906469>`)
                      .setLabel(`Funções`)
                      .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                      .setCustomId(`banner-${t.ID}`)
                      .setEmoji(`<:lb9:1113897601620770836>`)
                      .setLabel(`Banner`)
                      .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                      .setCustomId(`miniatura-${t.ID}`)
                      .setEmoji(`<:lb9:1113897601620770836>`)
                      .setLabel(`Miniatura`)
                      .setStyle(ButtonStyle.Success)
                  ),
                  new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                      .setCustomId(`configAv-${t.ID}`)
                      .setEmoji(`<:config7:1107098507413827644>`)
                      .setLabel(`Configurações Avançadas`)
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(`atualizar-${t.ID}`)
                      .setEmoji(`<a:loading:1107106161657905242>`)
                      .setLabel(`Atualizar Mensagem`)
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(`delete-${t.ID}`)
                      .setEmoji(`<:LixoLost7:1106015127184085052>`)
                      .setLabel(`DELETAR`)
                      .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                      .setCustomId(`info-${t.ID}`)
                      .setEmoji(`<:info:1107104152959602719>`)
                      .setStyle(ButtonStyle.Primary)
                  ),
                ],
              });
            }, 1500);
          });
        } else {
          console.log("Canal não encontrado");
        }
      }

      if (interaction.customId === `descricao-${t.ID}`) {
        interaction.update({
          embeds: [
            new EmbedBuilder()
              .setTitle(`${client.user.username} | Gerenciar Ticket`)
              .setDescription(
                `**📰 | Descrição:** ${
                  ticketsB.get(`${t.ID}.configs.descricao`) ||
                  `:arrow_forward: Clique abaixo para abrir um TICKET na categoria \`\`Não configurado ainda...\`\``
                }`
              )
              .setFooter({ text: "Envie a nova descrição abaixo:" }),
          ],
          components: [],
        });

        const configs = ticketsB.get(`${t.ID}.configs`) || {};

        ticketsB.set(`${t.ID}.configs`, configs);

        const channel = client.channels.cache.get(interaction.channel.id);

        if (channel) {
          const collector = new MessageCollector(channel, { time: 15000 });

          collector.on("collect", (message) => {
            configs.descricao = message.content;
            ticketsB.set(`${t.ID}.configs`, configs);

            message.delete();
            collector.stop();
          });

          collector.on("end", async (collected) => {
            const functions = ticketsB.get(`${t.ID}.functions`);

            let formattedFunctions = ``;

            for (const func in functions[0]) {
              formattedFunctions += `${func}: \`\`${functions[0][func]}\`\`\n`;
            }

            setTimeout(() => {
              interaction.editReply({
                embeds: [
                  new EmbedBuilder()
                    .setTitle(`${client.user.username} | Gerenciar Ticket`)
                    .setFooter({
                      text: `${client.user.username} - Todos os direitos reservados.`,
                      iconURL: client.user.avatarURL(),
                    })
                    .setDescription(
                      `**📰 Descrição:**\n\n${
                        ticketsB.get(`${t.ID}.configs.descricao`) ||
                        `:arrow_forward: Clique abaixo para abrir um TICKET na categoria \`\`Não configurado ainda...\`\``
                      }\n\n🔍 | Id: ${t.ID}\n🏷 | Title: ${
                        ticketsB.get(`${t.ID}.configs.titulo`) ||
                        `${client.user.username} | ${interaction.guild.name} | Sistema de Ticket`
                      }\n\n⚙ Funções:\n${formattedFunctions}`
                    ),
                ],
                ephemeral: true,
                components: [
                  new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                      .setCustomId(`titulo-${t.ID}`)
                      .setEmoji(`<:Lost100:1098257166793715782>`)
                      .setLabel(`Titulo`)
                      .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                      .setCustomId(`descricao-${t.ID}`)
                      .setEmoji(`<:TermosLost7:1098144396551147561>`)
                      .setLabel(`Descrição`)
                      .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                      .setCustomId(`functions-${t.ID}`)
                      .setEmoji(`<a:config:1104887819454906469>`)
                      .setLabel(`Funções`)
                      .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                      .setCustomId(`banner-${t.ID}`)
                      .setEmoji(`<:lb9:1113897601620770836>`)
                      .setLabel(`Banner`)
                      .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                      .setCustomId(`miniatura-${t.ID}`)
                      .setEmoji(`<:lb9:1113897601620770836>`)
                      .setLabel(`Miniatura`)
                      .setStyle(ButtonStyle.Success)
                  ),
                  new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                      .setCustomId(`configAv-${t.ID}`)
                      .setEmoji(`<:config7:1107098507413827644>`)
                      .setLabel(`Configurações Avançadas`)
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(`atualizar-${t.ID}`)
                      .setEmoji(`<a:loading:1107106161657905242>`)
                      .setLabel(`Atualizar Mensagem`)
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId(`delete-${t.ID}`)
                      .setEmoji(`<:LixoLost7:1106015127184085052>`)
                      .setLabel(`DELETAR`)
                      .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                      .setCustomId(`info-${t.ID}`)
                      .setEmoji(`<:info:1107104152959602719>`)
                      .setStyle(ButtonStyle.Primary)
                  ),
                ],
              });
            }, 1500);
          });
        } else {
          console.log("Canal não encontrado");
        }
      }

      if (interaction.customId === `banner-${t.ID}`) {
        const modal = new ModalBuilder()
          .setTitle("Alterar Banner do Ticket")
          .setCustomId(`bannerModal-${t.ID}`);

        const link = new TextInputBuilder()
          .setCustomId("link")
          .setLabel("LINK BANNER:")
          .setRequired(true)
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("NOVO BANNER");

        const row = new ActionRowBuilder().addComponents(link);
        modal.addComponents(row);
        interaction.showModal(modal);
      }

      if (interaction.customId === `miniatura-${t.ID}`) {
        const modal = new ModalBuilder()
          .setTitle("Alterar Miniatura do Ticket")
          .setCustomId(`miniaturaModal-${t.ID}`);

        const link = new TextInputBuilder()
          .setCustomId("link")
          .setLabel("LINK MINIATURA:")
          .setRequired(true)
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("NOVA MINIATURA");

        const row = new ActionRowBuilder().addComponents(link);
        modal.addComponents(row);
        interaction.showModal(modal);
      }

      // FUNCTIONS

      if (interaction.customId === `functions-${t.ID}`) {
        const functions = ticketsB.get(`${t.ID}.functions`);

        let formattedFunctions = ``;

        for (const func in functions[0]) {
          formattedFunctions += `${func}: \`\`${functions[0][func]}\`\`\n`;
        }

        interaction.update({
          embeds: [
            new EmbedBuilder()
              .setTitle(`${client.user.username} | Gerenciar Ticket`)
              .setDescription(`⚙ Funções:\n${formattedFunctions}`)
              .setFooter({
                text: `${client.user.username} - Todos os direitos reservados.`,
                iconURL: client.user.avatarURL(),
              }),
          ],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`callOnOff-${t.ID}`)
                .setEmoji(`<:Lost7Call:1106002914281009322>`)
                .setLabel(`Criar Call (ON/OFF)`)
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`pokeOnOff-${t.ID}`)
                .setEmoji(`<a:lb12:1115435692961579140>`)
                .setLabel(`Poke (ON/OFF)`)
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`assumirOnOff-${t.ID}`)
                .setEmoji(`<:verifedLost:1080325994428248174>`)
                .setLabel(`Assumir (ON/OFF)`)
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`renomearOnOff-${t.ID}`)
                .setEmoji(`<:lb4:1113897384909484102>`)
                .setLabel(`Renomear (ON/OFF)`)
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`pagamentoOnOff-${t.ID}`)
                .setEmoji(`<:lb11:1113898808519172168>`)
                .setLabel(`Pagamentos (ON/OFF)`)
                .setStyle(ButtonStyle.Secondary)
            ),
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`genMembroOnOff-${t.ID}`)
                .setEmoji(`<:InfoLost7:1106003706467590175>`)
                .setLabel(`Gerenciar Membros (ON/OFF)`)
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`voltar-${t.ID}`)
                .setEmoji(`<:lb7:1113897476651499620>`)
                .setLabel(`Voltar`)
                .setStyle(ButtonStyle.Danger)
            ),
          ],
        });
      }

      if (interaction.customId === `renomearOnOff-${t.ID}`) {
        const functionsdb = ticketsB.get(`${t.ID}.functions`) || [{}];

        const criarCallState = functionsdb[0]?.Renomear || "Desligado";

        functionsdb[0].Renomear =
          criarCallState === "Ligado" ? "Desligado" : "Ligado";

        ticketsB.set(`${t.ID}.functions`, functionsdb);

        const functions = ticketsB.get(`${t.ID}.functions`);

        let formattedFunctions = ``;

        for (const func in functions[0]) {
          formattedFunctions += `${func}: \`\`${functions[0][func]}\`\`\n`;
        }

        interaction.update({
          embeds: [
            new EmbedBuilder()
              .setTitle(`${client.user.username} | Gerenciar Ticket`)
              .setDescription(`⚙ Funções:\n${formattedFunctions}`)
              .setFooter({
                text: `${client.user.username} - Todos os direitos reservados.`,
                iconURL: client.user.avatarURL(),
              }),
          ],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`callOnOff-${t.ID}`)
                .setEmoji(`<:Lost7Call:1106002914281009322>`)
                .setLabel(`Criar Call (ON/OFF)`)
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`pokeOnOff-${t.ID}`)
                .setEmoji(`<a:lb12:1115435692961579140>`)
                .setLabel(`Poke (ON/OFF)`)
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`assumirOnOff-${t.ID}`)
                .setEmoji(`<:verifedLost:1080325994428248174>`)
                .setLabel(`Assumir (ON/OFF)`)
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`renomearOnOff-${t.ID}`)
                .setEmoji(`<:lb4:1113897384909484102>`)
                .setLabel(`Renomear (ON/OFF)`)
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`pagamentoOnOff-${t.ID}`)
                .setEmoji(`<:lb11:1113898808519172168>`)
                .setLabel(`Pagamentos (ON/OFF)`)
                .setStyle(ButtonStyle.Secondary)
            ),
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`genMembroOnOff-${t.ID}`)
                .setEmoji(`<:InfoLost7:1106003706467590175>`)
                .setLabel(`Gerenciar Membros (ON/OFF)`)
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`voltar-${t.ID}`)
                .setEmoji(`<:lb7:1113897476651499620>`)
                .setLabel(`Voltar`)
                .setStyle(ButtonStyle.Danger)
            ),
          ],
        });
      }

      if (interaction.customId === `genMembroOnOff-${t.ID}`) {
        const functionsdb = ticketsB.get(`${t.ID}.functions`) || [{}];

        const criarCallState = functionsdb[0]?.GerenciarMembro || "Desligado";

        functionsdb[0].GerenciarMembro =
          criarCallState === "Ligado" ? "Desligado" : "Ligado";

        ticketsB.set(`${t.ID}.functions`, functionsdb);

        const functions = ticketsB.get(`${t.ID}.functions`);

        let formattedFunctions = ``;

        for (const func in functions[0]) {
          formattedFunctions += `${func}: \`\`${functions[0][func]}\`\`\n`;
        }

        interaction.update({
          embeds: [
            new EmbedBuilder()
              .setTitle(`${client.user.username} | Gerenciar Ticket`)
              .setDescription(`⚙ Funções:\n${formattedFunctions}`)
              .setFooter({
                text: `${client.user.username} - Todos os direitos reservados.`,
                iconURL: client.user.avatarURL(),
              }),
          ],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`callOnOff-${t.ID}`)
                .setEmoji(`<:Lost7Call:1106002914281009322>`)
                .setLabel(`Criar Call (ON/OFF)`)
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`pokeOnOff-${t.ID}`)
                .setEmoji(`<a:lb12:1115435692961579140>`)
                .setLabel(`Poke (ON/OFF)`)
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`assumirOnOff-${t.ID}`)
                .setEmoji(`<:verifedLost:1080325994428248174>`)
                .setLabel(`Assumir (ON/OFF)`)
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`renomearOnOff-${t.ID}`)
                .setEmoji(`<:lb4:1113897384909484102>`)
                .setLabel(`Renomear (ON/OFF)`)
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`pagamentoOnOff-${t.ID}`)
                .setEmoji(`<:lb11:1113898808519172168>`)
                .setLabel(`Pagamentos (ON/OFF)`)
                .setStyle(ButtonStyle.Secondary)
            ),
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`genMembroOnOff-${t.ID}`)
                .setEmoji(`<:InfoLost7:1106003706467590175>`)
                .setLabel(`Gerenciar Membros (ON/OFF)`)
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`voltar-${t.ID}`)
                .setEmoji(`<:lb7:1113897476651499620>`)
                .setLabel(`Voltar`)
                .setStyle(ButtonStyle.Danger)
            ),
          ],
        });
      }

      if (interaction.customId === `pagamentoOnOff-${t.ID}`) {
        const functionsdb = ticketsB.get(`${t.ID}.functions`) || [{}];

        const criarCallState = functionsdb[0]?.Pagamentos || "Desligado";

        functionsdb[0].Pagamentos =
          criarCallState === "Ligado" ? "Desligado" : "Ligado";

        ticketsB.set(`${t.ID}.functions`, functionsdb);

        const functions = ticketsB.get(`${t.ID}.functions`);

        let formattedFunctions = ``;

        for (const func in functions[0]) {
          formattedFunctions += `${func}: \`\`${functions[0][func]}\`\`\n`;
        }

        interaction.update({
          embeds: [
            new EmbedBuilder()
              .setTitle(`${client.user.username} | Gerenciar Ticket`)
              .setDescription(`⚙ Funções:\n${formattedFunctions}`)
              .setFooter({
                text: `${client.user.username} - Todos os direitos reservados.`,
                iconURL: client.user.avatarURL(),
              }),
          ],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`callOnOff-${t.ID}`)
                .setEmoji(`<:Lost7Call:1106002914281009322>`)
                .setLabel(`Criar Call (ON/OFF)`)
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`pokeOnOff-${t.ID}`)
                .setEmoji(`<a:lb12:1115435692961579140>`)
                .setLabel(`Poke (ON/OFF)`)
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`assumirOnOff-${t.ID}`)
                .setEmoji(`<:verifedLost:1080325994428248174>`)
                .setLabel(`Assumir (ON/OFF)`)
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`renomearOnOff-${t.ID}`)
                .setEmoji(`<:lb4:1113897384909484102>`)
                .setLabel(`Renomear (ON/OFF)`)
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`pagamentoOnOff-${t.ID}`)
                .setEmoji(`<:lb11:1113898808519172168>`)
                .setLabel(`Pagamentos (ON/OFF)`)
                .setStyle(ButtonStyle.Secondary)
            ),
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`genMembroOnOff-${t.ID}`)
                .setEmoji(`<:InfoLost7:1106003706467590175>`)
                .setLabel(`Gerenciar Membros (ON/OFF)`)
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`voltar-${t.ID}`)
                .setEmoji(`<:lb7:1113897476651499620>`)
                .setLabel(`Voltar`)
                .setStyle(ButtonStyle.Danger)
            ),
          ],
        });
      }

      if (interaction.customId === `assumirOnOff-${t.ID}`) {
        const functionsdb = ticketsB.get(`${t.ID}.functions`) || [{}];

        const criarCallState = functionsdb[0]?.Assumir || "Desligado";

        functionsdb[0].Assumir =
          criarCallState === "Ligado" ? "Desligado" : "Ligado";

        ticketsB.set(`${t.ID}.functions`, functionsdb);

        const functions = ticketsB.get(`${t.ID}.functions`);

        let formattedFunctions = ``;

        for (const func in functions[0]) {
          formattedFunctions += `${func}: \`\`${functions[0][func]}\`\`\n`;
        }

        interaction.update({
          embeds: [
            new EmbedBuilder()
              .setTitle(`${client.user.username} | Gerenciar Ticket`)
              .setDescription(`⚙ Funções:\n${formattedFunctions}`)
              .setFooter({
                text: `${client.user.username} - Todos os direitos reservados.`,
                iconURL: client.user.avatarURL(),
              }),
          ],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`callOnOff-${t.ID}`)
                .setEmoji(`<:Lost7Call:1106002914281009322>`)
                .setLabel(`Criar Call (ON/OFF)`)
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`pokeOnOff-${t.ID}`)
                .setEmoji(`<a:lb12:1115435692961579140>`)
                .setLabel(`Poke (ON/OFF)`)
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`assumirOnOff-${t.ID}`)
                .setEmoji(`<:verifedLost:1080325994428248174>`)
                .setLabel(`Assumir (ON/OFF)`)
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`renomearOnOff-${t.ID}`)
                .setEmoji(`<:lb4:1113897384909484102>`)
                .setLabel(`Renomear (ON/OFF)`)
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`pagamentoOnOff-${t.ID}`)
                .setEmoji(`<:lb11:1113898808519172168>`)
                .setLabel(`Pagamentos (ON/OFF)`)
                .setStyle(ButtonStyle.Secondary)
            ),
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`genMembroOnOff-${t.ID}`)
                .setEmoji(`<:InfoLost7:1106003706467590175>`)
                .setLabel(`Gerenciar Membros (ON/OFF)`)
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`voltar-${t.ID}`)
                .setEmoji(`<:lb7:1113897476651499620>`)
                .setLabel(`Voltar`)
                .setStyle(ButtonStyle.Danger)
            ),
          ],
        });
      }

      if (interaction.customId === `pokeOnOff-${t.ID}`) {
        const functionsdb = ticketsB.get(`${t.ID}.functions`) || [{}];

        const criarCallState = functionsdb[0]?.Poke || "Desligado";

        functionsdb[0].Poke =
          criarCallState === "Ligado" ? "Desligado" : "Ligado";

        ticketsB.set(`${t.ID}.functions`, functionsdb);

        const functions = ticketsB.get(`${t.ID}.functions`);

        let formattedFunctions = ``;

        for (const func in functions[0]) {
          formattedFunctions += `${func}: \`\`${functions[0][func]}\`\`\n`;
        }

        interaction.update({
          embeds: [
            new EmbedBuilder()
              .setTitle(`${client.user.username} | Gerenciar Ticket`)
              .setDescription(`⚙ Funções:\n${formattedFunctions}`)
              .setFooter({
                text: `${client.user.username} - Todos os direitos reservados.`,
                iconURL: client.user.avatarURL(),
              }),
          ],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`callOnOff-${t.ID}`)
                .setEmoji(`<:Lost7Call:1106002914281009322>`)
                .setLabel(`Criar Call (ON/OFF)`)
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`pokeOnOff-${t.ID}`)
                .setEmoji(`<a:lb12:1115435692961579140>`)
                .setLabel(`Poke (ON/OFF)`)
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`assumirOnOff-${t.ID}`)
                .setEmoji(`<:verifedLost:1080325994428248174>`)
                .setLabel(`Assumir (ON/OFF)`)
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`renomearOnOff-${t.ID}`)
                .setEmoji(`<:lb4:1113897384909484102>`)
                .setLabel(`Renomear (ON/OFF)`)
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`pagamentoOnOff-${t.ID}`)
                .setEmoji(`<:lb11:1113898808519172168>`)
                .setLabel(`Pagamentos (ON/OFF)`)
                .setStyle(ButtonStyle.Secondary)
            ),
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`genMembroOnOff-${t.ID}`)
                .setEmoji(`<:InfoLost7:1106003706467590175>`)
                .setLabel(`Gerenciar Membros (ON/OFF)`)
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`voltar-${t.ID}`)
                .setEmoji(`<:lb7:1113897476651499620>`)
                .setLabel(`Voltar`)
                .setStyle(ButtonStyle.Danger)
            ),
          ],
        });
      }

      if (interaction.customId === `callOnOff-${t.ID}`) {
        const functionsdb = ticketsB.get(`${t.ID}.functions`) || [{}];

        const criarCallState = functionsdb[0]?.CriarCall || "Desligado";

        functionsdb[0].CriarCall =
          criarCallState === "Ligado" ? "Desligado" : "Ligado";

        ticketsB.set(`${t.ID}.functions`, functionsdb);

        const functions = ticketsB.get(`${t.ID}.functions`);

        let formattedFunctions = ``;

        for (const func in functions[0]) {
          formattedFunctions += `${func}: \`\`${functions[0][func]}\`\`\n`;
        }

        interaction.update({
          embeds: [
            new EmbedBuilder()
              .setTitle(`${client.user.username} | Gerenciar Ticket`)
              .setDescription(`⚙ Funções:\n${formattedFunctions}`)
              .setFooter({
                text: `${client.user.username} - Todos os direitos reservados.`,
                iconURL: client.user.avatarURL(),
              }),
          ],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`callOnOff-${t.ID}`)
                .setEmoji(`<:Lost7Call:1106002914281009322>`)
                .setLabel(`Criar Call (ON/OFF)`)
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`pokeOnOff-${t.ID}`)
                .setEmoji(`<a:lb12:1115435692961579140>`)
                .setLabel(`Poke (ON/OFF)`)
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`assumirOnOff-${t.ID}`)
                .setEmoji(`<:verifedLost:1080325994428248174>`)
                .setLabel(`Assumir (ON/OFF)`)
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`renomearOnOff-${t.ID}`)
                .setEmoji(`<:lb4:1113897384909484102>`)
                .setLabel(`Renomear (ON/OFF)`)
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`pagamentoOnOff-${t.ID}`)
                .setEmoji(`<:lb11:1113898808519172168>`)
                .setLabel(`Pagamentos (ON/OFF)`)
                .setStyle(ButtonStyle.Secondary)
            ),
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`genMembroOnOff-${t.ID}`)
                .setEmoji(`<:InfoLost7:1106003706467590175>`)
                .setLabel(`Gerenciar Membros (ON/OFF)`)
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`voltar-${t.ID}`)
                .setEmoji(`<:lb7:1113897476651499620>`)
                .setLabel(`Voltar`)
                .setStyle(ButtonStyle.Danger)
            ),
          ],
        });
      }

      // CONFIG AVANÇADA

      if (interaction.customId == `configCargo-${t.ID}`) {
        const permissoes = ticketsB.get(`${t.ID}.permissoes`);

        let cargosSelecionados;

        if (permissoes && Object.keys(permissoes).length > 0) {
          cargosSelecionados = Object.keys(permissoes)
            .map((roleId) => `<@&${roleId}>`)
            .join("\n");
        } else {
          cargosSelecionados = "Nenhum cargo selecionado.";
        }

        interaction.update({
          embeds: [
            new EmbedBuilder()
              .setTitle(`${client.user.username} | Gerenciar Ticket`)
              .setFooter({
                text: `${client.user.username} - Todos os direitos reservados.`,
                iconURL: client.user.avatarURL(),
              })
              .setDescription(`Cargos Selecionados:\n\n${cargosSelecionados}`),
          ],
          components: [
            new ActionRowBuilder().addComponents(
              new RoleSelectMenuBuilder()
                .setCustomId(`permRoles-${t.ID}`)
                .setPlaceholder(
                  "Selecione qual cargo terá permissoes no ticket."
                )
                .setMaxValues(10)
            ),
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`voltar-${t.ID}`)
                .setEmoji("<:lb7:1113897476651499620>")
                .setLabel("Voltar")
                .setStyle(ButtonStyle.Danger)
            ),
          ],
        });
      }

      if (interaction.customId === `permRoles-${t.ID}`) {
        const selectedRoles = interaction.values;

        let permissoes = ticketsB.get(`${t.ID}.permissoes`) || {};

        selectedRoles.forEach((role) => {
          const roleIdString = role.toString();
          permissoes[roleIdString] = true;
        });

        ticketsB.set(`${t.ID}.permissoes`, permissoes);

        const cargosSelecionados = Object.keys(permissoes)
          .map((roleId) => `<@&${roleId}>`)
          .join("\n");

        interaction.update({
          embeds: [
            new EmbedBuilder()
              .setTitle(`${client.user.username} | Gerenciar Ticket`)
              .setFooter({
                text: `${client.user.username} - Todos os direitos reservados.`,
                iconURL: client.user.avatarURL(),
              })
              .setDescription(`Cargos Selecionados:\n\n${cargosSelecionados}`),
          ],
          components: [
            new ActionRowBuilder().addComponents(
              new RoleSelectMenuBuilder()
                .setCustomId(`permRoles-${t.ID}`)
                .setPlaceholder(
                  "Selecione qual cargo terá permissões no ticket."
                )
                .setMaxValues(10)
            ),
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`voltar-${t.ID}`)
                .setEmoji("<:lb7:1113897476651499620>")
                .setLabel("Voltar")
                .setStyle(ButtonStyle.Danger)
            ),
          ],
        });
      }

      if (interaction.customId == `delete-${t.ID}`) {
        ticketsB.delete(t.ID);

        const msgId = t.data.msgId;
        const channel = interaction.guild.channels.cache.get(t.data.channelId);

        channel.messages.fetch(msgId).then(async (msg) => {
          await msg.delete();
        });

        interaction.update({
          content:
            "**<a:Lost82:1097620271818612766> | Seu ticket foi deletado com sucesso.**",
          components: [],
          embeds: [],
          ephemeral: true,
        });
      }

      if (interaction.customId == `altButton-${t.ID}`) {
        interaction.update({
          embeds: [
            new EmbedBuilder()
              .setTitle(`${client.user.username} | Gerenciar Ticket`)
              .setFooter({
                text: `${client.user.username} - Todos os direitos reservados.`,
                iconURL: client.user.avatarURL(),
              })
              .setDescription(
                "Escolha abaixo qual das configurações avançadas deseja alterar."
              ),
          ],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`altNomeB-${t.ID}`)
                .setEmoji("<:TeamLostt7:1106818257484255232>")
                .setLabel("Alterar Nome Button")
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`altEmojiB-${t.ID}`)
                .setEmoji("<a:config:1104887819454906469>")
                .setLabel("Alterar Emoji Button")
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`altCorB-${t.ID}`)
                .setEmoji("<:lb4:1113897384909484102>")
                .setLabel("Alterar Cor Button")
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`voltar-${t.ID}`)
                .setEmoji("<:lb7:1113897476651499620>")
                .setLabel("Voltar")
                .setStyle(ButtonStyle.Danger)
            ),
          ],
        });
      }

      if (interaction.customId === `altEmojiB-${t.ID}`) {
        interaction.update({
          embeds: [
            new EmbedBuilder()
              .setTitle(`${client.user.username} | Gerenciar Ticket`)
              .setDescription(
                `:arrow_forward: | Envie o emoji abaixo:\n**O emoji tem que estar no seu servidor!**`
              ),
          ],
          components: [],
        });

        const configs = ticketsB.get(`${t.ID}.buttonConfig`) || {};

        ticketsB.set(`${t.ID}.buttonConfig`, configs);

        const channel = client.channels.cache.get(interaction.channel.id);

        if (channel) {
          const collector = new MessageCollector(channel, { time: 15000 });

          collector.on("collect", (message) => {
            configs.emoji = message.content;
            ticketsB.set(`${t.ID}.buttonConfig`, configs);

            message.delete();
            collector.stop();
          });

          collector.on("end", async (collected) => {
            interaction.editReply({
              embeds: [
                new EmbedBuilder()
                  .setTitle(`${client.user.username} | Gerenciar Ticket`)
                  .setFooter({
                    text: `${client.user.username} - Todos os direitos reservados.`,
                    iconURL: client.user.avatarURL(),
                  })
                  .setDescription(
                    "Escolha abaixo qual das configurações avançadas deseja alterar."
                  ),
              ],
              components: [
                new ActionRowBuilder().addComponents(
                  new ButtonBuilder()
                    .setCustomId(`altNomeB-${t.ID}`)
                    .setEmoji("<:TeamLostt7:1106818257484255232>")
                    .setLabel("Alterar Nome Button")
                    .setStyle(ButtonStyle.Secondary),
                  new ButtonBuilder()
                    .setCustomId(`altEmojiB-${t.ID}`)
                    .setEmoji("<a:config:1104887819454906469>")
                    .setLabel("Alterar Emoji Button")
                    .setStyle(ButtonStyle.Secondary),
                  new ButtonBuilder()
                    .setCustomId(`altCorB-${t.ID}`)
                    .setEmoji("<:lb4:1113897384909484102>")
                    .setLabel("Alterar Cor Button")
                    .setStyle(ButtonStyle.Secondary),
                  new ButtonBuilder()
                    .setCustomId(`voltar-${t.ID}`)
                    .setEmoji("<:lb7:1113897476651499620>")
                    .setLabel("Voltar")
                    .setStyle(ButtonStyle.Danger)
                ),
              ],
            });
          });
        }
      }

      if (interaction.customId === `altNomeB-${t.ID}`) {
        interaction.update({
          embeds: [
            new EmbedBuilder()
              .setTitle(`${client.user.username} | Gerenciar Ticket`)
              .setDescription(
                `:arrow_forward: | Envie o novo texto do botão abaixo:`
              ),
          ],
          components: [],
        });

        const configs = ticketsB.get(`${t.ID}.buttonConfig`) || {};

        ticketsB.set(`${t.ID}.buttonConfig`, configs);

        const channel = client.channels.cache.get(interaction.channel.id);

        if (channel) {
          const collector = new MessageCollector(channel, { time: 15000 });

          collector.on("collect", (message) => {
            configs.label = message.content;
            ticketsB.set(`${t.ID}.buttonConfig`, configs);

            message.delete();
            collector.stop();
          });

          collector.on("end", async (collected) => {
            interaction.editReply({
              embeds: [
                new EmbedBuilder()
                  .setTitle(`${client.user.username} | Gerenciar Ticket`)
                  .setFooter({
                    text: `${client.user.username} - Todos os direitos reservados.`,
                    iconURL: client.user.avatarURL(),
                  })
                  .setDescription(
                    "Escolha abaixo qual das configurações avançadas deseja alterar."
                  ),
              ],
              components: [
                new ActionRowBuilder().addComponents(
                  new ButtonBuilder()
                    .setCustomId(`altNomeB-${t.ID}`)
                    .setEmoji("<:TeamLostt7:1106818257484255232>")
                    .setLabel("Alterar Nome Button")
                    .setStyle(ButtonStyle.Secondary),
                  new ButtonBuilder()
                    .setCustomId(`altEmojiB-${t.ID}`)
                    .setEmoji("<a:config:1104887819454906469>")
                    .setLabel("Alterar Emoji Button")
                    .setStyle(ButtonStyle.Secondary),
                  new ButtonBuilder()
                    .setCustomId(`altCorB-${t.ID}`)
                    .setEmoji("<:lb4:1113897384909484102>")
                    .setLabel("Alterar Cor Button")
                    .setStyle(ButtonStyle.Secondary),
                  new ButtonBuilder()
                    .setCustomId(`voltar-${t.ID}`)
                    .setEmoji("<:lb7:1113897476651499620>")
                    .setLabel("Voltar")
                    .setStyle(ButtonStyle.Danger)
                ),
              ],
            });
          });
        }
      }

      if (interaction.customId === `altCorB-${t.ID}`) {
        interaction.update({
          embeds: [
            new EmbedBuilder()
              .setTitle(`${client.user.username} | Gerenciar Ticket`)
              .setDescription(
                `:arrow_forward: | Envie a cor abaixo:\n\nCores:\n• Azul\n• Verde\n• Vermelho\n• Cinza`
              ),
          ],
          components: [],
        });

        const configs = ticketsB.get(`${t.ID}.buttonConfig`) || {};

        ticketsB.set(`${t.ID}.buttonConfig`, configs);

        const channel = client.channels.cache.get(interaction.channel.id);

        if (channel) {
          const collector = new MessageCollector(channel, { time: 15000 });

          collector.on("collect", (message) => {
            configs.color = message.content;
            ticketsB.set(`${t.ID}.buttonConfig`, configs);

            message.delete();
            collector.stop();
          });

          collector.on("end", async (collected) => {
            interaction.editReply({
              embeds: [
                new EmbedBuilder()
                  .setTitle(`${client.user.username} | Gerenciar Ticket`)
                  .setFooter({
                    text: `${client.user.username} - Todos os direitos reservados.`,
                    iconURL: client.user.avatarURL(),
                  })
                  .setDescription(
                    "Escolha abaixo qual das configurações avançadas deseja alterar."
                  ),
              ],
              components: [
                new ActionRowBuilder().addComponents(
                  new ButtonBuilder()
                    .setCustomId(`altNomeB-${t.ID}`)
                    .setEmoji("<:TeamLostt7:1106818257484255232>")
                    .setLabel("Alterar Nome Button")
                    .setStyle(ButtonStyle.Secondary),
                  new ButtonBuilder()
                    .setCustomId(`altEmojiB-${t.ID}`)
                    .setEmoji("<a:config:1104887819454906469>")
                    .setLabel("Alterar Emoji Button")
                    .setStyle(ButtonStyle.Secondary),
                  new ButtonBuilder()
                    .setCustomId(`altCorB-${t.ID}`)
                    .setEmoji("<:lb4:1113897384909484102>")
                    .setLabel("Alterar Cor Button")
                    .setStyle(ButtonStyle.Secondary),
                  new ButtonBuilder()
                    .setCustomId(`voltar-${t.ID}`)
                    .setEmoji("<:lb7:1113897476651499620>")
                    .setLabel("Voltar")
                    .setStyle(ButtonStyle.Danger)
                ),
              ],
            });
          });
        }
      }

      if (interaction.customId === `atualizar-${t.ID}`) {
        interaction.deferUpdate({});

        const msgId = t.data.msgId;
        const channel = interaction.guild.channels.cache.get(t.data.channelId);

        const embed = new EmbedBuilder()
          .setTitle(
            ` ${
              ticketsB.get(`${t.ID}.configs.titulo`) ||
              `${client.user.username} | ${interaction.guild.name} | Sistema de Ticket`
            }`
          )
          .setDescription(
            `${
              ticketsB.get(`${t.ID}.configs.descricao`) ||
              `:arrow_forward: Clique abaixo para abrir um TICKET na categoria \`\`Não configurado ainda...\`\``
            }`
          );

        if (ticketsB.get(`${t.ID}.configs.banner`)) {
          embed.setImage(ticketsB.get(`${t.ID}.configs.banner`));
        }

        if (ticketsB.get(`${t.ID}.configs.miniatura`)) {
          embed.setThumbnail(ticketsB.get(`${t.ID}.configs.miniatura`));
        }

        let buttonStyle;

        const color = ticketsB.get(`${t.ID}.buttonConfig.color`);

        if (color === "Azul") {
          buttonStyle = ButtonStyle.Primary;
        } else if (color === "Vermelho") {
          buttonStyle = ButtonStyle.Danger;
        } else if (color === "Verde") {
          buttonStyle = ButtonStyle.Success;
        } else if (color === "Cinza") {
          buttonStyle = ButtonStyle.Secondary;
        }

        if (buttonStyle) {
          channel.messages.fetch(msgId).then(async (msg) => {
            await msg.edit({
              embeds: [embed],
              components: [
                new ActionRowBuilder().addComponents(
                  new ButtonBuilder()
                    .setCustomId(`abrirTicket-${t.ID}`)
                    .setLabel(
                      `${
                        ticketsB.get(`${t.ID}.buttonConfig.label`) ||
                        "Abrir Ticket"
                      }`
                    )
                    .setEmoji(
                      `${ticketsB.get(`${t.ID}.buttonConfig.emoji`) || "👋"}`
                    )
                    .setStyle(buttonStyle)
                ),
              ],
            });
          });
        } else {
          console.error("Estilo de botão inválido:", color);
        }
      }

      if (interaction.customId === `selCategoria-${t.ID}`) {
        const configsAv = ticketsB.get(`${t.ID}.configsAv`);

        if (configsAv && configsAv.length > 0) {
          const config = configsAv[0];

          config.CategoriaSelecionada =
            config.CategoriaSelecionada === "Ligado" ? "Desligado" : "Ligado";

          ticketsB.set(`${t.ID}.configsAv[0]`, config);
        }

        interaction.update({
          embeds: [
            new EmbedBuilder()
              .setTitle(`${client.user.username} | Gerenciar Ticket`)
              .setFooter({
                text: `${client.user.username} - Todos os direitos reservados.`,
                iconURL: client.user.avatarURL(),
              })
              .setDescription(
                `Escolha abaixo qual das configurações avançadas deseja alterar.\n\nSistema De Modal(Perguntas) - \`\`${ticketsB.get(
                  `${t.ID}.configsAv.[0].SistemaModal`
                )}\`\`\nSistema de Protocolo(Visual) - \`\`${ticketsB.get(
                  `${t.ID}.configsAv.[0].SistemaProtocolo`
                )}\`\`\n\nCategoria Selecionada - \`\`${ticketsB.get(
                  `${t.ID}.configsAv.[0].CategoriaSelecionada`
                )}\`\``
              ),
          ],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`altButton-${t.ID}`)
                .setEmoji("<:lb4:1113897384909484102>")
                .setLabel("Alterar Button")
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`configCargo-${t.ID}`)
                .setEmoji("<:InfoLost7:1106003706467590175>")
                .setLabel("Configurar Cargos")
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`motivoOnOff-${t.ID}`)
                .setEmoji("<:TeamLostt7:1106818257484255232>")
                .setLabel("Motivo da Abertura (ON/OFF)")
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`selCategoria-${t.ID}`)
                .setEmoji("<:FixLost7:1105692591820898344>")
                .setLabel("Selecionar uma Categoria")
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`protocoloOnOff-${t.ID}`)
                .setEmoji("<:pastalosts22:1080325485101338695>")
                .setLabel("Sistema de Protocolo (ON/OFF)")
                .setStyle(ButtonStyle.Secondary)
            ),
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`voltar-${t.ID}`)
                .setEmoji("<:lb7:1113897476651499620>")
                .setLabel("Voltar")
                .setStyle(ButtonStyle.Danger)
            ),
          ],
        });
      }

      if (interaction.customId === `protocoloOnOff-${t.ID}`) {
        const configsAv = ticketsB.get(`${t.ID}.configsAv`);

        if (configsAv && configsAv.length > 0) {
          const config = configsAv[0];

          config.SistemaProtocolo =
            config.SistemaProtocolo === "Ligado" ? "Desligado" : "Ligado";

          ticketsB.set(`${t.ID}.configsAv[0]`, config);
        }

        interaction.update({
          embeds: [
            new EmbedBuilder()
              .setTitle(`${client.user.username} | Gerenciar Ticket`)
              .setFooter({
                text: `${client.user.username} - Todos os direitos reservados.`,
                iconURL: client.user.avatarURL(),
              })
              .setDescription(
                `Escolha abaixo qual das configurações avançadas deseja alterar.\n\nSistema De Modal(Perguntas) - \`\`${ticketsB.get(
                  `${t.ID}.configsAv.[0].SistemaModal`
                )}\`\`\nSistema de Protocolo(Visual) - \`\`${ticketsB.get(
                  `${t.ID}.configsAv.[0].SistemaProtocolo`
                )}\`\`\n\nCategoria Selecionada - \`\`${ticketsB.get(
                  `${t.ID}.configsAv.[0].CategoriaSelecionada`
                )}\`\``
              ),
          ],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`altButton-${t.ID}`)
                .setEmoji("<:lb4:1113897384909484102>")
                .setLabel("Alterar Button")
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`configCargo-${t.ID}`)
                .setEmoji("<:InfoLost7:1106003706467590175>")
                .setLabel("Configurar Cargos")
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`motivoOnOff-${t.ID}`)
                .setEmoji("<:TeamLostt7:1106818257484255232>")
                .setLabel("Motivo da Abertura (ON/OFF)")
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`selCategoria-${t.ID}`)
                .setEmoji("<:FixLost7:1105692591820898344>")
                .setLabel("Selecionar uma Categoria")
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`protocoloOnOff-${t.ID}`)
                .setEmoji("<:pastalosts22:1080325485101338695>")
                .setLabel("Sistema de Protocolo (ON/OFF)")
                .setStyle(ButtonStyle.Secondary)
            ),
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`voltar-${t.ID}`)
                .setEmoji("<:lb7:1113897476651499620>")
                .setLabel("Voltar")
                .setStyle(ButtonStyle.Danger)
            ),
          ],
        });
      }

      if (interaction.customId === `motivoOnOff-${t.ID}`) {
        const configsAv = ticketsB.get(`${t.ID}.configsAv`);

        if (configsAv && configsAv.length > 0) {
          const config = configsAv[0];

          config.SistemaModal =
            config.SistemaModal === "Ligado" ? "Desligado" : "Ligado";

          ticketsB.set(`${t.ID}.configsAv[0]`, config);
        }

        interaction.update({
          embeds: [
            new EmbedBuilder()
              .setTitle(`${client.user.username} | Gerenciar Ticket`)
              .setFooter({
                text: `${client.user.username} - Todos os direitos reservados.`,
                iconURL: client.user.avatarURL(),
              })
              .setDescription(
                `Escolha abaixo qual das configurações avançadas deseja alterar.\n\nSistema De Modal(Perguntas) - \`\`${ticketsB.get(
                  `${t.ID}.configsAv.[0].SistemaModal`
                )}\`\`\nSistema de Protocolo(Visual) - \`\`${ticketsB.get(
                  `${t.ID}.configsAv.[0].SistemaProtocolo`
                )}\`\`\n\nCategoria Selecionada - \`\`${ticketsB.get(
                  `${t.ID}.configsAv.[0].CategoriaSelecionada`
                )}\`\``
              ),
          ],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`altButton-${t.ID}`)
                .setEmoji("<:lb4:1113897384909484102>")
                .setLabel("Alterar Button")
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`configCargo-${t.ID}`)
                .setEmoji("<:InfoLost7:1106003706467590175>")
                .setLabel("Configurar Cargos")
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`motivoOnOff-${t.ID}`)
                .setEmoji("<:TeamLostt7:1106818257484255232>")
                .setLabel("Motivo da Abertura (ON/OFF)")
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`selCategoria-${t.ID}`)
                .setEmoji("<:FixLost7:1105692591820898344>")
                .setLabel("Selecionar uma Categoria")
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`protocoloOnOff-${t.ID}`)
                .setEmoji("<:pastalosts22:1080325485101338695>")
                .setLabel("Sistema de Protocolo (ON/OFF)")
                .setStyle(ButtonStyle.Secondary)
            ),
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`voltar-${t.ID}`)
                .setEmoji("<:lb7:1113897476651499620>")
                .setLabel("Voltar")
                .setStyle(ButtonStyle.Danger)
            ),
          ],
        });
      }

      if (interaction.customId === `configAv-${t.ID}`) {
        interaction.update({
          embeds: [
            new EmbedBuilder()
              .setTitle(`${client.user.username} | Gerenciar Ticket`)
              .setFooter({
                text: `${client.user.username} - Todos os direitos reservados.`,
                iconURL: client.user.avatarURL(),
              })
              .setDescription(
                `Escolha abaixo qual das configurações avançadas deseja alterar.\n\nSistema De Modal(Perguntas) - \`\`${ticketsB.get(
                  `${t.ID}.configsAv.[0].SistemaModal`
                )}\`\`\nSistema de Protocolo(Visual) - \`\`${ticketsB.get(
                  `${t.ID}.configsAv.[0].SistemaProtocolo`
                )}\`\`\n\nCategoria Selecionada - \`\`${ticketsB.get(
                  `${t.ID}.configsAv.[0].CategoriaSelecionada`
                )}\`\``
              ),
          ],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`altButton-${t.ID}`)
                .setEmoji("<:lb4:1113897384909484102>")
                .setLabel("Alterar Button")
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`configCargo-${t.ID}`)
                .setEmoji("<:InfoLost7:1106003706467590175>")
                .setLabel("Configurar Cargos")
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`motivoOnOff-${t.ID}`)
                .setEmoji("<:TeamLostt7:1106818257484255232>")
                .setLabel("Motivo da Abertura (ON/OFF)")
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`selCategoria-${t.ID}`)
                .setEmoji("<:FixLost7:1105692591820898344>")
                .setLabel("Selecionar uma Categoria")
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId(`protocoloOnOff-${t.ID}`)
                .setEmoji("<:pastalosts22:1080325485101338695>")
                .setLabel("Sistema de Protocolo (ON/OFF)")
                .setStyle(ButtonStyle.Secondary)
            ),
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`voltar-${t.ID}`)
                .setEmoji("<:lb7:1113897476651499620>")
                .setLabel("Voltar")
                .setStyle(ButtonStyle.Danger)
            ),
          ],
        });
      }

      if (interaction.customId === `abrirTicket-${t.ID}`) {
        const tickets = createdTickesdb.all();

        for (const ticket of tickets) {
          const ticketInfo = ticket.data;
          const abertoPorId = ticketInfo.abertoPorId;

          if (abertoPorId === interaction.user.id) {
            return interaction.reply({
              content:
                "**❌ | Você já possui um ticket aberto, feche-o antes de abrir outro!**",
              ephemeral: true,
            });
          }
        }

        const categoriaAtiva =
          ticketsB.get(`${t.ID}.configsAv[0].CategoriaSelecionada`) ===
          "Ligado";
        const modalAtivo =
          ticketsB.get(`${t.ID}.configsAv[0].SistemaModal`) === "Ligado";
        const protocoloAtivo =
          ticketsB.get(`${t.ID}.configsAv[0].SistemaProtocolo`) === "Ligado";

        if (!categoriaAtiva && !modalAtivo) {
          const uuid = generateUUID();

          const channelName = protocoloAtivo
            ? `🎫・${interaction.user.username}-${uuid}`
            : `🎫・${interaction.user.username}`;

          const channelTopic = protocoloAtivo
            ? `<a:Lost82:1097620271818612766> ID do Membro · ${interaction.user.id} · <:TermosLost7:1098144396551147561> TicketID · ${uuid} · <:InfoLost7:1106003706467590175> Ticket Assumido · `
            : `<a:Lost82:1097620271818612766> ID do Membro · ${interaction.user.id} · <:InfoLost7:1106003706467590175> Ticket Assumido · `;

          await interaction.guild.channels
            .create({
              name: channelName,
              topic: channelTopic,
              parent: interaction.channel.parent,
              permissionOverwrites: [
                {
                  id: interaction.guild.id,
                  deny: [PermissionsBitField.Flags.ViewChannel],
                },
                {
                  id: interaction.user.id,
                  allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.AttachFiles,
                    PermissionsBitField.Flags.ReadMessageHistory,
                  ],
                },
              ],
            })
            .then(async (c) => {
              await interaction
                .reply({
                  embeds: [
                    new EmbedBuilder().setDescription(
                      `**_✅ | <@${interaction.user.id}>, seu TICKET foi aberto, use o botão abaixo para encontra-lo_**`
                    ),
                  ],
                  components: [
                    new ActionRowBuilder().addComponents(
                      new ButtonBuilder()
                        .setURL(
                          `https://discord.com/channels/${interaction.guild.id}/${c.id}`
                        )
                        .setEmoji("<:email:1137104275953156146>")
                        .setLabel("Ir para o Ticket")
                        .setStyle(ButtonStyle.Link)
                    ),
                  ],
                  ephemeral: true,
                })
                .then(() => {
                  const functionsConfig = ticketsB.get(`${t.ID}.functions[0]`);

                  const buttons = [
                    new ButtonBuilder()
                      .setCustomId("sairTicket")
                      .setEmoji("<:lb7:1113897476651499620>")
                      .setLabel("Sair do Canal")
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId("painelStaff")
                      .setEmoji("<:lb12:1113900537063145612>")
                      .setLabel("Painel Staff")
                      .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                      .setCustomId("painelMembro")
                      .setEmoji("<:InfoLost7:1106003706467590175>")
                      .setLabel("Painel Membro")
                      .setStyle(ButtonStyle.Secondary),
                  ];

                  if (functionsConfig.Assumir === "Desligado") {
                    buttons.push(
                      new ButtonBuilder()
                        .setCustomId("assumirTicket")
                        .setEmoji("<:verifedLost:1080325994428248174>")
                        .setLabel("Assumir Ticket")
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true)
                    );
                  } else if (functionsConfig.Assumir === "Ligado") {
                    buttons.push(
                      new ButtonBuilder()
                        .setCustomId("assumirTicket")
                        .setEmoji("<:verifedLost:1080325994428248174>")
                        .setLabel("Assumir Ticket")
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(false)
                    );
                  }

                  buttons.push(
                    new ButtonBuilder()
                      .setCustomId("finalizarTicket")
                      .setEmoji("<:LixoLost7:1106015127184085052>")
                      .setLabel("Finalizar Ticket")
                      .setStyle(ButtonStyle.Danger)
                  );

                  const ticket = interaction.guild.channels.cache.get(c.id);

                  createdTickesdb.set(
                    `${c.id}.abertoPor`,
                    interaction.user.username
                  );
                  createdTickesdb.set(
                    `${c.id}.abertoPorId`,
                    interaction.user.id
                  );
                  createdTickesdb.set(`${c.id}.assumido`, "Ningúem");
                  createdTickesdb.set(`${c.id}.ticketId`, uuid);
                  createdTickesdb.set(`${c.id}.channelId`, c.id);

                  ticket.send({
                    components: [new ActionRowBuilder().addComponents(buttons)],
                    embeds: [
                      new EmbedBuilder().setDescription(
                        `\`\`TICKET ${interaction.user.username}\`\` aberto por: <@${interaction.user.id}>\nCaso queira sair do canal, clique em **Sair do Canal**\n\n📒 Assunto:\n\`\`\`A tratar abaixo\`\`\``
                      ),
                    ],
                    content: `<@${interaction.user.id}>`,
                  });
                });
            });
        } else if (categoriaAtiva && !modalAtivo) {
          const ticketmenu = new StringSelectMenuBuilder()
            .setCustomId(`abrirTicketMenu-${t.ID}`)
            .setPlaceholder("▶ Selecione uma categoria:");

          const categorias = categoriaSelecionada.get(`categorias`);

          if (categorias) {
            const listaCategorias = Object.values(categorias);

            listaCategorias.forEach((categoria) => {
              ticketmenu.addOptions(
                new StringSelectMenuOptionBuilder()
                  .setLabel(`${categoria.nome.toUpperCase()}`)
                  .setDescription(`${categoria.descricao}`)
                  .setEmoji(`${categoria.emoji}`)
                  .setValue(`${categoria.value}`)
              );
            });
          } else {
            ticketmenu.addOptions(
              new StringSelectMenuOptionBuilder()
                .setDescription("Nenhuma categoria disponivel")
                .setValue(".")
                .setEmoji("❌")
            );
          }

          const menu = new ActionRowBuilder().addComponents(ticketmenu);

          interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setTitle(`\`\`📃 SELECIONE UMA CATEGORIA\`\``)
                .setDescription(
                  `_Selecione o tipo de TICKET que você deseja criar no **MENU** abaixo:_`
                ),
            ],
            components: [menu],
            ephemeral: true,
          });
        } else if (modalAtivo && !categoriaAtiva) {
          const modal = new ModalBuilder()
            .setTitle("Descreva o motivo do contato:")
            .setCustomId(`motivoModal-${t.ID}`);

          const motivo = new TextInputBuilder()
            .setCustomId("motivo")
            .setLabel("MOTIVO DO CONTATO:")
            .setPlaceholder("📃 Escreva aqui")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

          const row = new ActionRowBuilder().addComponents(motivo);
          modal.addComponents(row);
          interaction.showModal(modal);
        } else if (categoriaAtiva && modalAtivo) {
          const ticketmenu = new StringSelectMenuBuilder()
            .setCustomId(`abrirTicketMenu-${t.ID}`)
            .setPlaceholder("▶ Selecione uma categoria:");

          const categorias = categoriaSelecionada.get(`categorias`);

          if (categorias) {
            const listaCategorias = Object.values(categorias);

            listaCategorias.forEach((categoria) => {
              ticketmenu.addOptions(
                new StringSelectMenuOptionBuilder()
                  .setLabel(`${categoria.nome.toUpperCase()}`)
                  .setDescription(`${categoria.descricao}`)
                  .setEmoji(`${categoria.emoji}`)
                  .setValue(`${categoria.value}`)
              );
            });
          } else {
            ticketmenu.addOptions(
              new StringSelectMenuOptionBuilder()
                .setDescription("Nenhuma categoria disponivel")
                .setValue(".")
                .setEmoji("❌")
            );
          }

          const menu = new ActionRowBuilder().addComponents(ticketmenu);

          interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setTitle(`\`\`📃 SELECIONE UMA CATEGORIA\`\``)
                .setDescription(
                  `_Selecione o tipo de TICKET que você deseja criar no **MENU** abaixo:_`
                ),
            ],
            components: [menu],
            ephemeral: true,
          });
        }
      }

      if (interaction.customId === `abrirTicketMenu-${t.ID}`) {
        const tickets = createdTickesdb.all();

        for (const ticket of tickets) {
          const ticketInfo = ticket.data;
          const abertoPorId = ticketInfo.abertoPorId;

          if (abertoPorId === interaction.user.id) {
            return interaction.reply({
              content:
                "**❌ | Você já possui um ticket aberto, feche-o antes de abrir outro!**",
              ephemeral: true,
            });
          }
        }

        const modalAtivo =
          ticketsB.get(`${t.ID}.configsAv[0].SistemaModal`) === "Ligado";
        const protocoloAtivo =
          ticketsB.get(`${t.ID}.configsAv[0].SistemaProtocolo`) === "Ligado";

        if (!modalAtivo && !protocoloAtivo) {
          const channelName = `🎫・${interaction.user.username}`;

          return interaction.guild.channels
            .create({
              name: channelName,
              topic: `<a:Lost82:1097620271818612766> ID do Membro · ${interaction.user.id} · <:InfoLost7:1106003706467590175> Ticket Assumido · `,
              parent: interaction.channel.parent,
              permissionOverwrites: [
                {
                  id: interaction.guild.id,
                  deny: [PermissionsBitField.Flags.ViewChannel],
                },
                {
                  id: interaction.user.id,
                  allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.AttachFiles,
                    PermissionsBitField.Flags.ReadMessageHistory,
                  ],
                },
              ],
            })
            .then(async (c) => {
              createdTickesdb.set(
                `${c.id}.abertoPor`,
                interaction.user.username
              );
              createdTickesdb.set(
                `${c.id}.abertoPor`,
                interaction.user.username
              );
              createdTickesdb.set(`${c.id}.abertoPorId`, interaction.user.id);
              createdTickesdb.set(`${c.id}.assumido`, "Ningúem");
              createdTickesdb.set(`${c.id}.ticketId`, uuid);
              createdTickesdb.set(`${c.id}.channelId`, c.id);

              await interaction
                .reply({
                  embeds: [
                    new EmbedBuilder().setDescription(
                      `**_✅ | <@${interaction.user.id}>, seu TICKET foi aberto, use o botão abaixo para encontra-lo_**`
                    ),
                  ],
                  components: [
                    new ActionRowBuilder().addComponents(
                      new ButtonBuilder()
                        .setURL(
                          `https://discord.com/channels/${interaction.guild.id}/${c.id}`
                        )
                        .setEmoji("<:email:1137104275953156146>")
                        .setLabel("Ir para o Ticket")
                        .setStyle(ButtonStyle.Link)
                    ),
                  ],
                  ephemeral: true,
                })
                .then(() => {
                  const functionsConfig = ticketsB.get(`${t.ID}.functions[0]`);

                  const buttons = [
                    new ButtonBuilder()
                      .setCustomId("sairTicket")
                      .setEmoji("<:lb7:1113897476651499620>")
                      .setLabel("Sair do Canal")
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId("painelStaff")
                      .setEmoji("<:lb12:1113900537063145612>")
                      .setLabel("Painel Staff")
                      .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                      .setCustomId("painelMembro")
                      .setEmoji("<:InfoLost7:1106003706467590175>")
                      .setLabel("Painel Membro")
                      .setStyle(ButtonStyle.Secondary),
                  ];

                  if (functionsConfig.Assumir === "Desligado") {
                    buttons.push(
                      new ButtonBuilder()
                        .setCustomId("assumirTicket")
                        .setEmoji("<:verifedLost:1080325994428248174>")
                        .setLabel("Assumir Ticket")
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true)
                    );
                  } else if (functionsConfig.Assumir === "Ligado") {
                    buttons.push(
                      new ButtonBuilder()
                        .setCustomId("assumirTicket")
                        .setEmoji("<:verifedLost:1080325994428248174>")
                        .setLabel("Assumir Ticket")
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(false)
                    );
                  }

                  buttons.push(
                    new ButtonBuilder()
                      .setCustomId("finalizarTicket")
                      .setEmoji("<:LixoLost7:1106015127184085052>")
                      .setLabel("Finalizar Ticket")
                      .setStyle(ButtonStyle.Danger)
                  );

                  const ticket = interaction.guild.channels.cache.get(c.id);

                  ticket.send({
                    components: [new ActionRowBuilder().addComponents(buttons)],
                    embeds: [ticketChannelEmbed],
                    content: `<@${interaction.user.id}>`,
                  });
                });
            });
        }

        if (modalAtivo && !protocoloAtivo) {
          const modal = new ModalBuilder()
            .setTitle("Descreva o motivo do contato:")
            .setCustomId(`motivoModal-${t.ID}`);

          const motivo = new TextInputBuilder()
            .setCustomId("motivo")
            .setLabel("MOTIVO DO CONTATO:")
            .setPlaceholder("📃 Escreva aqui")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

          const row = new ActionRowBuilder().addComponents(motivo);
          modal.addComponents(row);
          interaction.showModal(modal);
        } else if (!modalAtivo && protocoloAtivo) {
          const uuid = generateUUID();

          const channelName = `🎫・${interaction.user.username}-${uuid}`;

          await interaction.guild.channels
            .create({
              name: channelName,
              topic: `<a:Lost82:1097620271818612766> ID do Membro · ${interaction.user.id} · <:TermosLost7:1098144396551147561> TicketID · ${uuid} · <:InfoLost7:1106003706467590175> Ticket Assumido · `,
              parent: interaction.channel.parent,
              permissionOverwrites: [
                {
                  id: interaction.guild.id,
                  deny: [PermissionsBitField.Flags.ViewChannel],
                },
                {
                  id: interaction.user.id,
                  allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.AttachFiles,
                    PermissionsBitField.Flags.ReadMessageHistory,
                  ],
                },
              ],
            })
            .then(async (c) => {
              createdTickesdb.set(
                `${c.id}.abertoPor`,
                interaction.user.username
              );
              createdTickesdb.set(
                `${c.id}.abertoPor`,
                interaction.user.username
              );
              createdTickesdb.set(`${c.id}.abertoPorId`, interaction.user.id);
              createdTickesdb.set(`${c.id}.assumido`, "Ningúem");
              createdTickesdb.set(`${c.id}.ticketId`, uuid);
              createdTickesdb.set(`${c.id}.channelId`, c.id);

              await interaction
                .reply({
                  embeds: [
                    new EmbedBuilder().setDescription(
                      `**_✅ | <@${interaction.user.id}>, seu TICKET foi aberto, use o botão abaixo para encontra-lo_**`
                    ),
                  ],
                  components: [
                    new ActionRowBuilder().addComponents(
                      new ButtonBuilder()
                        .setURL(
                          `https://discord.com/channels/${interaction.guild.id}/${c.id}`
                        )
                        .setEmoji("<:email:1137104275953156146>")
                        .setLabel("Ir para o Ticket")
                        .setStyle(ButtonStyle.Link)
                    ),
                  ],
                  ephemeral: true,
                })
                .then(() => {
                  const functionsConfig = ticketsB.get(`${t.ID}.functions[0]`);

                  const buttons = [
                    new ButtonBuilder()
                      .setCustomId("sairTicket")
                      .setEmoji("<:lb7:1113897476651499620>")
                      .setLabel("Sair do Canal")
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId("painelStaff")
                      .setEmoji("<:lb12:1113900537063145612>")
                      .setLabel("Painel Staff")
                      .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                      .setCustomId("painelMembro")
                      .setEmoji("<:InfoLost7:1106003706467590175>")
                      .setLabel("Painel Membro")
                      .setStyle(ButtonStyle.Secondary),
                  ];

                  if (functionsConfig.Assumir === "Desligado") {
                    buttons.push(
                      new ButtonBuilder()
                        .setCustomId("assumirTicket")
                        .setEmoji("<:verifedLost:1080325994428248174>")
                        .setLabel("Assumir Ticket")
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true)
                    );
                  } else if (functionsConfig.Assumir === "Ligado") {
                    buttons.push(
                      new ButtonBuilder()
                        .setCustomId("assumirTicket")
                        .setEmoji("<:verifedLost:1080325994428248174>")
                        .setLabel("Assumir Ticket")
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(false)
                    );
                  }

                  buttons.push(
                    new ButtonBuilder()
                      .setCustomId("finalizarTicket")
                      .setEmoji("<:LixoLost7:1106015127184085052>")
                      .setLabel("Finalizar Ticket")
                      .setStyle(ButtonStyle.Danger)
                  );

                  const ticket = interaction.guild.channels.cache.get(c.id);

                  ticket.send({
                    components: [new ActionRowBuilder().addComponents(buttons)],
                    embeds: [ticketChannelEmbed],
                    content: `<@${interaction.user.id}>`,
                  });
                });
            });
        } else if (modalAtivo && protocoloAtivo) {
          const modal = new ModalBuilder()
            .setTitle("Descreva o motivo do contato:")
            .setCustomId(`motivoModal-${t.ID}`);

          const motivo = new TextInputBuilder()
            .setCustomId("motivo")
            .setLabel("MOTIVO DO CONTATO:")
            .setPlaceholder("📃 Escreva aqui")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

          const row = new ActionRowBuilder().addComponents(motivo);
          modal.addComponents(row);
          interaction.showModal(modal);
        } else {
          const uuid = generateUUID();

          const channelName = `🎫・${interaction.user.username}-${uuid}`;

          await interaction.guild.channels
            .create({
              name: channelName,
              topic: `<a:Lost82:1097620271818612766> ID do Membro · ${interaction.user.id} · <:TermosLost7:1098144396551147561> TicketID · ${uuid} · <:InfoLost7:1106003706467590175> Ticket Assumido · `,
              parent: interaction.channel.parent,
              permissionOverwrites: [
                {
                  id: interaction.guild.id,
                  deny: [PermissionsBitField.Flags.ViewChannel],
                },
                {
                  id: interaction.user.id,
                  allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.AttachFiles,
                    PermissionsBitField.Flags.ReadMessageHistory,
                  ],
                },
              ],
            })
            .then(async (c) => {
              createdTickesdb.set(
                `${c.id}.abertoPor`,
                interaction.user.username
              );
              createdTickesdb.set(
                `${c.id}.abertoPor`,
                interaction.user.username
              );
              createdTickesdb.set(`${c.id}.abertoPorId`, interaction.user.id);
              createdTickesdb.set(`${c.id}.assumido`, "Ningúem");
              createdTickesdb.set(`${c.id}.ticketId`, uuid);
              createdTickesdb.set(`${c.id}.channelId`, c.id);

              await interaction
                .reply({
                  embeds: [
                    new EmbedBuilder().setDescription(
                      `**_✅ | <@${interaction.user.id}>, seu TICKET foi aberto, use o botão abaixo para encontra-lo_**`
                    ),
                  ],
                  components: [
                    new ActionRowBuilder().addComponents(
                      new ButtonBuilder()
                        .setURL(
                          `https://discord.com/channels/${interaction.guild.id}/${c.id}`
                        )
                        .setEmoji("<:email:1137104275953156146>")
                        .setLabel("Ir para o Ticket")
                        .setStyle(ButtonStyle.Link)
                    ),
                  ],
                  ephemeral: true,
                })
                .then(() => {
                  const ticket = interaction.guild.channels.cache.get(c.id);

                  const functionsConfig = ticketsB.get(`${t.ID}.functions[0]`);

                  const buttons = [
                    new ButtonBuilder()
                      .setCustomId("sairTicket")
                      .setEmoji("<:lb7:1113897476651499620>")
                      .setLabel("Sair do Canal")
                      .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                      .setCustomId("painelStaff")
                      .setEmoji("<:lb12:1113900537063145612>")
                      .setLabel("Painel Staff")
                      .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                      .setCustomId("painelMembro")
                      .setEmoji("<:InfoLost7:1106003706467590175>")
                      .setLabel("Painel Membro")
                      .setStyle(ButtonStyle.Secondary),
                  ];

                  if (functionsConfig.Assumir === "Desligado") {
                    buttons.push(
                      new ButtonBuilder()
                        .setCustomId("assumirTicket")
                        .setEmoji("<:verifedLost:1080325994428248174>")
                        .setLabel("Assumir Ticket")
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true)
                    );
                  } else if (functionsConfig.Assumir === "Ligado") {
                    buttons.push(
                      new ButtonBuilder()
                        .setCustomId("assumirTicket")
                        .setEmoji("<:verifedLost:1080325994428248174>")
                        .setLabel("Assumir Ticket")
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(false)
                    );
                  }

                  buttons.push(
                    new ButtonBuilder()
                      .setCustomId("finalizarTicket")
                      .setEmoji("<:LixoLost7:1106015127184085052>")
                      .setLabel("Finalizar Ticket")
                      .setStyle(ButtonStyle.Danger)
                  );

                  ticket.send({
                    components: [new ActionRowBuilder().addComponents(buttons)],
                    embeds: [ticketChannelEmbed],
                    content: `<@${interaction.user.id}>`,
                  });
                });
            });
        }
      }

      if (interaction.customId === `motivoModal-${t.ID}`) {
        const tickets = createdTickesdb.all();

        for (const ticket of tickets) {
          const ticketInfo = ticket.data;
          const abertoPorId = ticketInfo.abertoPorId;

          if (abertoPorId === interaction.user.id) {
            return interaction.reply({
              content:
                "**❌ | Você já possui um ticket aberto, feche-o antes de abrir outro!**",
              ephemeral: true,
            });
          }
        }

        const motivo = interaction.fields.getTextInputValue("motivo");

        const channelName = `🎫・${interaction.user.username}`;

        await interaction.guild.channels
          .create({
            name: channelName,
            topic: `<a:Lost82:1097620271818612766> ID do Membro · ${interaction.user.id} · <:InfoLost7:1106003706467590175> Ticket Assumido · `,
            parent: interaction.channel.parent,
            permissionOverwrites: [
              {
                id: interaction.guild.id,
                deny: [PermissionsBitField.Flags.ViewChannel],
              },
              {
                id: interaction.user.id,
                allow: [
                  PermissionsBitField.Flags.ViewChannel,
                  PermissionsBitField.Flags.SendMessages,
                  PermissionsBitField.Flags.AttachFiles,
                  PermissionsBitField.Flags.ReadMessageHistory,
                ],
              },
            ],
          })
          .then(async (c) => {
            createdTickesdb.set(`${c.id}.abertoPor`, interaction.user.username);
            createdTickesdb.set(`${c.id}.abertoPorId`, interaction.user.id);
            createdTickesdb.set(`${c.id}.assumido`, "Ningúem");
            createdTickesdb.set(`${c.id}.ticketId`, uuid);
            createdTickesdb.set(`${c.id}.channelId`, c.id);

            await interaction
              .reply({
                embeds: [
                  new EmbedBuilder().setDescription(
                    `**_✅ | <@${interaction.user.id}>, seu TICKET foi aberto, use o botão abaixo para encontra-lo_**`
                  ),
                ],
                components: [
                  new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                      .setURL(
                        `https://discord.com/channels/${interaction.guild.id}/${c.id}`
                      )
                      .setEmoji("<:email:1137104275953156146>")
                      .setLabel("Ir para o Ticket")
                      .setStyle(ButtonStyle.Link)
                  ),
                ],
                ephemeral: true,
              })
              .then(() => {
                const functionsConfig = ticketsB.get(`${t.ID}.functions[0]`);

                const buttons = [
                  new ButtonBuilder()
                    .setCustomId("sairTicket")
                    .setEmoji("<:lb7:1113897476651499620>")
                    .setLabel("Sair do Canal")
                    .setStyle(ButtonStyle.Primary),
                  new ButtonBuilder()
                    .setCustomId("painelStaff")
                    .setEmoji("<:lb12:1113900537063145612>")
                    .setLabel("Painel Staff")
                    .setStyle(ButtonStyle.Secondary),
                  new ButtonBuilder()
                    .setCustomId("painelMembro")
                    .setEmoji("<:InfoLost7:1106003706467590175>")
                    .setLabel("Painel Membro")
                    .setStyle(ButtonStyle.Secondary),
                ];

                if (functionsConfig.Assumir === "Desligado") {
                  buttons.push(
                    new ButtonBuilder()
                      .setCustomId("assumirTicket")
                      .setEmoji("<:verifedLost:1080325994428248174>")
                      .setLabel("Assumir Ticket")
                      .setStyle(ButtonStyle.Secondary)
                      .setDisabled(true)
                  );
                } else if (functionsConfig.Assumir === "Ligado") {
                  buttons.push(
                    new ButtonBuilder()
                      .setCustomId("assumirTicket")
                      .setEmoji("<:verifedLost:1080325994428248174>")
                      .setLabel("Assumir Ticket")
                      .setStyle(ButtonStyle.Secondary)
                      .setDisabled(false)
                  );
                }

                buttons.push(
                  new ButtonBuilder()
                    .setCustomId("finalizarTicket")
                    .setEmoji("<:LixoLost7:1106015127184085052>")
                    .setLabel("Finalizar Ticket")
                    .setStyle(ButtonStyle.Danger)
                );

                const ticket = interaction.guild.channels.cache.get(c.id);

                ticket.send({
                  components: [new ActionRowBuilder().addComponents(buttons)],
                  embeds: [
                    new EmbedBuilder().setDescription(
                      `\`\`TICKET ${interaction.user.username}\`\` aberto por: <@${interaction.user.id}>\nCaso queira sair do canal, clique em **Sair do Canal**\n\n📒 Assunto:\n\`\`\`${motivo}\`\`\``
                    ),
                  ],
                  content: `<@${interaction.user.id}>`,
                });
              });
          });
      }

      if (interaction.customId === `painelMembro`) {
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

        const functionsConfig = ticketsB.get(`${t.ID}.functions[0]`);

        const options = [];

        if (functionsConfig.Poke === "Ligado") {
          options.push(
            new StringSelectMenuOptionBuilder()
              .setLabel("Enviar um Poke (Assumiu)")
              .setEmoji("<a:lb12:1115435692961579140>")
              .setValue("pokeTicketStaff")
          );
        }

        if (functionsConfig.GerenciarMembro === "Ligado") {
          options.push(
            new StringSelectMenuOptionBuilder()
              .setLabel("Adicionar Membro")
              .setEmoji("<:InfoLost7:1106003706467590175>")
              .setValue("addMember"),
            new StringSelectMenuOptionBuilder()
              .setLabel("Remover Membro")
              .setEmoji("<:InfoLost7:1106003706467590175>")
              .setValue("removeMember")
          );
        }

        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId("painelMembroMenu")
          .setPlaceholder("Seleciona uma opção...");

        if (options.length > 0) {
          selectMenu.addOptions(options);
        } else {
          selectMenu.setOptions(
            new StringSelectMenuOptionBuilder()
              .setLabel("Nenhuma funcionalidade disponível")
              .setValue("nenhumaFuncionalidade")
          );
        }

        interaction.reply({
          ephemeral: true,
          components: [new ActionRowBuilder().addComponents(selectMenu)],
        });
      }

      if (interaction.customId === "addUser") {
        const userId = interaction.values[0];

        await interaction.update({});

        interaction.channel.permissionOverwrites.edit(userId, {
          ViewChannel: true,
        });
      }

      if (interaction.customId === "removeUser") {
        const userId = interaction.values[0];

        await interaction.update({});

        interaction.channel.permissionOverwrites.edit(userId, {
          ViewChannel: false,
        });
      }

      if (interaction.customId === "painelMembroMenu") {
        const func = interaction.values[0];

        if (func === "removeMember") {
          await interaction.update({});

          interaction.followUp({
            components: [
              new ActionRowBuilder().addComponents(
                new UserSelectMenuBuilder()
                  .setCustomId("removeUser")
                  .setPlaceholder("Selecione um usuario")
              ),
            ],
            ephemeral: true,
          });
        }

        if (func === "addMember") {
          await interaction.update({});

          interaction.followUp({
            components: [
              new ActionRowBuilder().addComponents(
                new UserSelectMenuBuilder()
                  .setCustomId("addUser")
                  .setPlaceholder("Selecione um usuario")
              ),
            ],
            ephemeral: true,
          });
        }

        if (func === "pokeTicketStaff") {
          await interaction.update({});

          const staff = interaction.guild.members.cache.get(
            createdTickesdb.get(`${interaction.channel.id}.assumido`)
          );

          return staff.send({
            embeds: [
              new EmbedBuilder()
                .setTitle(`\`\`📡 ${interaction.guild.name} - NOTIFICAÇÃO\`\``)
                .setDescription(
                  `_Olá **${staff}**, o TICKET que você assumiu está pendente, para acessar seu ticket, clique no botão abaixo:_`
                ),
            ],
            components: [
              new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setStyle(ButtonStyle.Link)
                  .setLabel("Ir para o Ticket")
                  .setURL(
                    `https://discord.com/channels/${interaction.guild.id}/${interaction.channel.id}`
                  )
              ),
            ],
          });
        }
      }

      if (interaction.customId === `painelStaff`) {
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

        if (
          !interaction.member.permissions.has(
            PermissionsBitField.Flags.Administrator
          )
        ) {
          const noPerm = new EmbedBuilder().setDescription(
            `📌・Opps! **${interaction.user.username}** parece que você não possui permissão para executar isso.`
          );

          return interaction.reply({
            embeds: [noPerm],
            ephemeral: true,
          });
        }

        const functionsConfig = ticketsB.get(`${t.ID}.functions[0]`);

        const options = [];

        if (functionsConfig.CriarCall === "Ligado") {
          options.push(
            new StringSelectMenuOptionBuilder()
              .setLabel("Criar uma Call")
              .setEmoji("<:Lost7Call:1106002914281009322>")
              .setValue("callTicket")
          );
        }

        if (functionsConfig.Poke === "Ligado") {
          options.push(
            new StringSelectMenuOptionBuilder()
              .setLabel("Enviar um Poke")
              .setEmoji("<a:lb12:1115435692961579140>")
              .setValue("pokeTicket")
          );
        }

        if (functionsConfig.Renomear === "Ligado") {
          options.push(
            new StringSelectMenuOptionBuilder()
              .setLabel("Renomear Ticket")
              .setEmoji("<:lb4:1113897384909484102>")
              .setValue("renameTicket")
          );
        }

        if (functionsConfig.Pagamentos === "Ligado") {
          options.push(
            new StringSelectMenuOptionBuilder()
              .setLabel("Pagamentos")
              .setEmoji("<:lb11:1113898808519172168>")
              .setValue("payTicket")
          );
        }

        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId("painelStaffMenu")
          .setPlaceholder("Seleciona uma opção...");

        if (options.length > 0) {
          selectMenu.addOptions(options);
        } else {
          selectMenu.setOptions(
            new StringSelectMenuOptionBuilder()
              .setLabel("Nenhuma funcionalidade disponível")
              .setValue("nenhumaFuncionalidade")
          );
        }

        interaction.reply({
          ephemeral: true,
          components: [new ActionRowBuilder().addComponents(selectMenu)],
        });
      }

      if (interaction.customId === "renameModal") {
        const nome = interaction.fields.getTextInputValue("ticketName");

        interaction.channel.setName(nome);

        await interaction.reply({
          content: "**✅ | Ticket renomeado com sucesso.**",
          ephemeral: true,
        });
      }

      if (interaction.customId === "payModal") {
        await interaction.deferUpdate();

        const valor = interaction.fields.getTextInputValue("valor");
        const produto = interaction.fields.getTextInputValue("produto");

        const email = "qualqueremail@gmail.com";
        const payment_data = {
          transaction_amount: Number(valor),
          description: produto.nome,
          payment_method_id: "pix",
          payer: {
            email,
            first_name: interaction.user.username,
          },
        };

        mercadopago.payment.create(payment_data).then(async (data) => {
          const qrcode =
            data.body.point_of_interaction.transaction_data.qr_code_base64;

          const collectorButtons =
            interaction.channel.createMessageComponentCollector({
              componentType: ComponentType.Button,
              filter: (i) => i.customId === "copia_cola",
            });

          collectorButtons.on("collect", async (inte) => {
            collectorButtons.stop();

            await inte.deferUpdate();
            inte.channel.send({
              content: `${data.body.point_of_interaction.transaction_data.qr_code}`,
              ephemeral: true,
            });
          });

          vendas.set(`${interaction.channel.id}.status`, "Pendente");
          vendas.set(`${interaction.channel.id}.produto`, produto);
          vendas.set(`${interaction.channel.id}.total`, valor);
          vendas.set(`${interaction.channel.id}.id`, data.body.id);
          vendas.set(`${interaction.channel.id}.userId`, interaction.user.id);
          vendas.set(
            `${interaction.channel.id}.user`,
            interaction.user.username
          );

          const buffer = Buffer.from(qrcode, "base64");
          const attachment = new AttachmentBuilder(buffer, {
            name: "payment.png",
          });

          const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("copia_cola")
              .setStyle(ButtonStyle.Secondary)
              .setLabel("Copia e Cola")
              .setEmoji("📰")
          );

          const painelPayment = new EmbedBuilder()
            .setTitle(`${client.user.username} - PAGAMENTOS`)
            .setImage("attachment://payment.png")
            .setDescription(
              `Escanei-o **QR-Code** abaixo ou use o **Copia e Cola**, e faça o pagamento pelo pix, para receber seu produto automaticamente!\n\n> <:dinheirobot:1104631014984269906> **Total:** __R$${valor}__\n> <a:Estrela7:1115163788220584017> **Produto:** __${produto}__\n> <:lb1:1117527517427933315> **Quantidade:** __${Number(
                1
              )}__\n> <:cadeado:1132018578003067092> **ID da compra:** __${
                data.body.id
              }__`
            );

          interaction.channel
            .send({
              embeds: [painelPayment],
              files: [attachment],
              components: [buttons],
            })
            .then(async (msg2) => {
              let time2;
              const lopp = setInterval(async () => {
                try {
                  const response = await axios.get(
                    `https://api.mercadolibre.com/collections/notifications/${data.body.id}`,
                    {
                      headers: {
                        Authorization: `Bearer ${botconfig1.get("token")}`,
                      },
                    }
                  );

                  if (response.data.collection.status === "approved") {
                    vendas.set(`${interaction.channel.id}.status`, "Aprovado");

                    const ticketUser = interaction.guild.members.cache.get(
                      createdTickesdb.get(
                        `${interaction.channel.id}.abertoPorId`
                      )
                    );

                    ticketUser.send(produto);

                    msg2.edit({
                      conetent: ticketUser,
                      embeds: [
                        new EmbedBuilder()
                          .setTitle("COMPRA APROVADA")
                          .setDescription(
                            "Sua compra foi aprovada, verifique sua dm! Obrigado por escolher à nós."
                          ),
                      ],
                      components: [],
                      files: [],
                    });

                    clearTimeout(time2);
                    clearInterval(lopp);
                  }
                  console.log("Verificando status...");
                } catch (error) {
                  console.error(error);
                }
              }, 10000);

              time2 = setTimeout(function () {
                clearInterval(lopp);
                mercadopago.payment.cancel(data.body.id);
                interaction.channel.delete();
              }, 600000);
            });
        });
      }

      if (interaction.customId === "painelStaffMenu") {
        const functions = interaction.values[0];

        if (functions === "payTicket") {
          const modal = new ModalBuilder()
            .setTitle("Gerar Pagamento")
            .setCustomId(`payModal`);

          const msg = new TextInputBuilder()
            .setCustomId("valor")
            .setLabel("VALOR DO PRODUTO:")
            .setRequired(true)
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("📃 Escreva aqui");

          const msg2 = new TextInputBuilder()
            .setCustomId("produto")
            .setLabel("PRODUTO:")
            .setRequired(true)
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder("📃 Escreva aqui");

          const row1 = new ActionRowBuilder().addComponents(msg);
          const row2 = new ActionRowBuilder().addComponents(msg2);
          modal.addComponents(row1, row2);

          interaction.showModal(modal);
        }

        if (functions === "renameTicket") {
          const modal = new ModalBuilder()
            .setTitle("Renomear Ticket")
            .setCustomId(`renameModal`);

          const msg = new TextInputBuilder()
            .setCustomId("ticketName")
            .setLabel("ESCREVA O NOVO NOME:")
            .setRequired(true)
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("📃 Escreva aqui");

          const row = new ActionRowBuilder().addComponents(msg);
          modal.addComponents(row);

          interaction.showModal(modal);
        }

        await interaction.update({});

        if (functions === "callTicket") {
          await interaction.guild.channels.create({
            name: interaction.channel.name,
            type: ChannelType.GuildVoice,
            parent: interaction.channel.parent,
            permissionOverwrites: [
              {
                id: interaction.guild.id,
                deny: [PermissionsBitField.Flags.ViewChannel],
              },
              {
                id: interaction.user.id,
                allow: [
                  PermissionsBitField.Flags.ViewChannel,
                  PermissionsBitField.Flags.SendMessages,
                  PermissionsBitField.Flags.AttachFiles,
                  PermissionsBitField.Flags.ReadMessageHistory,
                ],
              },
            ],
          });

          await interaction.followUp({
            content: "**✅ | Call criada com sucesso.**",
            ephemeral: true,
          });
          return;
        }

        if (functions === "pokeTicket") {
          const user = interaction.guild.members.cache.get(
            createdTickesdb.get(`${interaction.channel.id}.abertoPorId`)
          );

          await interaction.followUp({
            content: "**✅ | Notificação enviada com sucesso.**",
            ephemeral: true,
          });

          return user.send({
            embeds: [
              new EmbedBuilder()
                .setTitle(`\`\`📡 ${interaction.guild.name} - NOTIFICAÇÃO\`\``)
                .setDescription(
                  `_Olá **${user}**, seu você recebeu uma notificação, parece que seu ticket foi respondido, para acessar seu ticket, clique no botão abaixo:_`
                ),
            ],
            components: [
              new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setStyle(ButtonStyle.Link)
                  .setLabel("Ir para o Ticket")
                  .setURL(
                    `https://discord.com/channels/${interaction.guild.id}/${interaction.channel.id}`
                  )
              ),
            ],
          });
        }
      }

      if (interaction.customId === `sairTicket`) {
        const buttons = [
          new ButtonBuilder()
            .setCustomId("sairTicket")
            .setEmoji("<:lb7:1113897476651499620>")
            .setLabel("Sair do Canal")
            .setDisabled(true)
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId("painelStaff")
            .setEmoji("<:lb12:1113900537063145612>")
            .setLabel("Painel Staff")
            .setDisabled(true)
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId("painelMembro")
            .setEmoji("<:InfoLost7:1106003706467590175>")
            .setLabel("Painel Membro")
            .setDisabled(true)
            .setStyle(ButtonStyle.Secondary),
        ];

        buttons.push(
          new ButtonBuilder()
            .setCustomId("assumirTicket")
            .setEmoji("<:verifedLost:1080325994428248174>")
            .setLabel("Assumir Ticket")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true)
        );

        buttons.push(
          new ButtonBuilder()
            .setCustomId("finalizarTicket")
            .setEmoji("<:LixoLost7:1106015127184085052>")
            .setLabel("Finalizar Ticket")
            .setStyle(ButtonStyle.Danger)
            .setDisabled(false)
        );

        const canal = await interaction.guild.channels.fetch(
          interaction.channel.id
        );

        canal.setName(`⛔・closed-${uuid}`);

        canal.permissionOverwrites.edit(interaction.user.id, {
          ViewChannel: false,
        });

        await interaction.update({
          components: [new ActionRowBuilder().addComponents(buttons)],
        });

        interaction.followUp({
          embeds: [
            new EmbedBuilder().setDescription(
              `_**${interaction.user.username}** finalizou seu **ATENDIMENTO** após clicar em Sair do Canal_`
            ),
          ],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId("deleteChannel")
                .setEmoji("<:LixoLost7:1106015127184085052>")
                .setLabel("Deletar Ticket")
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId("saveMessages")
                .setEmoji("<:pastalosts22:1080325485101338695>")
                .setLabel("Salvar Mensagens")
                .setStyle(ButtonStyle.Secondary)
            ),
          ],
        });

        const ticketUser = interaction.guild.members.cache.get(
          createdTickesdb.get(`${interaction.channel.id}.abertoPorId`)
        );

        try {
          ticketUser.send({
            embeds: [
              new EmbedBuilder()
                .setFooter({
                  text: `Espero que tenha tido um bom atendimento na ${interaction.guild.name}!\nAvalie nosso atendimento (expira em 1 minuto)`,
                })
                .setTitle(`\`\`⛔ ATENDIMENTO FINALIZADO\`\``)
                .setDescription(
                  `👋 - Ticket Aberto Por: \n\`\`${createdTickesdb.get(
                    `${interaction.channel.id}.abertoPor`
                  )}\`\`\n\n⛔ - Ticket Fechado Por: \n\`\`${
                    interaction.user.username
                  }\`\`\n\n📆 - Horário:\n<t:${Math.floor(
                    Date.now() / 1000
                  )}:R>`
                ),
            ],
            components: [
              new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setCustomId("1STAR")
                  .setEmoji("⭐")
                  .setLabel("1")
                  .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                  .setCustomId("2STAR")
                  .setEmoji("⭐")
                  .setLabel("2")
                  .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                  .setCustomId("3STAR")
                  .setEmoji("⭐")
                  .setLabel("3")
                  .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                  .setCustomId("4STAR")
                  .setEmoji("⭐")
                  .setLabel("4")
                  .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                  .setCustomId("5STAR")
                  .setEmoji("⭐")
                  .setLabel("5")
                  .setStyle(ButtonStyle.Secondary)
              ),
            ],
          });
        } catch (error) {
          console.error("Erro ao enviar mensagem:", error);
        }
      }

      if (interaction.customId === "deleteChannel") {
        interaction.channel.delete();
        createdTickesdb.delete(interaction.channel.id);
        vendas.delete(interaction.channel.id);
      }

      if (interaction.customId === "saveMessages") {
        const modal = new ModalBuilder()
          .setTitle("Descreva o que foi resolvido:")
          .setCustomId(`modalSave`);

        const msg = new TextInputBuilder()
          .setCustomId("msg")
          .setLabel("DESCREVA A SEGUIR:")
          .setRequired(true)
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("📃 Escreva aqui");

        const row = new ActionRowBuilder().addComponents(msg);
        modal.addComponents(row);
        interaction.showModal(modal);
      }

      if (interaction.customId === "modalSave") {
        const cnsd = interaction.fields.getTextInputValue("msg");

        interaction.reply({
          content: "📫 _Salvando as mensagens e deletando o ticket_",
          ephemeral: true,
        });

        setTimeout(() => {
          interaction.channel.delete();
          createdTickesdb.delete(interaction.channel.id);
          vendas.delete(interaction.channel.id);
        }, 5000);

        const discordTranscripts = require("discord-html-transcripts");

        const transcriptContent = await discordTranscripts.createTranscript(
          interaction.channel
        );

        const botConfig = new wio.JsonDatabase({
          databasePath: `database/botConfig.json`,
        });

        const logs = interaction.guild.channels.cache.get(
          botConfig.get("logs")
        );
        return logs.send({
          embeds: [
            new EmbedBuilder().setTitle(`\`\`📃 LOG ATENDIMENTO\`\``).addFields(
              {
                name: `🔒 Ticket fechado por:`,
                value: `<@${interaction.user.id}>`,
                inline: true,
              },
              {
                name: `👤 Ticket aberto por:`,
                value: `<@${createdTickesdb.get(
                  `${interaction.channel.id}.abertoPorId`
                )}>`,
                inline: true,
              },
              {
                name: `✅ Ticket assumido por:`,
                value: `<@${createdTickesdb.get(
                  `${interaction.channel.id}.assumido`
                )}>`,
                inline: true,
              },
              {
                name: `🎫 ID do Ticket:`,
                value: `\`\`${createdTickesdb.get(
                  `${interaction.channel.id}.ticketId`
                )}\`\``,
                inline: true,
              },
              {
                name: `📆 Horario de fechamento:`,
                value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
                inline: true,
              },
              {
                name: `📰 Considerações finais:`,
                value: `\`\`${cnsd}\`\``,
                inline: true,
              }
            ),
          ],
          files: [transcriptContent],
        });
        return;
      }

      if (interaction.customId === "finalizarTicket") {
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

        if (
          !interaction.member.permissions.has(
            PermissionsBitField.Flags.Administrator
          )
        ) {
          const noPerm = new EmbedBuilder().setDescription(
            `📌・Opps! **${interaction.user.username}** parece que você não possui permissão para executar isso.`
          );

          return interaction.reply({
            embeds: [noPerm],
            ephemeral: true,
          });
        }

        const ticketUser = interaction.guild.members.cache.get(
          createdTickesdb.get(`${interaction.channel.id}.abertoPorId`)
        );

        const canal = await interaction.guild.channels.fetch(
          interaction.channel.id
        );

        canal.permissionOverwrites.edit(interaction.user.id, {
          ViewChannel: false,
        });

        setTimeout(() => {
          createdTickesdb.delete(interaction.channel.id);
          vendas.delete(interaction.channel.id);
        }, 60000);

        setTimeout(() => {
          interaction.channel.delete();
        }, 61000);

        await interaction.update({
          embeds: [
            new EmbedBuilder()
              .setFooter({ text: "Este ticket será fechado em 1 minuto" })
              .setTitle(`\`\`⛔ TICKET FINALIZADO\`\``)
              .setDescription(
                `_📰 Caso queira ver as **LOGS** acesse: <#${botConfig.get(
                  "logs"
                )}>_`
              ),
          ],
          components: [],
        });

        const logs = interaction.guild.channels.cache.get(
          botConfig.get("logs")
        );
        logs.send({
          embeds: [
            new EmbedBuilder().setTitle(`\`\`📃 LOG ATENDIMENTO\`\``).addFields(
              {
                name: `🔒 Ticket fechado por:`,
                value: `<@${interaction.user.id}>`,
                inline: true,
              },
              {
                name: `👤 Ticket aberto por:`,
                value: `<@${createdTickesdb.get(
                  `${interaction.channel.id}.abertoPorId`
                )}>`,
                inline: true,
              },
              {
                name: `✅ Ticket assumido por:`,
                value: `<@${createdTickesdb.get(
                  `${interaction.channel.id}.assumido`
                )}>`,
                inline: true,
              },
              {
                name: `🎫 ID do Ticket:`,
                value: `\`\`${createdTickesdb.get(
                  `${interaction.channel.id}.ticketId`
                )}\`\``,
                inline: true,
              },
              {
                name: `📆 Horario de fechamento:`,
                value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
                inline: true,
              }
            ),
          ],
        });

        try {
          ticketUser.send({
            embeds: [
              new EmbedBuilder()
                .setFooter({
                  text: `Espero que tenha tido um bom atendimento na ${interaction.guild.name}!\nAvalie nosso atendimento (expira em 1 minuto)`,
                })
                .setTitle(`\`\`⛔ ATENDIMENTO FINALIZADO\`\``)
                .setDescription(
                  `👋 - Ticket Aberto Por: \n\`\`${createdTickesdb.get(
                    `${interaction.channel.id}.abertoPor`
                  )}\`\`\n\n⛔ - Ticket Fechado Por: \n\`\`${
                    interaction.user.username
                  }\`\`\n\n📆 - Horário:\n<t:${Math.floor(
                    Date.now() / 1000
                  )}:R>`
                ),
            ],
            components: [
              new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setCustomId("1STAR")
                  .setEmoji("⭐")
                  .setLabel("1")
                  .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                  .setCustomId("2STAR")
                  .setEmoji("⭐")
                  .setLabel("2")
                  .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                  .setCustomId("3STAR")
                  .setEmoji("⭐")
                  .setLabel("3")
                  .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                  .setCustomId("4STAR")
                  .setEmoji("⭐")
                  .setLabel("4")
                  .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                  .setCustomId("5STAR")
                  .setEmoji("⭐")
                  .setLabel("5")
                  .setStyle(ButtonStyle.Secondary)
              ),
            ],
          });
        } catch (error) {
          console.error("Erro ao enviar mensagem:", error);
        }
      }

      if (interaction.customId === "assumirTicket") {
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

        if (
          !interaction.member.permissions.has(
            PermissionsBitField.Flags.Administrator
          )
        ) {
          const noPerm = new EmbedBuilder().setDescription(
            `📌・Opps! **${interaction.user.username}** parece que você não possui permissão para executar isso.`
          );

          return interaction.reply({
            embeds: [noPerm],
            ephemeral: true,
          });
        }

        createdTickesdb.set(
          `${interaction.channel.id}.assumido`,
          interaction.user.id
        );

        const ticketUser = interaction.guild.members.cache.get(
          createdTickesdb.get(`${interaction.channel.id}.abertoPorId`)
        );

        const canal = await interaction.guild.channels.fetch(
          interaction.channel.id
        );

        await canal.setTopic(
          `👤 | ID DO MEMBRO: ${ticketUser.id} - 🎫 Ticket Atendido Por: ${interaction.user.id}`
        );

        const buttons = [
          new ButtonBuilder()
            .setCustomId("sairTicket")
            .setEmoji("<:lb7:1113897476651499620>")
            .setLabel("Sair do Canal")
            .setDisabled(false)
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId("painelStaff")
            .setEmoji("<:lb12:1113900537063145612>")
            .setLabel("Painel Staff")
            .setDisabled(false)
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId("painelMembro")
            .setEmoji("<:InfoLost7:1106003706467590175>")
            .setLabel("Painel Membro")
            .setDisabled(false)
            .setStyle(ButtonStyle.Secondary),
        ];

        buttons.push(
          new ButtonBuilder()
            .setCustomId("assumirTicket")
            .setEmoji("<:verifedLost:1080325994428248174>")
            .setLabel("Assumir Ticket")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true)
        );

        buttons.push(
          new ButtonBuilder()
            .setCustomId("finalizarTicket")
            .setEmoji("<:LixoLost7:1106015127184085052>")
            .setLabel("Finalizar Ticket")
            .setStyle(ButtonStyle.Danger)
            .setDisabled(false)
        );

        interaction.update({
          components: [new ActionRowBuilder().addComponents(buttons)],
        });

        await interaction.followUp({
          content: "**✅ | Você assumiu o ticket com sucesso**",
          ephemeral: true,
        });

        await ticketUser.send({
          embeds: [
            new EmbedBuilder()
              .setTitle(`\`\`📡 ${interaction.guild.name} - NOTIFICAÇÃO\`\``)
              .setDescription(
                `_Olá **${ticketUser}**, seu TICKET foi assumido pelo staff <@${interaction.user.id}>, para acessar seu ticket, clique no botão abaixo:_`
              ),
          ],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
                .setLabel("Ir para o Ticket")
                .setURL(
                  `https://discord.com/channels/${interaction.guild.id}/${interaction.channel.id}`
                )
            ),
          ],
        });
        return;
      }

      if (interaction.customId === "1STAR") {
        await interaction.update({
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(".")
                .setLabel("Obrigado por Avaliar!")
                .setEmoji("⭐")
                .setStyle(ButtonStyle.Success)
            ),
          ],
        });

        const tickets = createdTickesdb.all();

        let channelId1;

        for (const ticket of tickets) {
          const ticketInfo = ticket.data;

          channelId1 = ticketInfo.channelId;
        }

        const server = await client.guilds.fetch(t.data.guildId);

        const botConfig = new wio.JsonDatabase({
          databasePath: `database/botConfig.json`,
        });

        const avaliar = server.channels.cache.get(botConfig.get("avaliacao"));

        avaliar.send({
          embeds: [
            new EmbedBuilder().setTitle(`❤ | Nova Avaliação`).addFields(
              {
                name: `👤 | Avaliação Enviada Por:`,
                value: `\`\`${interaction.user.username} - ${interaction.user.id}\`\``,
              },
              {
                name: `🎫 | Quem assumiu o Ticket:`,
                value: `\`\`${createdTickesdb.get(
                  `${channelId1}.assumido`
                )}\`\``,
              },
              {
                name: `📃 | Nota:`,
                value: `⭐ (1/5)`,
              },
              {
                name: `📆 | Horário:`,
                value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
              }
            ),
          ],
        });
        return;
      }

      if (interaction.customId === "2STAR") {
        await interaction.update({
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(".")
                .setLabel("Obrigado por Avaliar!")
                .setEmoji("⭐")
                .setStyle(ButtonStyle.Success)
            ),
          ],
        });

        const tickets = createdTickesdb.all();

        let channelId1;

        for (const ticket of tickets) {
          const ticketInfo = ticket.data;

          channelId1 = ticketInfo.channelId;
        }

        const guilldId = ticketsB.get(`${t.ID}.guildId`);
        const server = await client.guilds.cache.get(guilldId);

        const botConfig = new wio.JsonDatabase({
          databasePath: `database/botConfig.json`,
        });

        const avaliar = server.channels.cache.get(botConfig.get("avaliacao"));

        avaliar.send({
          embeds: [
            new EmbedBuilder().setTitle(`❤ | Nova Avaliação`).addFields(
              {
                name: `👤 | Avaliação Enviada Por:`,
                value: `\`\`${interaction.user.username} - ${interaction.user.id}\`\``,
              },
              {
                name: `🎫 | Quem assumiu o Ticket:`,
                value: `\`\`${createdTickesdb.get(
                  `${channelId1}.assumido`
                )}\`\``,
              },
              {
                name: `📃 | Nota:`,
                value: `⭐⭐ (2/5)`,
              },
              {
                name: `📆 | Horário:`,
                value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
              }
            ),
          ],
        });
        return;
      }

      if (interaction.customId === "3STAR") {
        await interaction.update({
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(".")
                .setLabel("Obrigado por Avaliar!")
                .setEmoji("⭐")
                .setStyle(ButtonStyle.Success)
            ),
          ],
        });

        const tickets = createdTickesdb.all();

        let channelId1;

        for (const ticket of tickets) {
          const ticketInfo = ticket.data;

          channelId1 = ticketInfo.channelId;
        }

        const guilldId = ticketsB.get(`${t.ID}.guildId`);
        const server = await client.guilds.cache.get(guilldId);

        const botConfig = new wio.JsonDatabase({
          databasePath: `database/botConfig.json`,
        });

        const avaliar = server.channels.cache.get(botConfig.get("avaliacao"));

        avaliar.send({
          embeds: [
            new EmbedBuilder().setTitle(`❤ | Nova Avaliação`).addFields(
              {
                name: `👤 | Avaliação Enviada Por:`,
                value: `\`\`${interaction.user.username} - ${interaction.user.id}\`\``,
              },
              {
                name: `🎫 | Quem assumiu o Ticket:`,
                value: `\`\`${createdTickesdb.get(
                  `${channelId1}.assumido`
                )}\`\``,
              },
              {
                name: `📃 | Nota:`,
                value: `⭐⭐⭐ (3/5)`,
              },
              {
                name: `📆 | Horário:`,
                value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
              }
            ),
          ],
        });
        return;
      }

      if (interaction.customId === "4STAR") {
        await interaction.update({
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(".")
                .setLabel("Obrigado por Avaliar!")
                .setEmoji("⭐")
                .setStyle(ButtonStyle.Success)
            ),
          ],
        });

        const tickets = createdTickesdb.all();

        let channelId1;

        for (const ticket of tickets) {
          const ticketInfo = ticket.data;

          channelId1 = ticketInfo.channelId;
        }

        const guilldId = ticketsB.get(`${t.ID}.guildId`);
        const server = await client.guilds.cache.get(guilldId);

        const botConfig = new wio.JsonDatabase({
          databasePath: `database/botConfig.json`,
        });

        const avaliar = server.channels.cache.get(botConfig.get("avaliacao"));

        avaliar.send({
          embeds: [
            new EmbedBuilder().setTitle(`❤ | Nova Avaliação`).addFields(
              {
                name: `👤 | Avaliação Enviada Por:`,
                value: `\`\`${interaction.user.username} - ${interaction.user.id}\`\``,
              },
              {
                name: `🎫 | Quem assumiu o Ticket:`,
                value: `\`\`${createdTickesdb.get(
                  `${channelId1}.assumido`
                )}\`\``,
              },
              {
                name: `📃 | Nota:`,
                value: `⭐⭐⭐⭐ (4/5)`,
              },
              {
                name: `📆 | Horário:`,
                value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
              }
            ),
          ],
        });
        return;
      }

      if (interaction.customId === "5STAR") {
        await interaction.update({
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(".")
                .setLabel("Obrigado por Avaliar!")
                .setEmoji("⭐")
                .setStyle(ButtonStyle.Success)
            ),
          ],
        });

        const tickets = createdTickesdb.all();

        let channelId1;

        for (const ticket of tickets) {
          const ticketInfo = ticket.data;

          channelId1 = ticketInfo.channelId;
        }

        const guilldId = ticketsB.get(`${t.ID}.guildId`);
        const server = await client.guilds.cache.get(guilldId);

        const botConfig = new wio.JsonDatabase({
          databasePath: `database/botConfig.json`,
        });

        const avaliar = server.channels.cache.get(botConfig.get("avaliacao"));

        avaliar.send({
          embeds: [
            new EmbedBuilder().setTitle(`❤ | Nova Avaliação`).addFields(
              {
                name: `👤 | Avaliação Enviada Por:`,
                value: `\`\`${interaction.user.username} - ${interaction.user.id}\`\``,
              },
              {
                name: `🎫 | Quem assumiu o Ticket:`,
                value: `\`\`${createdTickesdb.get(
                  `${channelId1}.assumido`
                )}\`\``,
              },
              {
                name: `📃 | Nota:`,
                value: `⭐⭐⭐⭐⭐ (5/5)`,
              },
              {
                name: `📆 | Horário:`,
                value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
              }
            ),
          ],
        });
        return;
      }
    });
  },
};
