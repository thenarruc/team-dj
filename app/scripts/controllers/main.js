'use strict';

/**
 * @ngdoc function
 * @name teamDjApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the teamDjApp
 */
angular.module('teamDjApp')
  .controller('MainCtrl', function ($rootScope) {
    $rootScope.activetab = 'main';
  });
