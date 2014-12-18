var players = [];

var socket = io(location.hash.replace('#','')+'/monitor');

socket.on('disconnect', function(){
	console.log('server disconnect');
	players = [];
});

socket.on('tag', function(){

});

var geometry = new THREE.BoxGeometry( 32, 32, 32 );

var monsterMesh = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( { color: 0xff0000 } ) );
var playerMesh = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( { color: 0x00ff00 } ) );

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 5000 );
camera.position.set(400,800,1000)
camera.lookAt(new THREE.Vector3(400,0,400))

var renderer = new THREE.WebGLRenderer();

var size = 400;
var step = 32;

var gridHelper = new THREE.GridHelper( size, step );		
gridHelper.position.set(400,0,400)
scene.add( gridHelper );

var axisHelper = new THREE.AxisHelper( 5 );
scene.add( axisHelper );

var players = [];

socket.on('players', function(pPlayers){

	var oldIds = _.pluck(players,'id');
	var newIds = _.pluck(pPlayers,'id');

	var playersToAdd = _.difference(newIds,oldIds);
	var playersToRemove= _.difference(oldIds,newIds);

	players = pPlayers;

	removePlayers(playersToRemove);
	addPlayers(playersToAdd);

});



socket.on('tag', function(tagEvent){

	// move the camera

})

var objects = {};

function removePlayers(arr){
	arr.forEach(function(id){	
		console.log('Removing player : ' + id);
		scene.remove(objects[id]);
		objects[id] = null;
		delete objects[id];
	});
}

function addPlayers(arr){
	arr.forEach(function(id){
		console.log('Adding player : ' + id);
		var player = _.findWhere(players,{id:id});
		var mesh = player.isTag ? monsterMesh.clone() : playerMesh.clone();
		scene.add(mesh);		
		objects[player.id] = mesh;
	});
}

function movePlayers(){
	players.forEach(function(player){
		var mesh = objects[player.id];
		if(!mesh) {
			return;
		}
		mesh.position.x = player.pos.x;
		mesh.position.z = player.pos.y;
	});
}

renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

var render = function () {

	requestAnimationFrame( render );

	movePlayers();

	renderer.render(scene, camera);

};

render();
