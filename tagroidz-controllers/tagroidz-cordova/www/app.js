angular.module('tagroidz',['ngCordova'])

.controller('Maincontroller',function($scope, $cordovaDeviceMotion,$cordovaVibration, $interval,$timeout){
	
	$scope.settings = {
		name:localStorage.name || 'Unnamed player',
		host:localStorage.host,
		shown:false,
		monitor:localStorage.monitor === 'true'
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

	$scope.updatePlayerName = function(){
		localStorage.name = $scope.settings.name;
		socket.emit('rename',$scope.settings.name);
	};

	$scope.updateMonitor = function(){
		localStorage.monitor = $scope.settings.monitor;
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
		
		$scope.$apply(function(){
			$scope.game.message = 'Connected';
		});
		
		$timeout(function(){
			$scope.game.message = '';
		},2000);
	
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
    

})
.directive('popupMessage',function($timeout){
	return function(scope, element, attrs) {
		element.addClass('animated');

		attrs.$observe('message', function(val) {
			if(!val){
				return;
			}

			element.removeClass('bounceOutUp');
			element.html(val).addClass('zoomIn');
			$timeout(function(){
				element.removeClass('zoomIn');
				element.addClass('bounceOutUp');
			},1000);
		});
		
   };
});
