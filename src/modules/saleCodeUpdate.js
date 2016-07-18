'use strict';

(function() {
  var app = angular.module('app.saleCodeUpdate', [ ]);

  app.controller('saleCodeUpdateController', ['$scope', '$http', '$location', '$state', '$stateParams', 
    function($scope, $http, $location, $state, $stateParams) {
      // console.log($scope.root.config.requestUrl);
      console.log($stateParams.saleCodeID);
    }
  ]);
})();