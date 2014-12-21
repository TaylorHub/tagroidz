var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var uuid = require('node-uuid');


app.get('/2d-monitor*', function(req, res){
  res.sendFile(__dirname + req.url);
});

app.get('/3d-monitor*', function(req, res){
  res.sendFile(__dirname + req.url);
});

app.get('/controller-cordova/*', function(req, res){
  res.sendFile(__dirname + req.url);
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
		state:{left:false,top:false,bottom:false,right:false},
		name: name || 'player',
		isInvicible: 200,
		isTag: false,
		isScrounch: false,
		reserve:0,
		dig: false,
		speed:5,
		isBot:false,
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
		tag:null,

		setRandomPos:function(player){

			var map = this.map;

			var x = parseInt(Math.random()*(map.width));
			var y = parseInt(Math.random()*(map.height));

			player.pos.x = Math.max(Math.min(x,map.width-map.blockSize*2),map.blockSize);
			player.pos.y = Math.max(Math.min(y,map.height-map.blockSize*2),map.blockSize);

		},

		addPlayer: function(player) {

			if(!testRoom.players.length){
				player.isTag = true;
				this.tag = player;
			}

			this.setRandomPos(player);

			this.players.push(player);
			this.movePlayer(player, player.pos);

		},

		removePlayer: function(player){
			console.log('remove '+player.name);
			this.players.splice(this.players.indexOf(player),1);
		},

		movePlayer: function(player, newPos)  {
			player.pos = newPos;
		},

		checkCollision: function(player){

			var collider;

			var map = this.map;

			this.players.forEach(function(other){

				if(!collider && player.id != other.id
					 && (Math.abs(player.pos.x-other.pos.x)<map.blockSize/2 
					 	&& Math.abs(player.pos.y-other.pos.y)<map.blockSize/2)){
					console.log('COLLISION');
					collider = other;						
				}

			});

			return collider;
		},

		onButton:function(name,player){

			console.log('Button '+name+' action');
			switch(name){

				case  'A' :
					if(!player.dig){					
						player.dig = 50;
					}
					break;

				case  'B' : 

					if(player.reserve > 0){
						player.speed += player.reserve*1.5;
						player.reserve = Math.max(player.reserve - 2, 0);
					}

					break;

				default : break;
			}

		},

		moveUp: function(player) {
			var newPos = {
				x: player.pos.x,
				y: player.pos.y-player.speed
			};
			if(!player.dig && this.map.canMoveTo(newPos)){
				this.movePlayer(player, newPos);
			};
		},

		moveDown: function(player) {
			var newPos = {
				x: player.pos.x,
				y: player.pos.y+player.speed
			};
			if(!player.dig && this.map.canMoveTo(newPos)){
				this.movePlayer(player, newPos);
			};
		},

		moveLeft: function(player) {
			var newPos = {
				x: player.pos.x-player.speed,
				y: player.pos.y
			};
			if(!player.dig && this.map.canMoveTo(newPos)){
				this.movePlayer(player, newPos);
			};
		},

		moveRight: function(player) {
			var newPos = {
				x: player.pos.x+player.speed,
				y: player.pos.y
			};
			if(!player.dig && this.map.canMoveTo(newPos)){
				this.movePlayer(player, newPos);
			};
		},

		renamePlayer:function(player,name){
			player.name = name;
		},

		getNearestPlayer:function(player){

			if(this.players.length > 1){

				var nearest = null;
				var _this = this;
				this.players.forEach(function(other){
					if(player != other && !other.isInvicible){
						if(!nearest ){
							nearest = other;
						}
						else{
							var playerToNearest = _this.getDistance(player,nearest);
							var playerToOther = _this.getDistance(player,other);
							if(playerToOther < playerToNearest){
								nearest = other;
							}
						}
					}
				});

				return nearest;
				
			}
			else{
				return null;
			}

		},

		getDistance:function(p1,p2){
			var x = p1.pos.x - p2.pos.x;
			var y = p1.pos.y - p2.pos.y;
			return x*x + y*y;
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

	console.log(Object.keys(testRoom.players).length  + ' players');

	socket.on('disconnect', function(){

		testRoom.removePlayer(player);

		if(player.isTag && testRoom.players.length){
			testRoom.players[0].isTag = true;
			this.tag = testRoom.players[0];
		}else if(!testRoom.players.length){
			this.tag = null;
		}

	});

	socket.on('rename', function(name){
		testRoom.renamePlayer(player,name);
	});

	socket.on('button', function(name){
		testRoom.onButton(name,player);
	});

	socket.on('state', function(state){
		state = JSON.parse(state);
		player.state = state;		
	});
  
});

function createBot(name){
	
	var bot= app.createPlayer(uuid.v4(), 'Bot1');
	bot.isBot = true;
	testRoom.addPlayer(bot);

	function animateBot(){
		if(bot.isTag){
			// Flowow the nearest player
			var nearestPlayer = testRoom.getNearestPlayer(bot);
			if(nearestPlayer){
				bot.state.top = bot.pos.y > nearestPlayer.pos.y;
				bot.state.bottom = bot.pos.y < nearestPlayer.pos.y;
				bot.state.right = bot.pos.x < nearestPlayer.pos.x;
				bot.state.left = bot.pos.x > nearestPlayer.pos.x;
			}else{
				console.log('not found')
			}

		}else if(testRoom.tag){

			bot.state.top = testRoom.tag.pos.y > bot.pos.y || Math.random() > 0.5;
			bot.state.bottom = testRoom.tag.pos.y < bot.pos.y || Math.random() > 0.5;
			bot.state.left = testRoom.tag.pos.x > bot.pos.x || Math.random() > 0.5;
			bot.state.right =testRoom.tag.pos.x < bot.pos.x || Math.random() > 0.5;

		}else{
			bot.state.top = Math.random() > 0.5 ;
			bot.state.bottom = Math.random() > 0.5 ;
			bot.state.left = Math.random() > 0.5 ;
			bot.state.right = Math.random() > 0.5 ;
		}
		setTimeout(animateBot,bot.isTag ? 500 : Math.random() * 500 + 500 );
	}

	animateBot();

}

['Rob Oto','Booker','Brainstorm','Roberto'].forEach(createBot);

var port = process.env.PORT || 3000;
var ip = process.env.IP || 'localhost';

http.listen(port, function(){
  console.log('listening on '+ ip + ':' + port);
});

var main = function(){

	testRoom.players.forEach(function(player){

		var state = player.state;

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

		var collider = testRoom.checkCollision(player);

		var tagged, other;
		if(player.isTag){
			tagged = player;
			other = collider
		} else if(collider && collider.isTag){
			tagged = collider;
			other = player;
		}

		if(tagged && other && !other.isInvicible) {
			testRoom.tag = other;
			other.isTag = true;
			tagged.isTag = false;
			tagged.isInvicible = 100;

			var tagData = {other:tagged,tagged:other};

			io.of('/controller').emit('tag',tagData);
			io.of('/monitor').emit('tag',tagData);
					
		}

		if(player.reserve<5){
			player.reserve+=0.025;
		}

		if(player.isInvicible>0){
			player.isInvicible--;
		}

		if(player.speed>5){
			player.speed -= 0.1;
		}

		if(player.dig>0){
			player.dig--;
			if(!player.dig){
				testRoom.setRandomPos(player);
			}
		}

	});


	io.of('/monitor').emit('players',testRoom.players);

	setTimeout(main,25);

};

main();