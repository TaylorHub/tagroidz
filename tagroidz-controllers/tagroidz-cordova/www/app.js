angular.module('tagroidz',['ngCordova'])
.controller('Maincontroller',function($scope, $cordovaDeviceMotion,$cordovaVibration, $interval){

	$scope.state = 'Hey move your phone';
	$scope.deviceOrientation = {};
	$scope.acceleration = {};
	$scope.dir = {
		left:false,
		top:false,
		right:false,
		bottom:false
	};

	var socket =  io.connect('http://192.168.1.37:3000/controller');
	  
	addEventListener('keydown',function(e){
		$scope.dir.left = e.keyCode == 37;
		$scope.dir.top = e.keyCode == 38;
		$scope.dir.right = e.keyCode == 39;
		$scope.dir.bottom = e.keyCode == 40;
	});

	$interval(function(){
		socket.emit('state',angular.toJson($scope.dir));
	},100)

    document.addEventListener('deviceready', function(){

    	var options = { frequency: 100 };
		var Epsilon = 2;

	    $cordovaDeviceMotion.watchAcceleration(options).promise.then(

	      function() {/* unused */},  
	      function(err) {},
	      function(acceleration) {
	      	angular.copy(acceleration,$scope.acceleration);

	      	$scope.dir.top = acceleration.x < -Epsilon;
	      	$scope.dir.bottom = acceleration.x > Epsilon;
	      	$scope.dir.left = acceleration.y < -Epsilon;
	      	$scope.dir.right = acceleration.y > Epsilon;

			socket.emit('dir',$scope.dir);

			if($scope.dir.top 
				|| $scope.dir.bottom
				|| $scope.dir.left
				|| $scope.dir.right
				){
				// lol 	
				 //$cordovaVibration.vibrate(95);
			}

	    });

    }, false);

});
