const fs = require('fs');
const {CronJob} = require("cron");
const Chuck = require('chucknorris-io');

const Discord = require('discord.js');
const {prefix, token, guildId, channelId, adminRole} = require('./config.json');

const bot = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });
const norris = new Chuck();

let jokeChannel = null;
let cronJob = null;

bot.on('ready', async () => {
    console.log(`${bot.user.username} is online !`);

    jokeChannel = await getJokeChannel();
    startJokeCron();
});

// Dynamic command processing
bot.on('message', async msg => {
    
    if(!msg.content.startsWith(prefix) || msg.author.bot || !msg.member.roles.cache.some(r => r.name == adminRole)) return;

    const args = msg.content.substr(prefix.length).split(" ");
    const cmd = args.shift();


    switch(cmd) {
        case "set-channel":
            setChannel(msg.mentions.channels.first());
            msg.channel.send("Channel set !");
            break;
        case "start":
            startJokeCron();
            msg.channel.send("Quotes service started !");
            break;
        case "stop":
            if(cronJob) cronJob.stop();
            msg.channel.send("Quotes service stopped :(");
            break;
        default:
            console.log("command");
            break;
    }

});

const setChannel = (channel) => {
    const data = JSON.parse( fs.readFileSync('./config.json') );

    data.guildId = channel.guild.id;
    data.channelId = channel.id;

    fs.writeFileSync("./config.json", JSON.stringify(data, null, 2));
    jokeChannel = channel;
}

const getJokeChannel = async () => {
    if(guildId == undefined && channelId == undefined) {
        console.log('No log channel');
        return null;
    }

    const guild = await bot.guilds.fetch(guildId);
    return guild.channels.cache.get(channelId);
}

const startJokeCron = () => {
    if(jokeChannel == null) return console.log("No log channel ...");

    cronJob = new CronJob('00 23 * * *', () => {
        console.log("new joke !")
        sendJoke();
    }, null, true);

    cronJob.start();
}

const sendJoke = async () => {
    const joke = await norris.getRandomJoke();

    let text = joke.value.replace("s' ", "s's ");
    text = text.replace('Chuck Norris', '**Simon Plouffe**');
    
    jokeChannel.send(text);
}

bot.login(token);