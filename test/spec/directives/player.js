'use strict';

describe('Directive: player', function () {

  // load the directive's module
  beforeEach(module('teamDjApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should have id \'player\'', inject(function ($compile, $log) {
    element = angular.element('<player id="player"></player>');
    // element = $compile(element)(scope);
    $log.debug('THE ID IS ', element.attr('id'));
    expect(element.attr('id')).toBe('player');
  }));
});
