var players = [];

var socket = io(location.hash.replace('#','')+'/monitor');

var map = {
	width: 512,
	height: 480	
};

var geometry = new THREE.BoxGeometry( 32, 32, 32 );

var texturePlayer = THREE.ImageUtils.loadTexture( "./images/hero.png" );
var textureMonster = THREE.ImageUtils.loadTexture( "./images/monster.png" );

var players = [];

socket.on('disconnect', function(){
	console.log('server disconnect');
	players = [];
});

socket.on('tag', function(data){

	var other = data.other;
	var tagged = data.tagged;

	var meshOther = objects[other.id];
	if(meshOther){
		meshOther.material.map = texturePlayer;
		meshOther.material.map.needsUpdate = true;
	}

	var meshTagged = objects[tagged.id];

	if(meshTagged){
		meshTagged.material.map = textureMonster;
		meshTagged.material.map.needsUpdate = true;
	}

});

socket.on('players', function(pPlayers){

	var oldIds = _.pluck(players,'id');
	var newIds = _.pluck(pPlayers,'id');

	var playersToAdd = _.difference(newIds,oldIds);
	var playersToRemove= _.difference(oldIds,newIds);

	players = pPlayers;

	removePlayers(playersToRemove);
	addPlayers(playersToAdd);

});



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
		var mesh = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({map:player.isTag?textureMonster:texturePlayer}));
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
		mesh.position.y = 16
	});
}

var camera, scene, renderer, dirLight, hemiLight;
var morphs = [];
var stats;

var clock = new THREE.Clock();

init();
animate();

function init() {

	var container = document.getElementById( 'container' );

	camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 1, 5000 );
	camera.position.set( 800, 200, 800 );
	camera.lookAt( new THREE.Vector3(0,0,0) );

	scene = new THREE.Scene();

	scene.fog = new THREE.Fog( 0xffffff, 1, 5000 );
	scene.fog.color.setHSL( 0.6, 0, 1 );

	// LIGHTS

	hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.6 );
	hemiLight.color.setHSL( 0.6, 1, 0.6 );
	hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
	hemiLight.position.set( 0, 500, 0 );
	scene.add( hemiLight );

	//

	dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
	dirLight.color.setHSL( 0.1, 1, 0.95 );
	dirLight.position.set( -1, 1.75, 1 );
	dirLight.position.multiplyScalar( 50 );
	scene.add( dirLight );

	dirLight.castShadow = true;

	dirLight.shadowMapWidth = 2048;
	dirLight.shadowMapHeight = 2048;

	var d = 50;

	dirLight.shadowCameraLeft = -d;
	dirLight.shadowCameraRight = d;
	dirLight.shadowCameraTop = d;
	dirLight.shadowCameraBottom = -d;

	dirLight.shadowCameraFar = 3500;
	dirLight.shadowBias = -0.0001;
	dirLight.shadowDarkness = 0.35;
	//dirLight.shadowCameraVisible = true;

	// GROUND

	var groundGeo = new THREE.PlaneBufferGeometry( 10000, 10000 );
	var groundMat = new THREE.MeshPhongMaterial( { ambient: 0xffffff, color: 0xffffff, specular: 0x050505 } );
	groundMat.color.setHSL( 0.095, 1, 0.75 );

	var ground = new THREE.Mesh( groundGeo, groundMat );
	ground.rotation.x = -Math.PI/2;
	ground.position.y = -33;
	scene.add( ground );

	ground.receiveShadow = true;

	// SKYDOME

	var vertexShader = document.getElementById( 'vertexShader' ).textContent;
	var fragmentShader = document.getElementById( 'fragmentShader' ).textContent;
	var uniforms = {
		topColor: 	 { type: "c", value: new THREE.Color( 0x0077ff ) },
		bottomColor: { type: "c", value: new THREE.Color( 0xffffff ) },
		offset:		 { type: "f", value: 33 },
		exponent:	 { type: "f", value: 0.6 }
	}
	uniforms.topColor.value.copy( hemiLight.color );

	scene.fog.color.copy( uniforms.bottomColor.value );

	var skyGeo = new THREE.SphereGeometry( 4000, 32, 15 );
	var skyMat = new THREE.ShaderMaterial( { vertexShader: vertexShader, fragmentShader: fragmentShader, uniforms: uniforms, side: THREE.BackSide } );

	var sky = new THREE.Mesh( skyGeo, skyMat );
	scene.add( sky );	

	// RING

	var ringGeometry = new THREE.PlaneGeometry( map.width, map.height , 32 );
	var ringMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.5 ,color: 0xffffff, side: THREE.DoubleSide});
	var ring = new THREE.Mesh( ringGeometry, ringMaterial );
	ring.rotation.set(Math.PI/2,0,0);
	ring.position.set(map.width/2,0,map.height/2);
	scene.add( ring );

	// RENDERER

	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setSize( window.innerWidth, window.innerHeight );
	container.appendChild( renderer.domElement );

	renderer.setClearColor( scene.fog.color, 1 );

	renderer.gammaInput = true;
	renderer.gammaOutput = true;

	renderer.shadowMapEnabled = true;
	renderer.shadowMapCullFace = THREE.CullFaceBack;

	// STATS

	stats = new Stats();
	container.appendChild( stats.domElement );

	//

	window.addEventListener( 'resize', onWindowResize, false );

}

function morphColorsToFaceColors( geometry ) {

	if ( geometry.morphColors && geometry.morphColors.length ) {

		var colorMap = geometry.morphColors[ 0 ];

		for ( var i = 0; i < colorMap.colors.length; i ++ ) {

			geometry.faces[ i ].color = colorMap.colors[ i ];

		}

	}

}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}


function animate() {
	requestAnimationFrame( animate );
	movePlayers();
	render();
	stats.update();
}

function render() {	
	renderer.render( scene, camera );
}