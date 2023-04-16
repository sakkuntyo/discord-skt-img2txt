//common modules
const fs = require("fs");
const path = require('path');

//bot config
var stablediffusionDir = "D:\\stable-diffusion";
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
      .setDescription('default: low quality,{} not working')
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
        //var envlist = require('child_process').execSync("conda env list",{'windowsHide': true}).toString();
        //if (!envlist.match(/ldm/g)){
        //  console.log("conda not exists, or ldm env is not exists");
        //  return;
        //};
        var height = interaction.options.getString("height");
        if (!height){
          height = "256"
        }
        height.replace("'","").replace("$","").replace("\"",""); //sanitize
        height = parseInt(height) - (parseInt(height) % 64);
        var width = interaction.options.getString("width");
        if (!width){
          width = "256"
        }
        width.replace("'","").replace("$","").replace("\"",""); //sanitize
        width = parseInt(width) - (parseInt(width) % 64);
        var seed = interaction.options.getString("seed");
        if (!seed){
          seed = "42"
        }
        seed.replace("'","").replace("$","").replace("\"",""); //sanitize
        var numberofiterate = "1"
        //var numberofiterate = interaction.options.getString("numberofiterate");
        //if (!numberofiterate){
        //  numberofiterate = "1"
        //}
        //numberofiterate.replace("'","").replace("$","").replace("\"",""); //sanitize
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
        console.log(`prompt: ${prompt}, negativeprompt: ${negativeprompt}, height: ${height}, width: ${width}, seed: ${seed}, numberofiterate: ${numberofiterate}, numberofsamples: ${numberofsamples}, ddimsteps: ${ddimsteps}, sampler: ${sampler}, ckpt: ${ckpt}`)
  
        require('child_process').exec(`conda activate ldm;cd ${stablediffusionDir};python optimizedSD/optimized_txt2img.py --prompt '${prompt}'--negativeprompt '${negativeprompt}' --H '${height}' --W '${width}' --seed '${seed}' --n_iter '${numberofiterate}' --n_samples '${numberofsamples}' --ddim_steps '${ddimsteps}' --sampler '${sampler}' --ckpt '${ckptfilepath}'`, {'shell':'powershell.exe','windowsHide': true},async (err,stdout,stderr)=>{
          if(err){
            console.error(err);
            await interaction.followUp({ content: err.toString() });
            return;
	  }
          if(stderr){
            console.error(stderr);
	  }

          console.log(stdout);
          var outputdir = stablediffusionDir + "\\outputs\\" + stdout.match(/output.*/).toString().replace(/.*outputs\//,"");
          console.log("outputdir -> " + outputdir);
    
          var outputfilename = require('child_process').execSync(`$(cd "${outputdir}";dir | sort -Property LastWriteTime)[-1].Name`,{'shell':'powershell.exe','windowsHide': true}).toString().trim();
          var outputfilepath = outputdir + "\\" + outputfilename;
          await interaction.followUp({ content: `> /txt2img prompt: ${prompt} negativeprompt: ${negativeprompt} height: ${height} width: ${width} seed: ${seed} numberofiterate: ${numberofiterate} numberofsamples: ${numberofsamples} ddimsteps: ${ddimsteps} sampler: ${sampler}, ckpt: ${ckpt}`, files: [outputfilepath] });
          console.log(`send succeeded -> prompt: ${prompt}`);
          return;
	});
        break;
      case 'modellist':
        await interaction.deferReply("txt2img is thinking...");
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
