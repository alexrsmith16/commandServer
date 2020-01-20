const net = require('net');
const fs = require('fs');
let clients = [];
let ids = 0;
let adminPass = 'hakuna_matata';

const server = net.createServer();
const output = fs.createWriteStream('server.log');

server.listen(5000, () => log('Server up on port: 5000'));

server.on('connection', socket => {
	socket.id = ids++;
	socket.name = null;
	clients.push(socket);
	socket.write('Welcome, connection successfull\n');
	socket.write('Username: ');

	socket.on('data', chunk => {
		chunk = chunk.toString();
		if (socket.name === null) handleUsername(socket, chunk);
		else if(chunk[0] === '/') handleCommand(socket, chunk);
		else {
			log(`${socket.name}: ${chunk}`);
			notifyOthers(socket.name, `${socket.name}: ${chunk}`);
		}
	})
	.on('end', () => {
		removeUser(socket.name);
	})
})

function handleUsername(socket, chunk) {
	socket.name = chunk;
	let connectedUsers = 'no other users';
	if (clients.length > 1) connectedUsers = clientList(socket);
	socket.write(`Welcome ${socket.name}. Users connected:\n${connectedUsers}`);
	userConnectedMessage(socket);
}

function userConnectedMessage(socket) {
	let successMessage = `${socket.name} has connected`;
	notifyOthers(socket.name, successMessage);
	log(successMessage);
}

function handleCommand(socket, chunk) {
	chunk = chunk.slice(1);
	chunk = chunk.split(' ');
	let switcher = chunk.shift();
	let name = chunk.shift();
	let message = chunk.join(' ');
	switch(switcher) {
		case 'w':
			let whisper = socket.name + ' whispers: ' + message;
			findUser(name).write(whisper);
			log(whisper);
			break;
		case 'username':
			let oldName = socket.name;
			socket.name = name;
			socket.write('Username has be changed to: ' + socket.name);
			let logMessage = `User (${oldName}) has changed their username to: ${socket.name}`;
			notifyOthers(socket.name, logMessage);
			log(logMessage);
			break;
		case 'kick':
			if(message === adminPass) {
				let kickee = findUser(name);
				kickee.write('You have been kicked');
				kickee.end();
				removeUser(name);
				let kickMessage = kickee.name + ' has been removed';
				notifyOthers(kickee.name, kickMessage);
				log(kickMessage);
			}
			else socket.write('Incorrect Password, hint: "It means no worries"');
			break;
		case 'clientlist':
			socket.write('Connected Users:\n');
			socket.write(clientList(socket));
			break;
		default:
			socket.write('Unknown command, known commands:\n');
			socket.write('/w [name] "string"\n/username [name]\n/kick [name] [password]');
			break;
	}
}

function findUser(username) {
	for (let i in clients) {
		if(clients[i].name === username) return clients[i];
	}
	return null;
}

function notifyOthers(username, message) {
	for (let i in clients) {
		if (clients[i].name !== username) clients[i].write(message);
	}
}

function removeUser(name) {
	for (let i in clients) {
		if (clients[i].name === name) {
			clients.splice(i, 1);
		}
	}
	log(`${name} has disconnected`);
}

function clientList(socket) {
	connectedUsers = '';
	for (let i in clients) {
		if(clients[i].id !== socket.id) connectedUsers += clients[i].name + ', ';
	}
	connectedUsers += socket.name;
	return connectedUsers;
}

function log(message) {
	console.log(message);
	output.write(message + '\n');
}