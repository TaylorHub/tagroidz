var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/chattest', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.get('/monitor', function(req, res){
  res.sendFile(__dirname + '/monitor/index.html');
});

app.get('/controller', function(req, res){
  res.sendFile(__dirname + '/controller/index.html');
});

app.rooms = [];

app.createMap = function() {
	var map = {
		width: 800,
		height: 600,
		objects: [],

		canMoveTo: function(pos) {
			if(!(pos.x >= 0 && pos.x <= this.width)) {
				return false;
			}
			if(!(pos.y >= 0 && pos.y <= this.height)) {
				return false;
			}
			return true;
		}
	};

	return map;
};

app.createPlayer = function(name) {
	var player = {
		name: name || 'player',
		isInvicile: true,
		isTag: false,
		isScrounch: false,
		pos: {
			x:0,
			y:0
		}
	};

	return player;
};

app.createRoom = function(name) {
	var room = {
		creationDate: new Date(),
		name: name,
		map: app.createMap(),
		players: [],

		addPlayer: function(player) {
			while(!this.map.canMoveTo(player.pos)){
				player.pos.x = Math.rand(this.map.width);
				player.pos.y = Math.rand(this.map.height);
			}
			this.players.push(player);
			this.movePlayer(player, player.pos);
		},

		movePlayer: function(player, newPos)  {
			player.pos = newPos;
			io.emit('chat message', this);
			console.log(JSON.stringify(this));
		},

		moveUp: function(player) {
			var newPos = {
				x: player.pos.x,
				y: player.pos.y-1
			};
			if(map.canMoveTo(newPos)){
				this.movePlayer(player, newPos);
			};
		},

		moveDown: function() {
			var newPos = {
				x: player.pos.x,
				y: player.pos.y+1
			};
			if(map.canMoveTo(newPos)){
				this.movePlayer(player, newPos);
			};
		},

		moveLeft: function() {
			var newPos = {
				x: player.pos.x-1,
				y: player.pos.y
			};
			if(map.canMoveTo(newPos)){
				this.movePlayer(player, newPos);
			};
		},

		moveRight: function() {
			var newPos = {
				x: player.pos.x+1,
				y: player.pos.y
			};
			if(map.canMoveTo(newPos)){
				player.pos = newPos;
			};
		}
	};

	return room;
}

var testRoom = app.createRoom('Chez Mooorg');
app.rooms.push(testRoom);

// var yann = app.createPlayer('Yann');
// var taylor = app.createPlayer('Taylor');
// var morgan = app.createPlayer('Morgan');

// testRoom.addPlayer(yann);
// testRoom.addPlayer(taylor);
// testRoom.addPlayer(morgan);


/*io.on('connection', function(socket){

  socket.on('chat message', function(msg){

  	console.log('new player named: '+msg)
  	io.emit('chat message', JSON.stringify(app.rooms[0]));
    io.emit('chat message', msg);
  });
});*/

function animate(){

};


var monitors = io.of('/monitor');
monitors.on('connection', function(socket){
  console.log('monitor connected');
});

var controllers = io.of('/controller');

controllers.on('connection', function(socket){

  monitors.clients.emit('newPlayer',socket);

  console.log('controller connected');
  socket.on('message', function(msg){
  	console.log(msg);
  })
  socket.on('state', function(state){
  	console.log(state);
  })
});



http.listen(3000, function(){
  console.log('listening on *:3000');
});
