
// Create the canvas
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
canvas.width = 512;
canvas.height = 480;
document.body.appendChild(canvas);

var vortexImage = new Image();
var bgImage = new Image();
var heroImage = new Image();
var monsterImage = new Image();
var heroInvicibleImage = new Image();
var ready = false;

var loadAssets = function(){	

	var assets = 4;
	var loaded = 0;

	bgImage.onload = function () {
		ready = ++loaded === assets;
	};
	bgImage.src = "images/background.png";

	vortexImage.onload = function () {
		ready = ++loaded === assets;
	};
	vortexImage.src = "images/vortex.png";
	
	heroImage.onload = function () {
		ready = ++loaded === assets;
	};
	heroImage.src = "images/hero.png";

	heroInvicibleImage.onload = function () {
		ready = ++loaded === assets;
	};
	heroInvicibleImage.src = "images/hero-invicible.png";

	monsterImage.onload = function () {
		ready = ++loaded === assets;
	};
	monsterImage.src = "images/monster.png";



};




var players = {};

var socket = io('http://192.168.1.37:3000/monitor');

socket.on('disconnect', function(){
	players = {};
});
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

		if(player[id].dig){
			ctx.drawImage(vortexImage, players[id].pos.x, players[id].pos.y);
		}

		if(players[id].isTag){
			ctx.fillStyle = "Red";
			ctx.drawImage(monsterImage, players[id].pos.x, players[id].pos.y);	
		}else if(players[id].isInvicible){
			ctx.fillStyle = "Orange";
			ctx.drawImage(heroInvicibleImage, players[id].pos.x, players[id].pos.y);
		}else{
			ctx.fillStyle = "White";
			ctx.drawImage(heroImage, players[id].pos.x, players[id].pos.y);		
		}

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
