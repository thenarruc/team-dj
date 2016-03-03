'use strict';

/**
 * @ngdoc directive
 * @name teamDjApp.directive:player
 * @description
 * # player
 */
angular.module('teamDjApp')
  .directive('player', function (player) {
    return {
      // template: '<div class="embed-responsive embed-responsive-16by9"><button type="button" class="btn btn-default">Start Playlist</button></div>',
      restrict: 'E',
      link: function postLink(scope, element, attrs) {
      	var id = attrs.id || 'player';
      	element.attr('id', id);
      	player.playerId = id;
        // player.loadPlayer();
      }
    };
  });