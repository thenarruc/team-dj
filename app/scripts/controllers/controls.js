'use strict';

/**
 * @ngdoc function
 * @name teamDjApp.controller:ControlsCtrl
 * @description
 * # ControlsCtrl
 * Controller of the teamDjApp
 */
angular.module('teamDjApp')
  .controller('ControlsCtrl', function (player) {
  	if(!player.controlsReady) {
		player.controlsReady = true;
		player.loadPlayer();
  	}
  });
