'use strict';

(function() {
  var app = angular.module('app.controllers', ['ngCookies', 'ngTable', 'ngResource']);

  app.controller('loginController', ['$scope', '$location', '$http', '$cookies', 
    function($scope, $location, $http, $cookies) {
    
      console.log('login');
      this.login = function() {
        var c = $scope.root.config;
        var url = c.requestUrl + '/login' + c.extension;
        var data = {
          "action": "GetToken",
          "account": this.account,
          "password": this.password,
          "projectName": this.projectName
        };
        
        this.msg = "登录中...";
        var self = this;
        $http.post(url, data).then(function successCallback(response) {
            var data = response.data;
            if(data.rescode === 200) {
              $cookies.put('token', data.token);
              $location.path('/ordersList');
            }else {
              self.msg = data.errInfo;
            }
          }, function errorCallback(response) {
            self.msg = "登录失败";
          });
      }
    }
  ]);

  app.controller('mainController', ['$scope', '$location', '$cookies', '$state', function($scope, $location, $cookies, $state) {
    console.log('main');

    if ($cookies.get('token') === "") {
      $location.path('/index');
    }

    this.logout = function() {
      $cookies.put('token', '');
      $location.path('/index');
    };

    var stateName = $state.current.name;
    $scope.$state = '';

    switch (stateName) {
      case 'ordersList':
      case 'toBeChecked':
        $scope.$state = 'orders';
        break;
      case 'productsList':
      case 'saleList':
      case 'partnerConfig':
        $scope.$state = 'products';
        break;  
      case 'exportStatementsList':
      case 'checkDetailStatement':
      case 'operatingStatement':
      case 'checkStatement':
        $scope.$state = 'statement';
        break;
      case 'userList':
        $scope.$state = 'admin';
        break;  
    }

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

  app.controller('productsListController', ['$scope', 'NgTableParams', '$resource', function($scope, NgTableParams, $resource) {
    console.log('productsList');
      var self = this;
      
      // checkbox
      self.checkboxes = { 'checked': false, items: {} };
      
      // watch for check all checkbox
      $scope.$watch('productsList.checkboxes.checked', function(value) {
          angular.forEach(self.tableData, function(item) {
              if (angular.isDefined(item.id)) {
                self.checkboxes.items[item.id] = value;
              }
          });
      });

      // ngtable
      self.search = function() {
        self.loading = true;
        self.initTable();
        self.tableParams = new NgTableParams(
          {
            page: 1, 
            count: 15,
            url: ''
          }, 
          {
            counts: [15, 30],
            getData: function(params) {
              var paramsUrl = params.url();
              if (self.searchName) {
                paramsUrl.searchName = self.searchName;
              }
              return $resource('api/productsList.php').query(paramsUrl).$promise.then(function(result){
                self.loading = false;
                params.total(30);
                self.tableData = result;
                return result;
              });
            }
          }
        );
      }

      // initTable
      self.initTable = function() {

        // checkbox
        self.checkboxes = { 'checked': false, items: {} };
      }
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