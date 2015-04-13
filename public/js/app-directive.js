(function() {
  'use strict';
  angular.module('xinyou')
    .directive('yxInput', function() {
      return {
        restrict: 'A',
        templateUrl: 'yx-input.html',
        scope: false,
      };
    }).directive('yxResults', function() {
      return {
        restrict: 'A',
        templateUrl: 'yx-results.html',
        scope: false,
      };
    }).directive('yxNav', function() {
      return {
        restrict: 'A',
        templateUrl: 'yx-nav.html'
      };
    }).directive('yxInfo', function() {
      return {
        restrict: 'A',
        templateUrl: 'yx-info.html',
        scope: false,
      };
    }).directive('yxInfoGame', function() {
      return {
        restrict: 'A',
        templateUrl: 'yx-info-game.html',
        scope: false,
      };
    }).directive('yxInfoGl', function() {
      return {
        restrict: 'A',
        templateUrl: 'yx-info-gl.html',
        scope: false,
      };
    });

}());