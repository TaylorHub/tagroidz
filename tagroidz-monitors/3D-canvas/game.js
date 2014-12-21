var players = [];
var objects = {};
var updateFcts	= [];
var scene, renderer, camera,controls;
var mainScale = 100;
var tagSound,musicSound;
var map = {
	width: 512/mainScale,
	height: 480/mainScale,
	blockSize:32/mainScale
};
map.center ={
	x:map.width/2,
	y:0,
	z:map.height/2
};
map.initialCameraPosition = {
	x:map.center.x,
	y:map.height/2,
	z:map.height*2
};
map.mainLightsPosition = {
	x:map.center.x,
	y:map.height,
	z:map.center.z
};
var playerScale = 0.32;
var colors = {
	player:'#00FFFF',
	monster:'#FFFF00',
	invicible:'#FF0000'
};

//////////////////////////////////////////////////////////////////////////////////
//		connect the socket							//
//////////////////////////////////////////////////////////////////////////////////	

var socket = io(location.hash.replace('#','')+'/monitor');

function createSounds(){

	musicSound = new Audio();
	musicSound.src='sound/music.mp3';
	musicSound.oncanplay = function(){
		musicSound.play();
	};

	musicSound.onended = function() {
    	this.currentTime = 0;
    	this.play();
	};

	tagSound = new Audio();
	tagSound.src='sound/wiizp.mp3';
	tagSound.volume=0.2;
}

function makeTagSound(){
	tagSound.currentTime=0;
	tagSound.play();
}

socket.on('tag', function(data){
	makeTagSound();
	var other = data.other;
	var tagged = data.tagged;

	if(objects[other.id]){
		scene.remove(objects[other.id]);		
		objects[other.id] = createPlayerMesh(other.name);
		scene.add(objects[other.id]);	
	}

	if(objects[tagged.id]){
		scene.remove(objects[tagged.id]);
		objects[tagged.id] = createMonsterMesh(tagged.name);
		scene.add(objects[tagged.id]);
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

socket.on('disconnect', function(){
	console.log('server disconnect');
	removePlayers(_.pluck(players,'id'));
});

//////////////////////////////////////////////////////////////////////////////////
//		player meshes						//
//////////////////////////////////////////////////////////////////////////////////	

function createPlayerMesh(name){
	var pacman	= new THREEx.Pacman({		
		text	: name,
		color: colors.player
	})
	pacman.scale.set(playerScale,playerScale,playerScale);

	return pacman;
}

function createMonsterMesh(name){
	var ghost	= new THREEx.Pacman({
		shape	: 'ghost',
		text	: name,
		color	: colors.monster
	});
	ghost.scale.set(playerScale,playerScale,playerScale);
	return ghost;
}

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
		var mesh = player.isTag ? createMonsterMesh(player.name) : createPlayerMesh(player.name);
		mesh.receiveShadow	= true
		mesh.castShadow		= true
		scene.add(mesh);
		objects[player.id] = mesh;

		addSpotLight('white',{
			x: Math.random()*map.width,
			y: map.height / 2,
			z: Math.random()*map.height
		},10,id);

	});
}

function movePlayers(){
	var tag = _.findWhere(players,{isTag:true});
	players.forEach(function(player){
		var mesh = objects[player.id];
		if(!mesh) {
			return;
		}
		mesh.position.x =player.pos.x/mainScale + 0.16;
		mesh.position.z =player.pos.y/mainScale + 0.16;
		mesh.position.y = 0.1;

		if(!player.isTag){
			mesh.lookAt(objects[tag.id].position);
		}else{
			mesh.rotation.y+=0.1
		}
		
		if(player.isInvicible){
			mesh.children[0].material.color.set(colors.invicible);
		}else if(!player.isTag){
			mesh.children[0].material.color.set(colors.player);
		}else{
			mesh.children[0].material.color.set(colors.monster);
		}

	});
}

updateFcts.push(function(){
	movePlayers();
});


