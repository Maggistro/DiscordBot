var Discord = require('discord.js'),
	auth = require('./auth.json'),
	winston = require('winston'),
	scheduler = require('node-schedule');

// Configure logger settings
const logger = winston.createLogger({
	level: 'info',
	format: winston.format.json(),
	transports: [
		new winston.transports.File({
			filename: "bot.log"
		})
	]
});

logger.add(new winston.transports.Console({
	format: winston.format.simple()
}));

var timeData = {
		once: true,
		time: new Date(0).getTime(),
		message: 'test',
		channel: undefined
	},
	job,
	awaitingMessage;

// Initialize Discord Bot
var bot = new Discord.Client();

bot.on('ready', function () {
	logger.info('Connected');
	logger.info('Logged in as: ');
	logger.info(bot.user.username + ' - (' + bot.user.id + ')');
});

bot.on('message', function (message) {
	// Our bot needs to know if it will execute a command
	// It will listen for messages that will start with `!`

	//skip messages from bots ( self and other)
	if (message.author.bot) return;
	//only accept messages in a server channel ( no direct messages )
	if (!message.guild)
		return message.channel.send('You need to address me in a server owned channel');

	//check for permissions
	message.guild.fetchMember(message.author).then( member => {
		if(!member.hasPermission(auth.permission))
			return message.channel.send('no permission');

		//check if next message contains scheduled content
		if (awaitingMessage && awaitingMessage == message.author.id) {
			timeData.message = message.content;
			awaitingMessage = undefined;
			return updateScheduler(message.channel);
		}

		//check if command was send
		if (message.content.substring(0, 1) == '!') {
			var args = message.content.substring(1).split(' ');
			var cmd = args[0];

			args = args.splice(1);
			switch (cmd) {
				case 'say': // stupid reply
					var saying = '';
					for(var i=0; i<args.length; i++)
						saying+=args[i]+' ';
					message.channel.send(saying);
					break;
				case 'ping': //default ping test
					message.channel.send('Pong!');
					break;
				case 'info': //shows schedule info
					var response = 'Sending message ' + timeData.message.substr(0, 10) + '... at ' + new Date(timeData.time).toString() + (timeData.once ? '' : 'repeating each ' + (timeData.interval == 'h' ? 'hour' : (timeData.interval == 'd' ? 'day' : 'week'))) + ' to channel '+ timeData.channel.name;
					message.channel.send(response);
					break;
				case 'setTime': //sets schedule time
					for (var i = 0; i < args.length; i++) {
						switch (args[i]) {
							case '-c':
								i++;
								if (!args[i]) return message.channel.send('missing channel parameter');
								var found,
									channels = message.guild.channels.array();
								for(var id = 0; id<channels.length; id++ ){
									var channel = channels[id];
									if(channel.name==args[i]) {
										found = channel;
										break;
									}
								}
								if(!found) return message.channel.send('channel name could not be found');
								timeData.channel = channel;
								break;
							case '-t':
								i++;
								if (!args[i]) return message.channel.send('missing time parameter');
								timeData.time = new Date(args[i]).getTime();
								break;
							case '-o':
								timeData.once = true;
								break;
							case '-i':
								i++
								if (!args[i]) return message.channel.send('missing interval parameter (h/d/w)');
								timeData.interval = args[i];
								timeData.once = false;
								break;
							case '-m':
								i = args.length;
								message.channel.send('Please answer to this with your desired message content')
								awaitingMessage = message.author.id;
								break;
							default:
								message.channel.send('unknown parameter ' + args[i])
						}
					}
					updateScheduler(message.channel);
					break;
			}

		}
	})
})

var updateScheduler = function(errorChannel){
	if(job) job.cancel();

	if(!timeData.channel) return errorChannel.send('no channel specified. Use -c CHANNELNAME ');
	if(timeData.time == new Date(0).getTime()) return errorChannel.send('no date specified. Use -t ISOTIMESTRING');
	if(timeData.time < Date.now()) return errorChannel.send('The specified date is in the past.');

	job = scheduler.scheduleJob(new Date(timeData.time), function(message, channel){
		channel.send(message);
		//logger.info(message);
	}.bind(null, timeData.message, timeData.channel));
	errorChannel.send('setup timed message at ' + new Date(timeData.time).toString() + (timeData.once ? '' : ('to repeat every ' + timeData.interval)));
}

bot.login(auth.token);
