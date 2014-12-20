
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

	var assets = 5;
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

var audio = new Audio();
audio.src='music/song.mp3';
audio.play();
audio.volume=0;
audio.onended = function(){
	audio.currentTime=0;
	audio.play();
};

var tagSound = new Audio();
tagSound.src='music/9338.mp3';
function makeTagSound(){
	tagSound.currentTime=0;
	tagSound.play();
}

var players = [];

var socket = io(location.hash.replace('#','')+'/monitor');

socket.on('disconnect', function(){
	console.log('server disconnect');
	players = [];
});

socket.on('tag', makeTagSound);

socket.on('players', function(pPlayers){
	players = pPlayers;	
});

var blinking = true;

setInterval(function(){blinking=!blinking;},100);
// Draw everything
var render = function () {

	if(!ready){
		return;
	}
		
	ctx.drawImage(bgImage, 0, 0);

	players.forEach(function(player){

		if(player.dig){
			ctx.drawImage(vortexImage, player.pos.x-35, player.pos.y-35);
		}

		if(player.isTag){
			ctx.drawImage(monsterImage, player.pos.x, player.pos.y);
			ctx.fillStyle = "Red";
			ctx.fillText(player.name,player.pos.x, player.pos.y+42);

		}else if(player.isInvicible){
			if(blinking){				
				ctx.drawImage(heroInvicibleImage, player.pos.x, player.pos.y);
				ctx.fillStyle = "Orange";
				ctx.fillText(player.name,player.pos.x, player.pos.y+42);
			}
			
		}else{
			ctx.drawImage(heroImage, player.pos.x, player.pos.y);		
			ctx.fillStyle = "White";
			ctx.fillText(player.name,player.pos.x, player.pos.y+42);
		}

		ctx.fillText(player.name,player.pos.x, player.pos.y+42);

	    ctx.fillRect(player.pos.x,player.pos.y-12,player.reserve*8, 6);
	});

};

var main = function(){
	requestAnimationFrame(main);
	render();
}

loadAssets();
main();
