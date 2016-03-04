'use strict';

/**
 * @ngdoc function
 * @name teamDjApp.controller:PlaylistCtrl
 * @description
 * # PlaylistCtrl
 * Controller of the teamDjApp
 */
angular.module('teamDjApp')
  .controller('PlaylistCtrl', function ($scope, Auth, Ref, $firebaseArray, $firebaseObject, YOUTUBE_API_KEY) {
    $scope.$root.activetab = 'playlist';

  	var $uid = Auth.$getAuth().uid;
    // $scope.votes = $firebaseObject(Ref.child($scope.catalogueName + '/votes/' + $uid));

	$scope.querySearch = function() {
		if($scope.searchText.length < 3) {
			return true;
		}
		var deferred = angular.element.Deferred();
		angular.element.ajax({
			url: 'https://www.googleapis.com/youtube/v3/search?type=video&videoEmbeddable=true&saveSearch=moderate&part=snippet&fields=items(id%2Csnippet(title%2Cdescription))&key=' + YOUTUBE_API_KEY + '&q=' + $scope.searchText,
			dataType: 'jsonp',
			success: function(data) {
				var results = angular.element.map( data.items, function(item) {
					return {
						ytid: item.id.videoId,
						user: $uid,
						title: item.snippet.title,
						summary: item.snippet.description
					};
				});
				deferred.resolve(results);
			}
		});
		return deferred.promise();
	};

	$scope.selectedItemChange = function(item) {
		if(!item) {
			return;
		}
		// console.log('Select Item', item);
		addTrack(item);
		$scope.searchText = '';
	};

	$scope.removeTrack = function(ytid) {
		console.log('Remove', ytid);
	};

	function addTrack(item) {
		console.log('ADD TRACK', item);
		addToCatalogue(item);
		addToPlaylist(item);
		castVote(item.ytid, 1);
	}

	function addToCatalogue(item) {
		var track = $firebaseObject(Ref.child($scope.catalogueName + '/catalogue/' + item.ytid));
		track.$loaded(function(){
			if (!track.$value) {
				track.title = item.title;
				track.summary = item.summary;
				track.score = 0;

				track.$save();
				$scope.catalogueItems.$add(item.ytid);
				$
			} else {
				console.log("Track exists", $scope.catalogueName + '/catalogue/' + item.ytid);
			}
		});

	}

	function addToPlaylist(item) {
		// Add to playlist
		var track = $scope.playlist[item.ytid];

		if(!track) {
			// var position = Math.round($playlist.length * Math.rand());
			$scope.playlist.$add({
				ytid: item.ytid,
				title: item.title,
				summary: item.summary,
				user: $uid,
				position: Math.random()
			});
		}
	}

	function castVote(ytid, newVote) {
		var vote = $firebaseObject(Ref.child($scope.catalogueName + '/votes/' + $uid + "/" + ytid));

		vote.$loaded(function(){
			var diff = 0;
			if(!vote.$value) {
				diff = newVote;
			} else {
				diff = newVote - vote.$value;
			}
			vote.$value = newVote;
			vote.$save();
			if(diff !== 0) {
				var track = $firebaseObject(Ref.child($scope.catalogueName + '/catalogue/'+ ytid));
				track.$loaded(function(){
					console.log("Current Score", track.score);
					track.score += diff;
					track.$save();
				});
			}
		});
	}

  });
