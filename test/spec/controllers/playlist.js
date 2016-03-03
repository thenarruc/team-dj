'use strict';

describe('Controller: PlaylistCtrl', function () {

  // load the controller's module
  beforeEach(module('teamDjApp'));

  var PlaylistCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    PlaylistCtrl = $controller('PlaylistCtrl', {
      $scope: scope
    });
  }));

});

// scope.selectedItemChange({})


// scope.removeTrack()