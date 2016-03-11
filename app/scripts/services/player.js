'use strict';

/**
 * @ngdoc service
 * @name teamDjApp.player
 * @description
 * # player
 * Service in the teamDjApp.
 */
angular.module('teamDjApp')
  .service('player', function ($rootScope, $window, $firebaseArray, $firebaseObject, Ref, Firebase, $timeout, $cookies, Auth, DEV) {

    var player = $rootScope.$new(true);
    player.youTubeReady = false;
    player.controlsReady = false;
    player.playerId = null;
    player.player = null;
    player.videoId = null;
    player.height = '390';
    player.width = '640';

    $rootScope.hasControl = false;

    // 3. This function creates an <iframe> (and YouTube player)
    //    after the API code downloads.
    $window.onYouTubeIframeAPIReady = function() {
      player.youTubeReady = true;
      player.loadPlayer();
    };

    player.setCatalogue = function(catalogueName) {
      if(!catalogueName || typeof catalogueName === 'undefined') {
        catalogueName = '';
      }
      catalogueName = catalogueName
        .toLowerCase()
        .replace(/[ _-]+/,'_')
        .replace(/[^_a-z0-9]/g,'');
      if(!catalogueName) {
        catalogueName = 'default_catalogue';
      }

      $rootScope.catalogueName = catalogueName;
      $rootScope.playlist = $firebaseArray(Ref.child(catalogueName + '/playlist').orderByChild('position'));
      $rootScope.catalogueItems = $firebaseArray(Ref.child(catalogueName + '/catalogue_items'));
      $rootScope.status = $firebaseObject(Ref.child(catalogueName + '/status'));
      if(!($rootScope.controlkey = $cookies.get('controlkey'))) {
        $cookies.put('controlkey', Math.random());
        $rootScope.controlkey = $cookies.get('controlkey');
      }

      return catalogueName;
    };

    Auth.$onAuth(function(authData){
      if(authData) {
        player.setCatalogue($rootScope.catalogueName);
      } else {
        $rootScope.playlist = null;
        $rootScope.catalogueItems = null;
        $rootScope.status = null;
      }
    });
    if(DEV) {
      $window.Firebase.goOffline();
      $rootScope.status.state = 'playing';

    }

    player.loadPlayer = function() {
      console.log('Load Player',
        player.youTubeReady ? 'yt_ready' : 'yt_not_ready',
        player.controlsReady ? 'ctrl_ready' : 'ctrl_not_ready',
        '#' + player.playerId, player.videoId);

      if(player.youTubeReady && player.controlsReady && player.playerId) {
        if(player.player) {
          player.player.destroy();
        }
        createPlayer();
      }
    };

    function negotiateControl(onSuccess, onFail) {
      $rootScope.status.$loaded(function(){
        var currentTime = new Date().getTime();
        var takeoverTime = currentTime + 30000; // 30 seconds in the future

        console.log('negotiateControl', $rootScope.status.controller, $rootScope.controlkey, $rootScope.status.timestamp - takeoverTime);

        if(hasControl()) {
          console.log('I already have control');
          onSuccess();
          return;
        }

        $rootScope.status.$ref().transaction(function(currentStatus){
          console.log('current status', currentStatus);
          if(currentStatus === null) {
            currentStatus = {};
          }
          if(typeof currentStatus.controller === 'undefined' || currentTime - currentStatus.timestamp > 30000) {
            console.log('I\'m going to try taking control');
            currentStatus.controller = $rootScope.controlkey;
            currentStatus.timestamp = Firebase.ServerValue.TIMESTAMP;
            return currentStatus;
          }
          return;
        }, function(error, committed) {
          if(error) {
            console.log('Transaction failed', error);
          } else if (!committed) {
            console.log('I do not have control');
            if(onFail) {
              onFail();
            }
          } else {
            console.log('I have control. Executing callback');
            onSuccess();
          }
        });
      });

    }

    function createPlayer() {
      console.log('create player', player.playerId, player.videoId);
      if(!player.videoId) {
        $rootScope.status.$loaded(function(){
          if($rootScope.status.ytid) {
            player.videoId = $rootScope.status.ytid;
            createPlayer();
          }
          // $rootScope.playlist.$loaded(playNext);
        });
      } else {
        player.player = new $window.YT.Player(player.playerId, {
          height: player.height,
          width: player.width,
          videoId: player.videoId,
          playerVars: {
            'iv_load_policy': 3,
            'modestbranding': 1
          },
          events: {
            'onReady': onYTReady,
            'onStateChange': onYTStateChange,
            'onError': onYTError
          }
        });
      }
    }

    function onYTReady() {
      player.state = 'playing';
      player.player.getIframe().classList.add('ebmed-responsive-item');
      if(player.videoId === $rootScope.status.ytid) {
        // Video is already playing elsewhere
        player.player.loadVideoById(player.videoId, $rootScope.status.currentTime);
      } else {
        player.player.playVideo();
      }
    }

    function onYTStateChange(e) {
      negotiateControl(function(){
        if(e.data === $window.YT.PlayerState.PAUSED) {
          // relinquish control
          $rootScope.status.controller = null;
        }
        setStatus();
      });
      if(e.data === $window.YT.PlayerState.ENDED) {
        playNext();
      }
    }

    function onYTError(e) {
      switch(e.data) {
        case 2:
          console.error('The request contains an invalid parameter value.', player);
          break;
        case 5:
          console.error('The requested content cannot be played in an HTML5 player or another error related to the HTML5 player has occurred.');
          break;
        case 100:
          console.error('The video requested was not found.', player);
          break;
        case 101:
        case 150:
          console.error('The owner of the requested video does not allow it to be played in embedded players.', player);
          break;
        default:
          console.error('Unknown error', e, player);
      }
    }

    function hasControl() {
      $rootScope.hasControl = $rootScope.status.controller === $rootScope.controlkey;
      return $rootScope.hasControl;
    }

    function setStatus() {
      if(!player.player) {
        console.log('No video player');
        return;
      }
      if(hasControl()) {
        var STATUSES = ['ended', 'playing', 'paused', 'buffering', 'video cued'];
        var VIDEO_ID = 'video_id', TITLE = 'title';
        var state = player.player.getPlayerState();
        var statusText = state === -1 ? 'unstarted' : STATUSES[state];
        console.log('Setting state to', statusText);
        $rootScope.status.state = statusText;
        $rootScope.status.timestamp = Firebase.ServerValue.TIMESTAMP;
        var videoData = player.player.getVideoData();
        $rootScope.status.ytid = videoData[VIDEO_ID];
        $rootScope.status.title = videoData[TITLE];
        $rootScope.status.currentTime = player.player.getCurrentTime();
        $rootScope.status.duration = player.player.getDuration();
        $rootScope.status.currentTimeStr = timeToString($rootScope.status.currentTime);
        $rootScope.status.durationStr = timeToString($rootScope.status.duration);
        if($rootScope.status.duration && $rootScope.status.duration > 0) {
          $rootScope.status.progress = Math.ceil($rootScope.status.currentTime / $rootScope.status.duration * 100);
        } else {
          $rootScope.status.progress = 0;
        }

        $rootScope.status.$save();
        ping();
      }
    }

    function ping() {
      if(hasControl() && $rootScope.status.state === 'playing') {
        $timeout.cancel($rootScope.statusTimeout);
        $rootScope.statusTimeout = $timeout(setStatus, 2000);
      }
    }

    function timeToString(time) {
      var mins = Math.floor(time / 60);
      var secs = Math.round(time - mins * 60);
      if(secs < 10) {
        secs = '0' + secs;
      }
      return mins + ':' + secs;
    }

    function playNext() {
      console.log('Play the next video');
      var currentTime = 0;
      negotiateControl(function(){
        console.log('Let me pick a track');
        if($rootScope.playlist.length) {
          var firstInPlaylist = $rootScope.playlist[0];
          player.videoId = firstInPlaylist.ytid;
          $rootScope.playlist.$remove(firstInPlaylist);
          console.log('Next track will be', player.videoId);
          // $rootScope.playlist.$save();
        } else if($rootScope.catalogueItems.length) {
          var trackToPlay = Math.floor($rootScope.catalogueItems.length * Math.random());
          player.videoId = $rootScope.catalogueItems[trackToPlay].$value;
          console.log('Next track is from the catalogue.', trackToPlay, player.videoId);
        } else {
          console.log('There is nothing to play.  Not even in the catalogue!');
          return;
        }
        if(player.player) {
          player.player.loadVideoById(player.videoId, currentTime);
        } else {
          console.log('Create the player 1');
          player.loadPlayer();
        }
      }, function() {
        console.log('Use the currently playing track', $rootScope.status.ytid);
        if(!$rootScope.status.ytid) {
          console.error('There is no track to play!');
          return;
        }
        player.videoId = $rootScope.status.ytid;
        currentTime = $rootScope.status.currentTime;
        if(player.player) {
          player.player.loadVideoById(player.videoId, currentTime);
        } else {
          console.log('Create the player 2');
          player.loadPlayer();
        }
      });
    }

    $window.ytplayer = player;

    return player;

  })
  .run(function () {
    // 2. This code loads the IFrame Player API code asynchronously.
    var tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  });