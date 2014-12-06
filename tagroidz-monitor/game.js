// Create the canvas
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
canvas.width = 512;
canvas.height = 480;
document.body.appendChild(canvas);

// Background image
var bgReady = false;
var bgImage = new Image();
bgImage.onload = function () {
	bgReady = true;
};
bgImage.src = "background.png";

// Hero image
var heroReady = false;
var heroImage = new Image();
heroImage.onload = function () {
	heroReady = true;
};
heroImage.src = "hero.png";

// Monster image
var monsterReady = false;
var monsterImage = new Image();
monsterImage.onload = function () {
	monsterReady = true;
};
monsterImage.src = "monster.png";

// Game objects
var hero = {
	speed: 256 // movement in pixels per second
};


var players = [];

// Draw everything
var render = function () {

	if (bgReady) {
		ctx.drawImage(bgImage, 0, 0);
	}

	for (var name in players){
		if(heroReady && monsterReady){

			if(players[name].isTag){
				ctx.drawImage(monsterImage, players[name].pos.x, players[name].pos.y);	
			}else{
				ctx.drawImage(heroImage, players[name].pos.x, players[name].pos.y);
			}

		}
	}

};

// The main game loop
var main = function () {
	var now = Date.now();
	var delta = now - then;
	render();

	then = now;

	// Request to do this again ASAP
	requestAnimationFrame(main);
};

// Cross-browser support for requestAnimationFrame
var w = window;
requestAnimationFrame = w.requestAnimationFrame || w.webkitRequestAnimationFrame || w.msRequestAnimationFrame || w.mozRequestAnimationFrame;

// Let's play this game!
var then = Date.now();

main();





var socket = io('http://192.168.1.37:3000/monitor');
		  
socket.on('newPlayer', function(msg){
	players[msg.name] = msg;
});
socket.on('removePlayer', function(msg){
	players[msg.name] = null;
	delete players[msg.name];
});
socket.on('state', function(msg){
	players[msg.name] = msg;
});