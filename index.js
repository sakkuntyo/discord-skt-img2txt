const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const commands = [
  new SlashCommandBuilder()
    .setName('txt2img')
    .setDescription('generate image')
    .addStringOption(option =>
      option.setName('prompt')
      .setDescription('keyword')
    )
].map(command => command.toJSON());

let DISCORD_TOKEN = ""
let DISCORD_CLIENT_ID = ""

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
  Events
} = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds] ,presence: {status: "invisible"}});
const axios = require("axios");

client.on('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction => {
  if (interaction.isChatInputCommand()){
    if (interaction.commandName === 'txt2img') {
      await interaction.deferReply("txt2img is thinking...");

      var prompt = interaction.options.getString("prompt");
      var envlist = require('child_process').execSync("conda env list").toString();
      if (!envlist.match(/ldm/g)){
        console.log("conda not exists, or ldm env is not exists");
        return;
      };

      var stablediffusionDir = "E:\\stable-diffusion"
      console.log(`prompt:${prompt}`)
      var output = require('child_process').execSync(`conda activate ldm;cd ${stablediffusionDir};python optimizedSD/optimized_txt2img.py --prompt "${prompt}" --H 512 --W 512 --seed "$(Get-Random -Maximum 100 -Minimum 1)" --n_iter 1 --n_samples 1 --ddim_steps 50`,{'shell':'powershell.exe'}).toString();
      var outputdir = stablediffusionDir + "\\outputs\\" + output.match(/output.*/).toString().replace(/.*outputs\//,"");
      console.log("outputdir -> " + outputdir);
      var outputfilename = require('child_process').execSync(`$(cd ${outputdir};dir | sort -Property LastWriteTime)[-1].Name`,{'shell':'powershell.exe'}).toString().trim();
      var outputfilepath = outputdir + "\\" + outputfilename;
      await interaction.followUp({ content: `> ${prompt}`, files: [outputfilepath] });
      console.log(`${prompt}:send succeeded`)
    }
  }
});

client.login(DISCORD_TOKEN);
