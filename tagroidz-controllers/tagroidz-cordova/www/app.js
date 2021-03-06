angular.module('tagroidz',['ngCordova'])
.controller('Maincontroller',function($scope, $cordovaDeviceMotion,$cordovaVibration, $interval,$timeout){

	$scope.state = 'Hey move your phone';
	$scope.deviceOrientation = {};
	$scope.acceleration = {};
	$scope.settings = {
		name:localStorage.name || 'Unnamed player',
		host:localStorage.host || 'http://localhost:3000',
		shown:false
	};

	$scope.dir = {
		left:false,
		top:false,
		right:false,
		bottom:false
	};

	$scope.game = {
		message:''
	};

	var socket =  io.connect($scope.settings.host + '/controller');
	  
	addEventListener('keydown',function(e){
		$scope.dir.left = e.keyCode == 37;
		$scope.dir.top = e.keyCode == 38;
		$scope.dir.right = e.keyCode == 39;
		$scope.dir.bottom = e.keyCode == 40;
		socket.emit('state',angular.toJson($scope.dir));
	});

	addEventListener('keyup',function(e){
		$scope.dir.left = !e.keyCode == 37;
		$scope.dir.top = !e.keyCode == 38;
		$scope.dir.right = !e.keyCode == 39;
		$scope.dir.bottom = !e.keyCode == 40;
		socket.emit('state',angular.toJson($scope.dir));
	});

	$scope.updatePlayerName = function(){
		localStorage.name = $scope.settings.name;
		socket.emit('rename',$scope.settings.name);
	};

	$scope.updateHost = function(){
		localStorage.host = $scope.settings.host;
		setTimeout(function(){
			location.reload();
		},100);		
	};

	$scope.onButton = function(name){
		socket.emit('button', name);
	};

	socket.on('connect',function(){
		console.log('connection succes');
    	socket.emit('rename',$scope.settings.name);
	});

	socket.on('tag',function(){
		$scope.game.message = 'PAF !';
		$cordovaVibration.vibrate([150,50,150,30,150,20,150]);
	});

    document.addEventListener('deviceready', function(){


    	var options = { frequency: 100 };
		var Epsilon = 2;
		var xDelta = 4;

	    $cordovaDeviceMotion.watchAcceleration(options).promise.then(

	      function() {/* unused */},  
	      function(err) {},
	      function(acceleration) {
	      	angular.copy(acceleration,$scope.acceleration);

	      	$scope.dir.top = acceleration.x < -Epsilon + xDelta;
	      	$scope.dir.bottom = acceleration.x > Epsilon + xDelta;

	      	$scope.dir.left = acceleration.y < -Epsilon;
	      	$scope.dir.right = acceleration.y > Epsilon;	      	

			socket.emit('state',angular.toJson($scope.dir));

			if($scope.dir.top 
				|| $scope.dir.bottom
				|| $scope.dir.left
				|| $scope.dir.right
				){
				// lol 	
				// $cordovaVibration.vibrate(95);
			}

	    });

    }, false);

});
