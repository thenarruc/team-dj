'use strict';

/**
 * @ngdoc function
 * @name teamDjApp.controller:CatalogueCtrl
 * @description
 * # CatalogueCtrl
 * Controller of the teamDjApp
 */
angular.module('teamDjApp')
  .controller('CatalogueCtrl', function ($rootScope, $scope, $firebaseObject, $firebaseArray, Ref, player, user) {

    $rootScope.activetab = 'catalogue';

    $scope.changeCatalogueName = function() {
    	$rootScope.catalogueName = player.setCatalogue($scope.newCatalogueName);
    	var a = Ref.child($scope.catalogueName + '/catalogue');
    	var b = a.orderByChild('score');
    	console.log(b);
	    $scope.test1 = $firebaseObject(a);
	    $scope.test2 = $firebaseArray(b);
	    $scope.catalogue = $firebaseArray(Ref.child($scope.catalogueName + '/catalogue').orderByChild('score')).reverse();
	    $scope.votes = $firebaseObject(Ref.child($scope.catalogueName + '/votes/' + user.uid));
    };
    $scope.newCatalogueName = $scope.catalogueName;
    $scope.changeCatalogueName();

    $scope.getVote = function(ytid) {
    	if($scope.votes && $scope.votes[ytid]) {
    		return $scope.votes[ytid];
    	}
    };

    $scope.tune = function(ytid) {
		var vote = $firebaseObject(Ref.child($scope.catalogueName + '/votes/' + user.uid + '/' + ytid));
		vote.$loaded(function(){
			if(vote.$value === 1) {
				castVote(ytid, vote, 0);
			} else {
				castVote(ytid, vote, 1);
			}
		});
		console.log(this);
    };
    $scope.shame = function(ytid) {
		var vote = $firebaseObject(Ref.child($scope.catalogueName + '/votes/' + user.uid + '/' + ytid));
		vote.$loaded(function(){
			if(vote.$value === -1) {
				castVote(ytid, vote, 0);
			} else {
				castVote(ytid, vote, -1);
			}
		});
    };

	function castVote(ytid, vote, newVote) {
		var diff = 0;
		if(!vote.$value) {
			diff = newVote;
		} else {
			diff = newVote - vote.$value;
		}
		console.log('VOTE', ytid, vote.$value, newVote, diff);
		vote.$value = newVote;
		vote.$save();
		if(diff !== 0) {
			var trackRef = Ref.child($scope.catalogueName + '/catalogue/'+ ytid);
			trackRef.once('value', function(track){
				console.log('track', track.val());
				trackRef.update({'score':track.val().score + diff});
			});
			/*
			update({'score':});
			);
			track.$loaded(function(){
				console.log('Old Score', track.score);
				// track.score += diff;
				if(!track.score) {

					track.score = 0;
				}
				track.score += diff;
				console.log('New Score', track.score);
				track.$save();
			});
			*/
		}
	}

	$scope.getScore = function(ytid, track){
		return 'score.' + ytid + '.p.' + track.score;
	};

	$scope.isInPlaylist = function(ytid) {
		for (var i = $scope.playlist.length - 1; i >= 0; i--) {
			if($scope.playlist[i].ytid === ytid) {
				return true;
			}
		}
		return false;
	};

	$scope.addToPlaylist = function(item) {
		if($scope.isInPlaylist(item.ytid)) {
			return;
		}

		$firebaseObject(Ref.child('users/'+user.uid)).$loaded(function(profile){
			$scope.playlist.$add({
				ytid: item.ytid,
				title: item.title,
				summary: item.summary,
				user: user.uid,
				username: profile.name,
				position: Math.random()
			});
		});
	};

  });
