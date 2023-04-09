const { REST, Routes } = require('discord.js');
const commands = [
	  {
		      name: 'gpt35',
		      description: 'chatgpt 3.5 を利用します',
		    },
];

let DISCORD_TOKEN = ""
let DISCORD_CLIENT_ID = ""

let chatHistories = [];
function saveChatHistory(role,message){
  chatHistories.push({
    role: role,
    message: message,
    timestamp: new Date()
  })
}


const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');
    await rest.put(Routes.applicationCommands(DISCORD_CLIENT_ID), { body: commands });
    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();

const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  Events,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds] ,presence: {status: "invisible"}});
const axios = require("axios");

client.on('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction => {
  if (interaction.isChatInputCommand()){
    if (interaction.commandName === 'gpt35') {
      const modal = new ModalBuilder()
        .setCustomId('gpt35')
        .setTitle('gpt35');
      const hobbiesInput = new TextInputBuilder()
        .setCustomId('questionsInput')
        .setLabel("please type your request for chatgpt")
        .setStyle(TextInputStyle.Paragraph);
      const firstActionRow = new ActionRowBuilder().addComponents(hobbiesInput);
      modal.addComponents(firstActionRow);
      await interaction.showModal(modal);
    }
  }
  if (interaction.isModalSubmit()){
    var value = interaction.fields.getTextInputValue('questionsInput');
    saveChatHistory("user",value);
    await interaction.deferReply("chatgpt is thinking...");
    
    let data = {
      model:"gpt-3.5-turbo",
      messages: [
      ],
      temperature:0.7
    }

    chatHistories.forEach((history) => {
      data.messages.push({role:history.role,content:history.message})
    })

    let headers = {
      "Content-Type":'application/json',
      "Authorization":`Bearer ${CHATGPT_TOKEN}`
    }

    var gptres = await axios.post("https://api.openai.com/v1/chat/completions", data, {headers: headers})
    var gptresponse = gptres.data.choices[0].message.content;
    saveChatHistory("assistant",gptresponse)
    value = value.replace("\n","\n> ")
    var message = `> ${value}\n` + gptresponse;
    await interaction.followUp(message);
  }
});

client.login(DISCORD_TOKEN);
