
// Create the canvas
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
canvas.width = 512;
canvas.height = 480;
document.body.appendChild(canvas);

var bgImage = new Image();
var heroImage = new Image();
var monsterImage = new Image();
var ready = false;

var loadAssets = function(){	

	var assets = 3;
	var loaded = 0;

	// Background image
	var bgReady = false;
	bgImage.onload = function () {
		bgReady = true;
		ready = ++loaded === assets;
	};
	bgImage.src = "images/background.png";

	// Hero image
	var heroReady = false;
	heroImage.onload = function () {
		heroReady = true;
		ready = ++loaded === assets;
	};
	heroImage.src = "images/hero.png";

	// Monster image
	var monsterReady = false;
	monsterImage.onload = function () {
		monsterReady = true;
		ready = ++loaded === assets;
	};
	monsterImage.src = "images/monster.png";
};




var players = {};

var socket = io('http://192.168.1.37:3000/monitor');
		  
socket.on('newPlayer', function(msg){
	players[msg.id] = msg;
});
socket.on('removePlayer', function(msg){
	players[msg.id] = null;
	delete players[msg.id];
});
socket.on('state', function(msg){
	players[msg.id] = msg;
});

// Draw everything
var render = function () {

	if(!ready){
		return;
	}
		
	ctx.drawImage(bgImage, 0, 0);

	for (var id in players){
		if(players[id].isTag){
			ctx.drawImage(monsterImage, players[id].pos.x, players[id].pos.y);	
		}else{
			ctx.drawImage(heroImage, players[id].pos.x, players[id].pos.y);
		}
		ctx.fillStyle = "White";
		ctx.fillText(players[id].name,players[id].pos.x, players[id].pos.y+42);
	}

};

// The main game loop
var main = function () {
	requestAnimationFrame(main);
	render();
};

loadAssets();
main();
