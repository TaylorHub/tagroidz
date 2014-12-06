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

app.createPlayer = function(name, socket) {
	var player = {
		name: name || 'player',
		isInvicible: true,
		isTag: true,
		isScrounch: false,
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
		speed:10,

		addPlayer: function(player) {
			player.pos.x = parseInt(Math.random()*this.map.width,10);
			player.pos.y = parseInt(Math.random()*this.map.height,10);
			this.players.push(player);
			this.movePlayer(player, player.pos);

				io.of('/monitor').emit('newPlayer', player);


		},

		removePlayer: function(player){
			this.players.splice(this.players.indexOf(player,1));
			monitors.emit('removePlayer', player);
		},

		movePlayer: function(player, newPos)  {
			player.pos = newPos;

			console.log(newPos);

			var collider = this.checkCollision(player);

			if(collider) {
				if(!collider.isInvicible && player.isTag) {
					collider.isTag = true;
					player.isTag = false;
					player.isInvicible = true;
					console.log('PLAYER '+collider.name + ' Tagged')
					
					setTimeout(function(){
						player.isInvicible = false;
					}, 1000);

					io.of('/monitor').emit('state', collider);
				}
			}

			io.of('/monitor').emit('state', player);
		},

		checkCollision: function(player){

			var collider;

			this.players.forEach(function(other){

				if(!collider && player.name != other.name && 
					(Math.abs(player.pos.x-other.pos.x)<16 && Math.abs(player.pos.y-other.pos.y)<16)){

					console.log('COLLISION')
					collider = other;
					console.log(player.pos)
					console.log(other.pos)
				}
			});

			return collider;
		},

		moveUp: function(player) {
			var newPos = {
				x: player.pos.x,
				y: player.pos.y-this.speed
			};
			if(this.map.canMoveTo(newPos)){
				this.movePlayer(player, newPos);
			};
		},

		moveDown: function(player) {
			var newPos = {
				x: player.pos.x,
				y: player.pos.y+this.speed
			};
			if(this.map.canMoveTo(newPos)){
				this.movePlayer(player, newPos);
			};
		},

		moveLeft: function(player) {
			var newPos = {
				x: player.pos.x-this.speed,
				y: player.pos.y
			};
			if(this.map.canMoveTo(newPos)){
				this.movePlayer(player, newPos);
			};
		},

		moveRight: function(player) {
			var newPos = {
				x: player.pos.x+this.speed,
				y: player.pos.y
			};
			if(this.map.canMoveTo(newPos)){
				this.movePlayer(player, newPos);
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


var players = [];

var monitors = io.of('/monitor');

monitors.on('connection', function(socket){
  console.log('monitor connected');
});

var controllers = io.of('/controller');

controllers.on('connection', function(socket){

	console.log('controller connected');

	var player = app.createPlayer(uuid.v4(), socket);


	testRoom.addPlayer(player);

	if(testRoom.players.length == 1){
		player.isTag = true;
	}

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

		//var clients = io.of('/monitor').clients();

	});

	socket.on('disconnect', function(){
		testRoom.removePlayer(player);
	});
   
  
});




http.listen(3000, function(){
  console.log('listening on *:3000');
});
