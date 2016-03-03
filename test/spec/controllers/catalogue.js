'use strict';

describe('Controller: CatalogueCtrl', function () {

  // load the controller's module
  beforeEach(module('teamDjApp'));

  var CatalogueCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    CatalogueCtrl = $controller('CatalogueCtrl', {
      $scope: scope
    });
  }));

});
