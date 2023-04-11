const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const commands = [
  new SlashCommandBuilder()
    .setName('txt2img')
    .setDescription('generate image')
    .addStringOption(option =>
      option.setName('prompt')
      .setDescription('{} not working')
    )
    .addStringOption(option =>
      option.setName('seed')
      .setDescription('default 42')
    )
    .addStringOption(option =>
      option.setName('height')
      .setDescription('default 256,minimum 256')
    )
    .addStringOption(option =>
      option.setName('width')
      .setDescription('default 256,minimum 256')
    )
    .addStringOption(option =>
      option.setName('numberofiterate')
      .setDescription('default 1, not working')
    )
    .addStringOption(option =>
      option.setName('numberofsamples')
      .setDescription('default 1, not working')
    )
    .addStringOption(option =>
      option.setName('ddimsteps')
      .setDescription('default 30')
    )
    .addStringOption(option =>
      option.setName('sampler')
      .setDescription('default plms, ddim,plms,heun,euler,euler_a,dpm2,dpm2_a,lms, not working')
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
      if (prompt.match(/{/g) || prompt.match(/}/g)) {
        await interaction.followUp(`can't use these characters {,}`);
        return;
      }
      var envlist = require('child_process').execSync("conda env list").toString();
      if (!envlist.match(/ldm/g)){
        console.log("conda not exists, or ldm env is not exists");
        return;
      };
      
      var height = interaction.options.getString("height");
      if (!height){
        height = 256
      }
      var width = interaction.options.getString("width");
      if (!width){
        width = 256
      }
      var seed = interaction.options.getString("seed");
      if (!seed){
        seed = 42
      }
      var numberofiterate = 1
      //var numberofiterate = interaction.options.getString("numberofiterate");
      //if (!numberofiterate){
      //  numberofiterate = 1
      //}
      var numberofsamples = 1
      //var numberofsamples = interaction.options.getString("numberofsamples");
      //if (!numberofsamples){
      //  numberofsamples = 1
      //}
      var ddimsteps = interaction.options.getString("ddimsteps");
      if (!ddimsteps){
        ddimsteps = 30
      }
      var sampler = interaction.options.getString("sampler");
      if (!sampler){
        sampler = "plms"
      }
      console.log(`prompt: ${prompt}, height: ${height}, width: ${width}, seed: ${seed}, numberofiterate: ${numberofiterate}, numberofsamples: ${numberofsamples}, ddimsteps: ${ddimsteps}, sampler: ${sampler}`)

      var stablediffusionDir = "E:\\stable-diffusion"

      try {
        var output = require('child_process').execSync(`conda activate ldm;cd ${stablediffusionDir};python optimizedSD/optimized_txt2img.py --prompt "${prompt}" --H ${height} --W ${width} --seed ${seed} --n_iter ${numberofiterate} --n_samples ${numberofsamples} --ddim_steps ${ddimsteps}`,{'shell':'powershell.exe'}).toString();
        console.log(output);
      } catch (err) {
        console.error(err);
        await interaction.followUp({ content: err.toString() });
        return;
      }

      var outputdir = stablediffusionDir + "\\outputs\\" + output.match(/output.*/).toString().replace(/.*outputs\//,"");
      console.log("outputdir -> " + outputdir);

      var outputfilename = require('child_process').execSync(`$(cd "${outputdir}";dir | sort -Property LastWriteTime)[-1].Name`,{'shell':'powershell.exe'}).toString().trim();
      var outputfilepath = outputdir + "\\" + outputfilename;
      await interaction.followUp({ content: `> prompt: ${prompt} height: ${height} width: ${width} seed: ${seed} numberofiterate: ${numberofiterate} numberofsamples: ${numberofsamples} ddimsteps: ${ddimsteps} sampler: ${sampler}`, files: [outputfilepath] });
      console.log(`send succeeded -> prompt: ${prompt}`);
      return;
    }
  }
});

client.login(DISCORD_TOKEN);
