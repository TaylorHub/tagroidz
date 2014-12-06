var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var uuid = require('node-uuid');

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
		width: 512,
		height: 480,
		blockSize:32,
		objects: [],

		canMoveTo: function(pos) {
			if(!(pos.x >= this.blockSize && pos.x <= this.width - this.blockSize*2)) {
				return false;
			}
			if(!(pos.y >= this.blockSize && pos.y <= this.height - this.blockSize*2)) {
				return false;
			}
			return true;
		}
	};

	return map;
};

app.createPlayer = function(id, name) {
	var player = {
		id: id || 'player',
		name: name || 'player',
		isInvicible: true,
		isTag: true,
		isScrounch: false,
		speed:10,
		pos: {
			x:0,
			y:0
		}
	};
	setTimeout(function(){
		player.isInvicible = false;
 	}, 3000);

	return player;
};

app.createRoom = function(name) {
	var room = {
		creationDate: new Date(),
		name: name,
		map: app.createMap(),
		players: [],

		addPlayer: function(player) {
			player.pos.x = parseInt(Math.random()*this.map.width,10);
			player.pos.y = parseInt(Math.random()*this.map.height,10);

			this.players.push(player);
			this.movePlayer(player, player.pos);

			io.of('/monitor').emit('newPlayer', player);
		},

		removePlayer: function(player){
			console.log('remove '+player.name);
			this.players.splice(this.players.indexOf(player,1));
			io.of('/monitor').emit('removePlayer', player);
		},

		movePlayer: function(player, newPos)  {
			player.pos = newPos;

			console.log(newPos);

			var collider = this.checkCollision(player);

			if(collider && !collider.isInvicible && player.isTag) {
				collider.isTag = true;
				player.isTag = false;
				player.isInvicible = true;
				
				setTimeout(function(){
					player.isInvicible = false;
				}, 1000);

				io.of('/monitor').emit('state', collider);				
			}

			io.of('/monitor').emit('state', player);
		},

		checkCollision: function(player){

			var collider;

			var map = this.map;

			this.players.forEach(function(other){

				if(!collider && player.id != other.id
					 && (Math.abs(player.pos.x-other.pos.x)<map.blockSize/2 
					 	&& Math.abs(player.pos.y-other.pos.y)<this.blockSize/2)){

					console.log('COLLISION')
					collider = other;

				}

			});

			return collider;
		},

		moveUp: function(player) {
			var newPos = {
				x: player.pos.x,
				y: player.pos.y-player.speed
			};
			if(this.map.canMoveTo(newPos)){
				this.movePlayer(player, newPos);
			};
		},

		moveDown: function(player) {
			var newPos = {
				x: player.pos.x,
				y: player.pos.y+player.speed
			};
			if(this.map.canMoveTo(newPos)){
				this.movePlayer(player, newPos);
			};
		},

		moveLeft: function(player) {
			var newPos = {
				x: player.pos.x-player.speed,
				y: player.pos.y
			};
			if(this.map.canMoveTo(newPos)){
				this.movePlayer(player, newPos);
			};
		},

		moveRight: function(player) {
			var newPos = {
				x: player.pos.x+player.speed,
				y: player.pos.y
			};
			if(this.map.canMoveTo(newPos)){
				this.movePlayer(player, newPos);
			};
		},

		renamePlayer:function(player,name){
			player.name = name;
			io.of('/monitor').emit('state', player);
		}
	};

	return room;
}

var testRoom = app.createRoom('Room');
app.rooms.push(testRoom);

var monitors = io.of('/monitor');

monitors.on('connection', function(socket){
  console.log('Display connected');
});

var controllers = io.of('/controller');

controllers.on('connection', function(socket){

	console.log('Player connected');

	var player = app.createPlayer(uuid.v4(), 'Unnamed player');

	testRoom.addPlayer(player);

	if(testRoom.players.length == 1){
		player.isTag = true;
	}

	socket.on('disconnect', function(){
		testRoom.removePlayer(player);
	});

	socket.on('rename', function(name){
		testRoom.renamePlayer(player,name);
	});

	socket.on('state', function(state){

		state = JSON.parse(state);

		if(state.top){
			testRoom.moveUp(player);
		}
		if(state.left){
			testRoom.moveLeft(player);
		}
		if(state.bottom){
			testRoom.moveDown(player);
		}
		if(state.right){
			testRoom.moveRight(player);
		}

	});
  
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