function createBorders(){

	var material	= new THREE.MeshPhongMaterial({
		color	: new THREE.Color('gray')
	});

	var borders = [
		{
			w :  map.width - 2*map.blockSize , 
			h  : map.blockSize,
			x : map.width/2 , 
			z: map.blockSize /4,
			l:map.width
		},
		{
			w :  map.width - 2*map.blockSize , 
			h  : map.blockSize,
			x : map.width/2 , 
			z: map.height - map.blockSize /4,
			l:map.width
		},		
		{
			w :  map.blockSize , 
			h  : map.height - 2*map.blockSize,
			x : map.blockSize /4, 
			z: map.height/2,
			l:map.height
		},		
		{
			w :  map.blockSize , 
			h  : map.height - 2*map.blockSize,
			x : map.width - map.blockSize /4,
			z: map.height/2,
			l:map.height
		}
	];

	borders.forEach(function(border){
		var geometry	= new THREE.CubeGeometry( border.w  , border.h , 0.02 , 32 , 2, 32  );
		var mesh	= new THREE.Mesh( geometry, material );
		mesh.receiveShadow	= true
		mesh.castShadow		= true
		mesh.rotateX(Math.PI/2)
		mesh.position.set( border.x , 0.2 , border.z);

		// create a glowMesh
		var glowMesh	= new THREEx.GeometricGlowMesh(mesh)
		mesh.add(glowMesh.object3d)
		var insideUniforms	= glowMesh.insideMesh.material.uniforms
		insideUniforms.glowColor.value.set(0x000000)
		var outsideUniforms	= glowMesh.outsideMesh.material.uniforms
		outsideUniforms.glowColor.value.set(0x00FFFF)

		glowMesh.receiveShadow	= true
		glowMesh.castShadow		= true
		scene.add( mesh );
	});

}

function createWalls(){	

	// Create a giant cube;
	var geometry	= new THREE.CubeGeometry( map.width - map.blockSize * 2 , map.height - map.blockSize * 2  , 0.05 , 16 , 16, 16  );
	var material	= new THREE.MeshPhongMaterial({
		color	: new THREE.Color('gray')
	});
	var mesh	= new THREE.Mesh( geometry, material );
	mesh.receiveShadow	= true
	mesh.castShadow		= true
	mesh.rotateX(Math.PI/2)
	mesh.position.set(  map.width/2 ,0 , map.height/2 );
	scene.add( mesh );

	// add back wall - wireframe
	var material	= new THREE.MeshBasicMaterial({
		wireframe		: true,
		wireframeLinewidth	: 2,
		color			: new THREE.Color('black'),
	});
	var mesh	= new THREE.Mesh( geometry.clone(), material );
	mesh.receiveShadow	= true
	mesh.castShadow		= true
	mesh.scale.multiplyScalar(1.01)
	mesh.rotateX(Math.PI/2)
	mesh.position.set(  map.width/2 ,0 , map.height/2 );
	scene.add( mesh );

}

//////////////////////////////////////////////////////////////////////////////////
//		add a volumetric spotligth					//
//////////////////////////////////////////////////////////////////////////////////
function addSpotLight(color,position,intensity,playerId){

	// add spot light
	var geometry	= new THREE.CylinderGeometry( 0.1, 1.5, 5, 32*2, 20, true);
	geometry.applyMatrix( new THREE.Matrix4().makeTranslation( 0, -geometry.height/2, 0 ) );
	geometry.applyMatrix( new THREE.Matrix4().makeRotationX( -Math.PI / 2 ) );
	var material	= new THREEx.VolumetricSpotLightMaterial()
	var mesh	= new THREE.Mesh( geometry, material );	
	
	mesh.lookAt(map.center);	
	material.uniforms.lightColor.value.set(color)
	material.uniforms.spotPosition.value	= mesh.position	
	material.uniforms.attenuation.value	= 2
	material.uniforms.anglePower.value	= 8

	scene.add( mesh );
	
	var initialPosition = new THREE.Vector3().copy(position);
	mesh.position.copy(position)
	
	//////////////////////////////////////////////////////////////////////////////////
	//		link it with a spotLight					//
	//////////////////////////////////////////////////////////////////////////////////

	var spotLight	= new THREE.SpotLight()
	spotLight.position	= mesh.position
	spotLight.color		= mesh.material.uniforms.lightColor.value
	spotLight.exponent	= 30
	spotLight.angle		= Math.PI/3;
	spotLight.intensity	= intensity
	spotLight.target.position.copy(map.center);
	scene.add( spotLight )
	renderer.shadowMapEnabled	= true

	var light	= spotLight
	light.castShadow	= true
	light.shadowCameraNear	= 0.01
	light.shadowCameraFar	= 15
	light.shadowCameraFov	= 45

	light.shadowCameraLeft	= -8
	light.shadowCameraRight	=  8
	light.shadowCameraTop	=  8
	light.shadowCameraBottom= -8

	// light.shadowCameraVisible = true

	light.shadowBias	= 0.0
	light.shadowDarkness	= 0.5

	light.shadowMapWidth	= 1024
	light.shadowMapHeight	= 1024

	//////////////////////////////////////////////////////////////////////////////////
	//		animate the volumetric spotLight				//
	//////////////////////////////////////////////////////////////////////////////////
	if(playerId){
		updateFcts.push(function(delta, now){	
			var playerMesh = objects[playerId];
			if(playerMesh){
				mesh.lookAt(playerMesh.position)
				spotLight.target.position.copy(playerMesh.position)	
			}
		});
	}else{
		var phase = Math.random() * Math.PI;
		updateFcts.push(function(delta, now){
			var angle	= 0.1 * Math.PI*2*now
			var target	= new THREE.Vector3(1*Math.cos(angle+phase) + Math.sin(angle+phase),0,phase*Math.sin(angle-phase))
			mesh.lookAt(target.add(map.center))
			spotLight.target.position.copy(target)
		})
	}


}
function createLights(){
	// Main spot lights
	addSpotLight('white',map.mainLightsPosition, 2);
	addSpotLight(0xff0080,map.mainLightsPosition, 2);
	addSpotLight(0xff8000,map.mainLightsPosition, 2);
	addSpotLight(0x00FFFF,map.mainLightsPosition, 2);
}


