const fs = require("fs");
const path = require('path');


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
    .addStringOption(option =>
      option.setName('ckpt')
      .setDescription('the model file, default model.ckpt, available model shows "modellist" command.')
    ),
  new SlashCommandBuilder()
    .setName('modellist')
    .setDescription('show available model list')
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
    switch (interaction.commandName) {
      case 'txt2img':
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
        var sampler = "plms"
        //var sampler = interaction.options.getString("sampler");
        //if (!sampler){
        //  sampler = "plms"
        //}
        var ckptfilename = interaction.options.getString("ckpt");
        var ckpt = interaction.options.getString("ckpt");
        console.log("aaa" + ckpt )
        if (!ckptfilename){
          ckptfilename = "E:\\stable-diffusion\\models\\ldm\\stable-diffusion-v1\\X-mix-V1.0.ckpt";
          ckpt = "X-mix-V1.0.ckpt"
        } else {
          ckptfilename = `E:\\stable-diffusion\\models\\ldm\\stable-diffusion-v1\\${ckpt}`;  
	}
        
        console.log(`prompt: ${prompt}, height: ${height}, width: ${width}, seed: ${seed}, numberofiterate: ${numberofiterate}, numberofsamples: ${numberofsamples}, ddimsteps: ${ddimsteps}, sampler: ${sampler}, ckpt: ${ckpt}`)
  
        var stablediffusionDir = "E:\\stable-diffusion"
  
        try {
          var output = require('child_process').execSync(`conda activate ldm;cd ${stablediffusionDir};python optimizedSD/optimized_txt2img.py --prompt "${prompt}" --H ${height} --W ${width} --seed ${seed} --n_iter ${numberofiterate} --n_samples ${numberofsamples} --ddim_steps ${ddimsteps} --sampler ${sampler} --ckpt ${ckptfilename}`,{'shell':'powershell.exe'}).toString();
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
        await interaction.followUp({ content: `> prompt: ${prompt} height: ${height} width: ${width} seed: ${seed} numberofiterate: ${numberofiterate} numberofsamples: ${numberofsamples} ddimsteps: ${ddimsteps} sampler: ${sampler}, ckpt: ${ckpt}`, files: [outputfilepath] });
        console.log(`send succeeded -> prompt: ${prompt}`);
        return;
      case 'modellist':
        await interaction.deferReply("txt2img is thinking...");
        const directoryPath = 'E:\\stable-diffusion\\models\\ldm\\stable-diffusion-v1';
        const regexPattern = /\.ckpt$/;

        fs.readdir(directoryPath, async (err, files) => {
          if (err) {
            console.log('Error getting directory information.');
            await interaction.followUp({ content: "sorry, some kind of error has occurred." });
          } else {
            var message = ""
            console.log('Files:');
            files.forEach(async file => {
              if (regexPattern.test(file)) {
                console.log(file);
                message += `${file}\n`
              }
            });
            await interaction.followUp({ content: message });
            return;
          }
        });
        return;
    }
  }
});

client.login(DISCORD_TOKEN);
