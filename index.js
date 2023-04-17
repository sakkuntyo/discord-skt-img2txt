//common modules
const fs = require("fs");
const path = require('path');
require('date-utils');
const axios = require('axios');


//bot config
var stablediffusionDir = "D:\\stable-diffusion";
var outputDir = "bot-out";
var modelDir = "models\\ldm\\stable-diffusion-v1";
var defaultModel = "HD-22-fp32.safetensors.ckpt";

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
      option.setName('negativeprompt')
      .setDescription('default: low quality,{} not working, not working.')
    )
    .addStringOption(option =>
      option.setName('seed')
      .setDescription('default 42')
    )
    .addStringOption(option =>
      option.setName('height')
      .setDescription('default 512,minimum 64')
    )
    .addStringOption(option =>
      option.setName('width')
      .setDescription('default 512,minimum 64')
    )
    .addStringOption(option =>
      option.setName('numberofiterate')
      .setDescription('default 1, maximum 10')
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
      .setDescription(`the model file, default ${defaultModel}, available model shows "modellist" command.`)
    ),
  new SlashCommandBuilder()
    .setName('img2img')
    .setDescription('generate image')
    .addStringOption(option =>
      option.setName('prompt')
      .setDescription('{} not working')
    )
    .addStringOption(option =>
      option.setName('negativeprompt')
      .setDescription('default: low quality,{} not working, not working.')
    )
    .addStringOption(option =>
      option.setName('imageurl')
      .setDescription('example: https://aaa/1053631130831704145/1097154518589911081/grid-0000.png')
    )
    .addStringOption(option =>
      option.setName('seed')
      .setDescription('default 42')
    )
    .addStringOption(option =>
      option.setName('numberofiterate')
      .setDescription('default 1, maximum 10')
    )
    .addStringOption(option =>
      option.setName('strength')
      .setDescription('default 0.3')
    )
    .addStringOption(option =>
      option.setName('ckpt')
      .setDescription(`the model file, default ${defaultModel}, available model shows "modellist" command.`)
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

client.on('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction => {
  if (interaction.isChatInputCommand()){
    var prompt = interaction.options.getString("prompt");
    if (!prompt) {
      prompt = "";
    }
    if (prompt.match(/{/g) || prompt.match(/}/g)) {
      await interaction.followUp(`can't use these characters {,}`);
      return;
    }
    prompt.replace("'","").replace("$","").replace("\"",""); //sanitize
    var negativeprompt = interaction.options.getString("negativeprompt");
    if (!negativeprompt) {
      negativeprompt = "low quality";
    }
    negativeprompt.replace("'","").replace("$","").replace("\"",""); //sanitize
    if (negativeprompt.match(/{/g) || negativeprompt.match(/}/g)) {
      await interaction.followUp(`can't use these characters {,}`);
      return;
    }
    var imageurl = interaction.options.getString("imageurl");
    if (!imageurl) {
      imageurl = "";
    }
    imageurl.replace("'","").replace("$","").replace("\"",""); //sanitize
    var strength = interaction.options.getString("strength");
    if (!strength) {
      strength = "0.3";
    }
    strength.replace("'","").replace("$","").replace("\"",""); //sanitize
    //var envlist = require('child_process').execSync("conda env list",{'windowsHide': true}).toString();
    //if (!envlist.match(/ldm/g)){
    //  console.log("conda not exists, or ldm env is not exists");
    //  return;
    //};
    var height = interaction.options.getString("height");
    if (!height){
      height = "512"
    }
    height.replace("'","").replace("$","").replace("\"",""); //sanitize
    height = parseInt(height) - (parseInt(height) % 64);
    var width = interaction.options.getString("width");
    if (!width){
      width = "512"
    }
    width.replace("'","").replace("$","").replace("\"",""); //sanitize
    width = parseInt(width) - (parseInt(width) % 64);
    var seed = interaction.options.getString("seed");
    if (!seed){
      seed = "42"
    }
    seed.replace("'","").replace("$","").replace("\"",""); //sanitize
    //var numberofiterate = "1"
    var numberofiterate = interaction.options.getString("numberofiterate");
    if (!numberofiterate){
      numberofiterate = "1"
    }
    if (numberofiterate > 10) {
      numberofiterate = "10"
    }
    numberofiterate.replace("'","").replace("$","").replace("\"",""); //sanitize
    var numberofsamples = "1"
    //var numberofsamples = interaction.options.getString("numberofsamples");
    //if (!numberofsamples){
    //  numberofsamples = "1"
    //}
    //numberofsamples.replace("'","").replace("$","").replace("\"",""); //sanitize
    var ddimsteps = interaction.options.getString("ddimsteps");
    if (!ddimsteps){
      ddimsteps = "30"
    }
    ddimsteps.replace("'","").replace("$","").replace("\"",""); //sanitize
    var sampler = "plms"
    //var sampler = interaction.options.getString("sampler");
    //if (!sampler){
    //  sampler = "plms"
    //}
    //sampler.replace("'","").replace("$","").replace("\"",""); //sanitize
    var ckptfilepath = interaction.options.getString("ckpt");
    var ckpt = interaction.options.getString("ckpt");
    if (!ckptfilepath){
      ckptfilepath = `${stablediffusionDir}\\${modelDir}\\${defaultModel}`;
      ckpt = defaultModel;
    } else {
      ckptfilepath = `${stablediffusionDir}\\${modelDir}\\${ckpt}`;
    }
    ckptfilepath.replace("'","").replace("$","").replace("\"",""); //sanitize

    const date = new Date();
    const currentTime = date.toFormat('YYYYMMDDHH24MISS');

    await interaction.deferReply();

    const onesoutputDir = `${stablediffusionDir}\\${outputDir}\\` + currentTime
    console.log(`prompt: ${prompt}, negativeprompt: ${negativeprompt}, height: ${height}, width: ${width}, seed: ${seed}, numberofiterate: ${numberofiterate}, numberofsamples: ${numberofsamples}, ddimsteps: ${ddimsteps}, sampler: ${sampler}, ckpt: ${ckpt}`);

    switch (interaction.commandName) {
      case 'txt2img':
        var command = `conda activate ldm;cd ${stablediffusionDir};python scripts/txt2img.py --prompt '${prompt}' --negativeprompt '${negativeprompt}' --H '${height}' --W '${width}' --seed '${seed}' --n_iter '${numberofiterate}' --n_samples '${numberofsamples}' --ddim_steps '${ddimsteps}' --plms --ckpt '${ckptfilepath}' --outdir '${onesoutputDir}'`;
        console.log("command:\n" + command)
        require('child_process').exec(command, {'shell':'powershell.exe','windowsHide': true},async (err,stdout,stderr)=>{
          if(err){
            console.error(err);
            await interaction.followUp({ content: err.toString() });
            return;
	  }
          if(stderr){
            console.error(stderr);
	  }

          console.log(stdout);
    
          var outputfilepaths = [];
          fs.readdirSync(`${onesoutputDir}\\samples`).forEach((filename) => {
            outputfilepaths.push(`${onesoutputDir}\\samples\\${filename}`);
	  });
          
          await interaction.followUp({ content: `> /txt2img prompt: ${prompt} negativeprompt: ${negativeprompt} height: ${height} width: ${width} seed: ${seed} numberofiterate: ${numberofiterate} numberofsamples: ${numberofsamples} ddimsteps: ${ddimsteps} sampler: ${sampler} ckpt: ${ckpt}`, files: outputfilepaths });
          console.log(`send succeeded -> prompt: ${prompt}`);
          return;
	});
        break;
      case 'img2img':
        const beforeimgpath = `${onesoutputDir}\\before.png`
        fs.mkdirSync(`${onesoutputDir}`, { recursive: true });
        console.log("onesoutputDir created")
        const imgres = await axios.get(imageurl,{responseType: 'arraybuffer'});
        fs.writeFileSync(beforeimgpath, new Buffer.from(imgres.data), 'binary');
        console.log("before.png saved")

        var command = `conda activate ldm;cd ${stablediffusionDir};python scripts/img2img.py --prompt '${prompt}' --negativeprompt '${negativeprompt}' --init-img '${beforeimgpath}' --seed '${seed}' --n_iter '${numberofiterate}' --n_samples '${numberofsamples}' --strength '${strength}' --ckpt '${ckptfilepath}' --outdir '${onesoutputDir}'`;
        console.log("command:\n" + command)
        require('child_process').exec(command, {'shell':'powershell.exe','windowsHide': true},async (err,stdout,stderr)=>{
          if(err){
            console.error(err);
            await interaction.followUp({ content: err.toString() });
            return;
	  }
          if(stderr){
            console.error(stderr);
	  }

          console.log(stdout);
    
          var outputfilepaths = [];
          fs.readdirSync(`${onesoutputDir}\\samples`).forEach((filename) => {
            outputfilepaths.push(`${onesoutputDir}\\samples\\${filename}`);
	  });
          
          await interaction.followUp({ content: `> /img2img prompt: ${prompt} negativeprompt: ${negativeprompt} imageurl: ${imageurl} seed: ${seed} numberofiterate: ${numberofiterate} strength: ${strength} ckpt: ${ckpt}`, files: outputfilepaths });
          console.log(`send succeeded -> prompt: ${prompt}`);
          return;
	});
        break;
      case 'modellist':
        const directoryPath = `${stablediffusionDir}\\${modelDir}`;
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
        break;
    }
  }
});

client.login(DISCORD_TOKEN);