function createCamera(){
	camera	= new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.3, 10000);
	camera.position.copy(map.initialCameraPosition)
	camera.lookAt(map.center)
}

function createMouseControls(){
	controls = new THREE.OrbitControls( camera );
	controls.center.copy(map.center);
	updateFcts.push(function(){
		controls.update();
	});
}

function createSky(){
	// LIGHTS
	hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.1 );
	hemiLight.color.setHSL( 0.6, 1, 0.6 );
	hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
	hemiLight.position.set( 0, 500, 0 );
	scene.add( hemiLight );

	dirLight = new THREE.DirectionalLight( 0xffffff, 0.1 );
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

	// SKYDOME
	var vertexShader = document.getElementById( 'vertexShader' ).textContent;
	var fragmentShader = document.getElementById( 'fragmentShader' ).textContent;
	var uniforms = {
		topColor: 	 { type: "c", value: new THREE.Color( 0x002222) },
		bottomColor: { type: "c", value: new THREE.Color( 0x007777) },
		offset:		 { type: "f", value: 500 },
		exponent:	 { type: "f", value: 0.6 }
	}

	scene.fog.color.copy( uniforms.bottomColor.value );

	var skyGeo = new THREE.SphereGeometry( 4000, 32, 15 );
	var skyMat = new THREE.ShaderMaterial( { vertexShader: vertexShader, fragmentShader: fragmentShader, uniforms: uniforms, side: THREE.BackSide } );

	var sky = new THREE.Mesh( skyGeo, skyMat );
	scene.add( sky );

}

function initScene(){
	//////////////////////////////////////////////////////////////////////////////////
	//		create a renderer							//
	//////////////////////////////////////////////////////////////////////////////////	
	renderer	= new THREE.WebGLRenderer();
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );
	renderer.setClearColor('black', 0 );

	//////////////////////////////////////////////////////////////////////////////////
	//		create a scene							//
	//////////////////////////////////////////////////////////////////////////////////	
	
	scene	= new THREE.Scene();
	scene.fog	= new THREE.FogExp2( 0x000000, 0.1 );

	createCamera();
	createMouseControls();
	

	createWalls();
	createBorders();
	createSky();

	createLights();
	createSounds();

}


updateFcts.push(function(delta, now){
	return;
	var angle	= 0.1 * Math.PI*2*now
	camera.position.y = 1 + 0.2 * Math.cos(angle)
	var tag = _.findWhere(players,{isTag:true});
	if(tag){
		camera.lookAt(objects[tag.id].position)
	}
});	


initScene();

//////////////////////////////////////////////////////////////////////////////////
//		render the scene						//
//////////////////////////////////////////////////////////////////////////////////

updateFcts.push(function(){
	renderer.render(scene, camera);		
});

//////////////////////////////////////////////////////////////////////////////////
//		loop runner							//
//////////////////////////////////////////////////////////////////////////////////
var lastTimeMsec= null;
requestAnimationFrame(function animate(nowMsec){
	requestAnimationFrame( animate );
	// measure time
	lastTimeMsec	= lastTimeMsec || nowMsec-1000/60;
	var deltaMsec	= Math.min(200, nowMsec - lastTimeMsec);
	lastTimeMsec	= nowMsec;
	// call each update function
	updateFcts.forEach(function(updateFn){
		updateFn(deltaMsec/1000, nowMsec/1000);
	});
});