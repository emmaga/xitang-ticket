'use strict';

(function() {
  var app = angular.module('app.saleCodeAdd', [ ]);

  app.controller('saleCodeAddController', ['$scope', '$http', '$location',  
    function($scope, $http, $location) {
      // console.log($scope.root.config.requestUrl);
      this.addSaleCode = function() {
        $location.path('/main');
      }
    }
  ]);
})();