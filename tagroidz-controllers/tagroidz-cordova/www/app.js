angular.module('tagroidz',['ngCordova'])
.controller('Maincontroller',function($scope, $cordovaDeviceMotion,$cordovaVibration){

	$scope.state = 'Hey move your phone';
	$scope.deviceOrientation = {};
	$scope.acceleration = {};
	$scope.dir = {
		left:false,
		top:false,
		right:false,
		bottom:false
	};

	var socket =  io.connect('http://192.168.1.22:3000/controller');	  

    document.addEventListener('deviceready', function(){

    	var options = { frequency: 100 };
		var Epsilon = 2;

	    $cordovaDeviceMotion.watchAcceleration(options).promise.then(

	      function() {/* unused */},  
	      function(err) {},
	      function(acceleration) {
	      	angular.copy(acceleration,$scope.acceleration);

	      	$scope.dir.up = acceleration.x < -Epsilon;
	      	$scope.dir.bottom = acceleration.x > Epsilon;
	      	$scope.dir.left = acceleration.y < -Epsilon;
	      	$scope.dir.right = acceleration.y > Epsilon;

			socket.emit('dir',$scope.dir);

			if($scope.dir.up 
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
