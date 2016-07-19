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
        data = JSON.stringify(data);
        
        this.msg = "登录中...";
        var self = this;
        $http.post(url, data).then(function successCallback(response) {
            var data = response.data;
            if(data.rescode === 200) {
              $cookies.put('token', data.token);
              $cookies.put('account', data.account);
              $cookies.put('userName', data.userName);
              $cookies.put('projectName', data.projectName);
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

    this.userName = $cookies.get('userName');

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
      case 'productAdd':
      case 'saleAdd':
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

    this.init = function() {
      $('.form_date').datetimepicker({
        language:  'zh-CN',
        weekStart: 1,
        todayBtn:  1,
        autoclose: 1,
        todayHighlight: 1,
        startView: 2,
        minView: 2,
        forceParse: 0
      });
    }
  }]);

  app.controller('productEditController', ['$scope', function($scope) {
    console.log('productEdit');
  }]);

  app.controller('productsListController', ['$scope', '$http', '$cookies', 'NgTableParams', 
    function($scope, $http, $cookies, NgTableParams) {
      console.log('productsList');
      var self = this;
      
      // checkbox
      self.checkboxes = { 'checked': false, items: {} };
      
      self.getStatus = function(status) {
        var ret = status === 'on' ? '已启用' : '已禁用';
        return ret;
      }

      self.isOn = function(status) {
        var ret = status === 'on' ? true : false;
        return ret;
      }

      self.getStatusAction = function(status) {
        var ret = status === 'on' ? '禁用' : '启用';
        return ret;
      }

      self.changeStatus = function(status) {
        var c = $scope.root.config;
        var url = c.requestUrl + '/goods' + c.extension;
        var data = {
          "action": "changeStatus",
          "account": $cookies.get('account'),
          "token": $cookies.get('token'),
          "projectName": $cookies.get('projectName'),
          "goodsId": 1,
          "state": status === 'on' ? 'off' : 'on'
        };
        data = JSON.stringify(data);
        
        $http.post(url, data).then(function successCallback(response) {
            var data = response.data;
            if(data.rescode === 200) {
              self.checkboxes = { 'checked': false, items: {} };
              self.loading = false;
              params.total(data.goods.totalCount);
              self.tableData = data.goods.lists;
              return data.goods.lists;
            }else if(data.rescode === 401){
              $location.path('/index');
            }else {
              alert(data.errInfo);
            }  
          }, function errorCallback(response) {
            alert('加载失败，请重试');
          });
      }

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
              var searchName = "";
              if (self.searchName) {
                searchName = self.searchName;
              }

              var c = $scope.root.config;
              var url = c.requestUrl + '/goods' + c.extension;
              var data = {
                "action": "GetList",
                "account": $cookies.get('account'),
                "token": $cookies.get('token'),
                "projectName": $cookies.get('projectName'),
                "sortBy": "createDate",
                "asc": "desc",
                "count": paramsUrl.count, //一页显示数量
                "page": paramsUrl.page,   //当前页
                "search": {
                  "goodsName": searchName //完全匹配查询
                }
              };
              data = JSON.stringify(data);
              self.loading = true;
              
              return $http.post(url, data).then(function successCallback(response) {
                  var data = response.data;
                  if(data.rescode === 200) {
                    self.checkboxes = { 'checked': false, items: {} };
                    self.loading = false;
                    params.total(data.goods.totalCount);
                    self.tableData = data.goods.lists;
                    return data.goods.lists;
                  }else if(data.rescode === 401){
                    $location.path('/index');
                  }else {
                    alert(data.errInfo);
                  }  
                }, function errorCallback(response) {
                  alert('加载失败，请重试');
                });
            }
          }
        );
      }
    }
  ]);

  app.controller('saleListController', ['$scope', '$http', '$cookies', 'NgTableParams', 
    function($scope, $http, $cookies, NgTableParams) {
      console.log('saleList');
      var self = this;
      
      // checkbox
      self.checkboxes = { 'checked': false, items: {} };
      
      // watch for check all checkbox
      $scope.$watch('saleList.checkboxes.checked', function(value) {
          angular.forEach(self.tableData, function(item) {
              if (angular.isDefined(item.id)) {
                self.checkboxes.items[item.id] = value;
              }
          });
      });

      // ngtable
      self.search = function() {
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
              var searchName = "";
              if (self.searchName) {
                searchName = self.searchName;
              }

              var c = $scope.root.config;
              var url = c.requestUrl + '/goods' + c.extension;
              var data = {
                "action": "GetList",
                "account": $cookies.get('account'),
                "token": $cookies.get('token'),
                "projectName": $cookies.get('projectName'),
                "sortBy": "createDate",
                "asc": "desc",
                "count": paramsUrl.count, //一页显示数量
                "page": paramsUrl.page,   //当前页
                "search": {
                  "goodsName": searchName //完全匹配查询
                }
              };
              data = JSON.stringify(data);
              self.loading = true;
              
              return $http.post(url, data).then(function successCallback(response) {
                  var data = response.data;
                  if(data.rescode === 200) {
                    self.checkboxes = { 'checked': false, items: {} };
                    self.loading = false;
                    params.total(data.goods.totalCount);
                    self.tableData = data.goods.lists;
                    return data.goods.lists;
                  }else if(data.rescode === 401){
                    $location.path('/index');
                  }else {
                    alert(data.errInfo);
                  }  
                }, function errorCallback(response) {
                  alert('加载失败，请重试');
                });
            }
          }
        );
      }
    }
  ]);

  app.controller('saleAddController', ['$scope', function($scope) {
    console.log('saleAdd');

    this.init = function() {
      $('.form_date').datetimepicker({
        language:  'zh-CN',
        weekStart: 1,
        todayBtn:  1,
        autoclose: 1,
        todayHighlight: 1,
        startView: 2,
        minView: 2,
        forceParse: 0
      });
    }
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