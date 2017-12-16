var Discord = require('discord.js');
var logger = require('winston');
var auth = require('./auth.json');
var permissionHelper = require('./permissionHelper.js');
// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

var timeData = {
	once: true,
	time: Date.now(),
	message: 'test'
},
awaitingMessage;

// Initialize Discord Bot
var bot = new Discord.Client();

bot.on('ready', function () {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.user.username + ' - (' + bot.user.id + ')');
	permissionHelper.bot = bot;
});

bot.on('message', function (message) {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
	
if(message.author.bot) return;
if(!message.guild) return message.channel.send('You need to address me in a server owned channel');
message.guild.fetchMember(message.author).then(member => { if(!member.hasPermission('ADMINISTRATOR')) return message.channel.send('no permission');

    if(awaitingMessage && awaitingMessage == message.author.id){
	timeData.message = message.content;  
	awaitingMessage = undefined;
	} 
    if (message.content.substring(0, 1) == '!') {
        var args = message.content.substring(1).split(' ');
        var cmd = args[0];
       
        args = args.splice(1);
        switch(cmd) {
            // !ping
            case 'ping':
                message.channel.send('Pong!');
		break;
	case 'info':
		var response = 'Sending message ' + timeData.message.substr(0,10) +'... at ' + new Date(timeData.time).toString() + (timeData.once?'':'repeating each ' + (timeData.interval=='h'?'hour':(timeData.interval=='d'?'day':'week')));
		message.channel.send(response);    
		break;
	case 'setTime':
		for(var i=0; i<args.length; i++){
			switch(args[i]) {
				case '-t':
				 	i++;
					if(!args[i]) message.channel.send('missing time parameter');
					timeData.time = new Date(args[i]).getTime();
					break;
				case '-o':
					timeData.once = true;
					break;
				case '-i':
					i++
					if(!args[i]) message.channel.send('missing interval parameter (h/d/w)');
					timeData.interval = args[i];
					timeData.once = false;
					break;
				case '-m':
					i=args.length; 
					message.channel.send('setup timed message at '+new Date(timeData.time).toString()+ (timeData.once?'':('to repeat every ' + timeData.interval)) + '. Please send the message text as an answer to this information.)' );
					awaitingMessage = message.author.id;
					break;
				default: 
					message.channel.send('unknown parameter ' + args[i])
			}
		}
            break;
            // Just add any case commands if you want to..
         }
	console.log(timeData);
     }
	})
})

bot.login(auth.token);
