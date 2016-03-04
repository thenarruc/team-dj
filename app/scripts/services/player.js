'use strict';

/**
 * @ngdoc service
 * @name teamDjApp.player
 * @description
 * # player
 * Service in the teamDjApp.
 */
angular.module('teamDjApp')
  .service('player', function ($rootScope, $window, $firebaseArray, $firebaseObject, Ref, Firebase, $timeout, $cookies) {

    var player = $rootScope.$new(true);
    player.youTubeReady = false;
    player.controlsReady = false;
    player.playerId = null;
    player.player = null;
    player.videoId = null;
    player.height = '390';
    player.width = '640';


    // 3. This function creates an <iframe> (and YouTube player)
    //    after the API code downloads.
    $window.onYouTubeIframeAPIReady = function() {
      player.youTubeReady = true;
      player.loadPlayer();
    };

    player.setCatalogue = function(catalogueName) {
      if(typeof catalogueName === 'undefined') {
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

    player.setCatalogue($rootScope.catalogueName);

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

        if($rootScope.status.controller === $rootScope.controlkey) {
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
        $rootScope.playlist.$loaded(playNext);
      } else {
        player.player = new $window.YT.Player(player.playerId, {
          height: player.height,
          width: player.width,
          videoId: player.videoId,
          playerVars: {
            'iv_load_policy': 3
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
      player.player.playVideo();
    }

    function onYTStateChange(e) {
      var statuses = ['ended', 'playing', 'paused', 'buffering', 'video cued'];
      var statusText = e.data === -1 ? 'unstarted' : statuses[e.data];
      console.log('onStateChange', statusText);
      negotiateControl(function(){
        switch(e.data) {
          case $window.YT.PlayerState.PLAYING:
            $rootScope.status.state = 'playing';
            break;
          case $window.YT.PlayerState.ENDED:
            $rootScope.status.state = 'loading';
            break;
          case $window.YT.PlayerState.PAUSED:
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

    function setStatus() {
      var VIDEO_ID = 'video_id';
      if(!player.player) {
        console.log('No video player');
        return;
      }
      $rootScope.status.ytid = player.player.getVideoData()[VIDEO_ID];
      $rootScope.status.currentTime = player.player.getCurrentTime();
      $rootScope.status.timestamp = Firebase.ServerValue.TIMESTAMP;
      $rootScope.status.$save();
      console.log('Set Status', $rootScope.status);
      ping();
    }

    function ping() {
      console.log('ping');
      var hasControl = $rootScope.status.controller === $rootScope.controlkey;
      if(hasControl) {
        $timeout(setStatus, 10000);
      }
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
          player.loadPlayer(player.videoId, currentTime);
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