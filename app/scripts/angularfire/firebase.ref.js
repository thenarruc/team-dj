angular.module('firebase.ref', ['firebase', 'firebase.config', 'teamDjApp.config'])
  .factory('Ref', ['$window', 'FIREBUG_URL', function($window, FIREBUG_URL) {
    'use strict';
    return new $window.Firebase(FIREBUG_URL);
  }]);
