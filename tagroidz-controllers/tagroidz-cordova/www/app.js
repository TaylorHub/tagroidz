angular.module('tagroidz',['ngCordova'])

.controller('Maincontroller',function($scope, $cordovaDeviceMotion,$cordovaVibration, $interval,$timeout){
	
	$scope.settings = {
		name:localStorage.name || 'Unnamed player',
		host:localStorage.host || '',
		shown:false
	};
	
	$scope.orientation = {
		msg: '',
		shown: false,
		shownStartButton: false
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
		$timeout(function(){
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
		$cordovaVibration.vibrate([25,50,25,50,25,50,25]);
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
	    });

    }, false);
    
    
    
    if (window.DeviceOrientationEvent) {
    	
    	//Assure that user hold is phone in landscape-primary and that he lock screen rotation
    	if(window.orientation !== undefined){
	    	var reorient = function() {
				if (window.orientation === 90) {
					$scope.orientation.msg = 'Perfect ! Now lock screen rotation from your phone settings then click OK';
				  	$scope.orientation.shownStartButton = true;
				} else {
					$scope.orientation.msg = 'Please turn your phone in landscape orientation';
					$scope.orientation.shownStartButton = false;
				  	$scope.orientation.shown = true;
				}
				$scope.$apply();
			};
			
			window.addEventListener('orientationchange', function(){
				reorient();
			});
			reorient();
    	}
    	
    	var options = { frequency: 100 };
		var Epsilon = 4;
		var xDelta = -20;
		
		window.addEventListener('deviceorientation', function (eventData) {
			
	      	$scope.dir.bottom = eventData.gamma < -Epsilon + xDelta;
	      	$scope.dir.top = eventData.gamma > Epsilon + xDelta;

	      	$scope.dir.left = eventData.beta < -Epsilon;
	      	$scope.dir.right = eventData.beta > Epsilon;
	      	
	      	$scope.$apply();

			socket.emit('state', angular.toJson($scope.dir));
		});
	}
	
	
    
   /* var lockOrientation = screen.lockOrientation || screen.mozLockOrientation || screen.msLockOrientation;
	if (lockOrientation && lockOrientation("landscape-primary")) {
	} else {
	 	alert('Please lock your screen orientation from your phone settings');
	}*/
	
	

});
