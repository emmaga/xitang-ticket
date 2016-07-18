'use strict';

(function() {
  var app = angular.module('app.controllers', [ ]);

  app.controller('loginController', ['$scope', function($scope) {
    // console.log($scope.root.config.requestUrl);
    console.log('login');
  }]);

  app.controller('alertWithChoiseController', ['$scope', function($scope) {
    console.log('alertWithChoise');
  }]);

  app.controller('userListController', ['$scope', function($scope) {
    console.log('userList');
  }]);

  app.controller('applyRolesController', ['$scope', function($scope) {
    console.log('applyRoles');
  }]);

  app.controller('toBeCheckedController', ['$scope', function($scope) {
    console.log('toBeChecked');
  }]);

  app.controller('checkController', ['$scope', function($scope) {
    console.log('check');
  }]);

  app.controller('checkDetailController', ['$scope', function($scope) {
    console.log('checkDetail');
  }]);

  app.controller('checkDetailStatementController', ['$scope', function($scope) {
    console.log('checkDetailStatement');
  }]);

  app.controller('checkStatementController', ['$scope', function($scope) {
    console.log('checkStatement');
  }]);

  app.controller('exportStatementsListController', ['$scope', function($scope) {
    console.log('exportStatementsList');
  }]);

  app.controller('operatingStatementController', ['$scope', function($scope) {
    console.log('operatingStatement');
  }]);

  app.controller('orderDetailController', ['$scope', function($scope) {
    console.log('orderDetail');
  }]);

  app.controller('ordersListController', ['$scope', function($scope) {
    console.log('ordersList');
  }]);

  app.controller('partnerConfigController', ['$scope', function($scope) {
    console.log('partnerConfig');
  }]);

  app.controller('personalInfoController', ['$scope', function($scope) {
    console.log('personalInfo');
  }]);

  app.controller('productAddController', ['$scope', function($scope) {
    console.log('productAdd');
  }]);

  app.controller('productEditController', ['$scope', function($scope) {
    console.log('productEdit');
  }]);

  app.controller('productsListController', ['$scope', function($scope) {
    console.log('productsList');
  }]);

  app.controller('saleListController', ['$scope', function($scope) {
    console.log('saleList');
  }]);

  app.controller('saleAddController', ['$scope', function($scope) {
    console.log('saleAdd');
  }]);

  app.controller('saleCodeAddController', ['$scope', function($scope) {
    console.log('saleCodeAdd');
  }]);

  app.controller('saleCodeAppListController', ['$scope', function($scope) {
    console.log('saleCodeAppList');
  }]);

  app.controller('saleCodeListController', ['$scope', function($scope) {
    console.log('saleCodeList');
  }]);

})();