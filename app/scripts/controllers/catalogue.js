'use strict';

/**
 * @ngdoc function
 * @name teamDjApp.controller:CatalogueCtrl
 * @description
 * # CatalogueCtrl
 * Controller of the teamDjApp
 */
angular.module('teamDjApp')
  .controller('CatalogueCtrl', function ($rootScope, $scope, $firebaseObject, Ref, player) {

    $scope.catalogue = $firebaseObject(Ref.child($scope.catalogueName + '/catalogue').orderByChild('score'));

    $scope.newCatalogueName = $scope.catalogueName;

    $scope.changeCatalogueName = function() {
    	$rootScope.catalogueName = player.setCatalogue($scope.newCatalogueName);
	    $scope.catalogue = $firebaseObject(Ref.child($scope.catalogueName + '/catalogue').orderByChild('score'));
    };
  });
