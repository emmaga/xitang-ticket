'use strict';

(function() {
  var app = angular.module('app.controllers', ['ngCookies', 'ngTable']);

  app.controller('loginController', ['$scope', '$location', '$http', '$cookies', 
    function($scope, $location, $http, $cookies) {
      console.log('login');
      var self = this;

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
      case 'goodsList':
      case 'saleList':
      case 'partnerConfig':
      case 'goodsAdd':
      case 'goodsEdit':
      case 'saleAdd':
      case 'saleEdit':
        $scope.$state = 'goods';
        break;  
      case 'exportStatementsList':
      case 'checkDetailStatement':
      case 'operatingStatement':
      case 'checkStatement':
        $scope.$state = 'statement';
        break;
      case 'userList':
      case 'userAdd':
        $scope.$state = 'admin';
        break;  
    }

  }]);

  app.controller('alertWithChoiseController', ['$scope', function($scope) {
    console.log('alertWithChoise');
    var self = this;
  }]);

  app.controller('userListController', ['$scope', '$http', '$cookies', '$location', '$window', 'NgTableParams',
    function($scope, $http, $cookies, $location, $window, NgTableParams) {
      console.log('userList');
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

      self.isChecked = function() {
        var ret = false;
        var keepGoing = true;
        angular.forEach(self.checkboxes.items, function(value, key) {
          if(keepGoing) {
            if(value === true){
              ret = true;
              keepGoing = false;
            }
          }
        });
        return ret;
      }

      self.getStatusAction = function(status) {
        var ret = status === 'on' ? '禁用' : '启用';
        return ret;
      }

      self.delete = function() {
        if(!confirm('确定删除？')) {
          return;
        }
        
        var goods = [];
        angular.forEach(self.checkboxes.items, function(value, key) {
          if(value === true) {
            goods.push({"id": key});
          }
        });
        var c = $scope.root.config;
        var url = c.requestUrl + '/goods' + c.extension;
        var data = {
          "action": "Delete",
          "account": $cookies.get('account'),
          "token": $cookies.get('token'),
          "projectName": $cookies.get('projectName'),
          "goods": goods
        };
        data = JSON.stringify(data);
        
        $http.post(url, data).then(function successCallback(response) {
            var data = response.data;
            if(data.rescode === 200) {
              $window.location.reload();
            }else if(data.rescode === 401){
              $location.path('/index');
            }else {
              alert(data.errInfo);
            }  
          }, function errorCallback(response) {
            alert('删除失败，请重试');
          });
      }

      self.changeStatus = function(status) {
        var c = $scope.root.config;
        var url = c.requestUrl + '/goods' + c.extension;
        var data = {
          "action": "ChangeStatus",
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
              alert('启用／禁用 设置成功！');
              $window.location.reload();
            }else if(data.rescode === 401){
              $location.path('/index');
            }else {
              alert(data.errInfo);
            }  
          }, function errorCallback(response) {
            alert('设置失败，请重试');
          });
      }

      // watch for check all checkbox
      $scope.$watch('userList.checkboxes.checked', function(value) {
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
                "sortBy": "CreateTime",
                "orderBy": "desc",
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

  app.controller('applyRolesController', ['$scope', function($scope) {
    console.log('applyRoles');
    var self = this;
  }]);

app.controller('toBeCheckedController', ['$scope', '$http', '$cookies', '$location', '$window', 'NgTableParams',
    function($scope, $http, $cookies, $location, $window, NgTableParams) {
      console.log('toBeChecked');
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

      self.isChecked = function() {
        var ret = false;
        var keepGoing = true;
        angular.forEach(self.checkboxes.items, function(value, key) {
          if(keepGoing) {
            if(value === true){
              ret = true;
              keepGoing = false;
            }
          }
        });
        return ret;
      }

      self.getStatusAction = function(status) {
        var ret = status === 'on' ? '禁用' : '启用';
        return ret;
      }

      self.delete = function() {
        if(!confirm('确定删除？')) {
          return;
        }
        
        var goods = [];
        angular.forEach(self.checkboxes.items, function(value, key) {
          if(value === true) {
            goods.push({"id": key});
          }
        });
        var c = $scope.root.config;
        var url = c.requestUrl + '/goods' + c.extension;
        var data = {
          "action": "Delete",
          "account": $cookies.get('account'),
          "token": $cookies.get('token'),
          "projectName": $cookies.get('projectName'),
          "goods": goods
        };
        data = JSON.stringify(data);
        
        $http.post(url, data).then(function successCallback(response) {
            var data = response.data;
            if(data.rescode === 200) {
              $window.location.reload();
            }else if(data.rescode === 401){
              $location.path('/index');
            }else {
              alert(data.errInfo);
            }  
          }, function errorCallback(response) {
            alert('删除失败，请重试');
          });
      }

      self.changeStatus = function(status) {
        var c = $scope.root.config;
        var url = c.requestUrl + '/goods' + c.extension;
        var data = {
          "action": "ChangeStatus",
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
              alert('启用／禁用 设置成功！');
              $window.location.reload();
            }else if(data.rescode === 401){
              $location.path('/index');
            }else {
              alert(data.errInfo);
            }  
          }, function errorCallback(response) {
            alert('设置失败，请重试');
          });
      }

      // watch for check all checkbox
      $scope.$watch('toBeChecked.checkboxes.checked', function(value) {
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
                "sortBy": "CreateTime",
                "orderBy": "desc",
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

  app.controller('checkController', ['$scope', function($scope) {
    console.log('check');
    var self = this;
  }]);

  app.controller('checkDetailController', ['$scope', function($scope) {
    console.log('checkDetail');
    var self = this;
  }]);

  app.controller('checkDetailStatementController', ['$scope', function($scope) {
    console.log('checkDetailStatement');
    var self = this;
  }]);

  app.controller('exportStatementsListController', ['$scope', '$http', '$cookies', '$location', '$window', 'NgTableParams',
    function($scope, $http, $cookies, $location, $window, NgTableParams) {
      console.log('exportStatementsList');
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

      self.isChecked = function() {
        var ret = false;
        var keepGoing = true;
        angular.forEach(self.checkboxes.items, function(value, key) {
          if(keepGoing) {
            if(value === true){
              ret = true;
              keepGoing = false;
            }
          }
        });
        return ret;
      }

      self.getStatusAction = function(status) {
        var ret = status === 'on' ? '禁用' : '启用';
        return ret;
      }

      self.delete = function() {
        if(!confirm('确定删除？')) {
          return;
        }
        
        var goods = [];
        angular.forEach(self.checkboxes.items, function(value, key) {
          if(value === true) {
            goods.push({"id": key});
          }
        });
        var c = $scope.root.config;
        var url = c.requestUrl + '/goods' + c.extension;
        var data = {
          "action": "Delete",
          "account": $cookies.get('account'),
          "token": $cookies.get('token'),
          "projectName": $cookies.get('projectName'),
          "goods": goods
        };
        data = JSON.stringify(data);
        
        $http.post(url, data).then(function successCallback(response) {
            var data = response.data;
            if(data.rescode === 200) {
              $window.location.reload();
            }else if(data.rescode === 401){
              $location.path('/index');
            }else {
              alert(data.errInfo);
            }  
          }, function errorCallback(response) {
            alert('删除失败，请重试');
          });
      }

      self.changeStatus = function(status) {
        var c = $scope.root.config;
        var url = c.requestUrl + '/goods' + c.extension;
        var data = {
          "action": "ChangeStatus",
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
              alert('启用／禁用 设置成功！');
              $window.location.reload();
            }else if(data.rescode === 401){
              $location.path('/index');
            }else {
              alert(data.errInfo);
            }  
          }, function errorCallback(response) {
            alert('设置失败，请重试');
          });
      }

      // watch for check all checkbox
      $scope.$watch('exportStatementsList.checkboxes.checked', function(value) {
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
                "sortBy": "CreateTime",
                "orderBy": "desc",
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

  app.controller('checkStatementController', ['$scope', function($scope) {
    console.log('checkStatement');
    var self = this;
  }]);

  app.controller('operatingStatementController', ['$scope', function($scope) {
    console.log('operatingStatement');
    var self = this;
  }]);

  app.controller('orderDetailController', ['$scope', function($scope) {
    console.log('orderDetail');
    var self = this;
  }]);

  app.controller('ordersListController', ['$scope', '$http', '$cookies', '$location', '$window', 'NgTableParams',
    function($scope, $http, $cookies, $location, $window, NgTableParams) {
      console.log('ordersList');
      var self = this;

      self.init = function() {
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

      self.isChecked = function() {
        var ret = false;
        var keepGoing = true;
        angular.forEach(self.checkboxes.items, function(value, key) {
          if(keepGoing) {
            if(value === true){
              ret = true;
              keepGoing = false;
            }
          }
        });
        return ret;
      }

      self.getStatusAction = function(status) {
        var ret = status === 'on' ? '禁用' : '启用';
        return ret;
      }

      self.delete = function() {
        if(!confirm('确定删除？')) {
          return;
        }
        
        var goods = [];
        angular.forEach(self.checkboxes.items, function(value, key) {
          if(value === true) {
            goods.push({"id": key});
          }
        });
        var c = $scope.root.config;
        var url = c.requestUrl + '/goods' + c.extension;
        var data = {
          "action": "Delete",
          "account": $cookies.get('account'),
          "token": $cookies.get('token'),
          "projectName": $cookies.get('projectName'),
          "goods": goods
        };
        data = JSON.stringify(data);
        
        $http.post(url, data).then(function successCallback(response) {
            var data = response.data;
            if(data.rescode === 200) {
              $window.location.reload();
            }else if(data.rescode === 401){
              $location.path('/index');
            }else {
              alert(data.errInfo);
            }  
          }, function errorCallback(response) {
            alert('删除失败，请重试');
          });
      }

      self.changeStatus = function(status) {
        var c = $scope.root.config;
        var url = c.requestUrl + '/goods' + c.extension;
        var data = {
          "action": "ChangeStatus",
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
              alert('启用／禁用 设置成功！');
              $window.location.reload();
            }else if(data.rescode === 401){
              $location.path('/index');
            }else {
              alert(data.errInfo);
            }  
          }, function errorCallback(response) {
            alert('设置失败，请重试');
          });
      }

      // watch for check all checkbox
      $scope.$watch('ordersList.checkboxes.checked', function(value) {
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
                "sortBy": "CreateTime",
                "orderBy": "desc",
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

  app.controller('personalInfoController', ['$scope', function($scope) {
    console.log('personalInfo');
    var self = this;
  }]);

  app.controller('goodsAddController', ['$scope', '$location', '$cookies', '$http', function($scope, $location, $cookies, $http) {
    console.log('goodsAdd');
    var self = this;

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

    self.setSubmit = function (status) {
      if(status) {
        self.addBtnText = "添加中...";
        self.submitting = true;
      }else {
        self.addBtnText = "添加";
        self.submitting = false;
      }
    }

    self.setSubmit(false);

    this.submit = function() {

      // 有效时间 必填
      if ($('#rd_dmukgs').val() === "" || $('#rd_qcaxwa').val() === "") {
        alert('请输入有效时间');
        return;
      }
      var c = $scope.root.config;
      var url = c.requestUrl + '/goods' + c.extension;
      this.goods.status = 'on';
      this.goods.validDateStart = new Date($('#rd_dmukgs').val()).getTime();
      this.goods.validDateEnd = new Date($('#rd_qcaxwa').val()).getTime();

      var data = {
        "action": "Add",
        "account": $cookies.get('account'),
        "token": $cookies.get('token'),
        "projectName": $cookies.get('projectName'),
        "goods": self.goods
      };
      data = JSON.stringify(data);
      self.setSubmit(true);

      $http.post(url, data).then(function successCallback(response) {
          var data = response.data;
          if(data.rescode === 200) {
            $location.path('/goodsList');
          }else if(data.rescode === 401){
            $location.path('/index');
          }else {
            self.setSubmit(false);
            alert(data.errInfo);
          }  
        }, function errorCallback(response) {
          self.setSubmit(false);
          alert('添加失败，请重试');
        });
    }
  }]);

  app.controller('goodsEditController', ['$scope', '$state', '$stateParams', '$http', '$cookies', '$location', '$filter',
    function($scope, $state, $stateParams, $http, $cookies, $location, $filter) {
      console.log('goodsEdit');

      var self = this;
      self.id = $stateParams.id;

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

        // get data
        var c = $scope.root.config;
        var url = c.requestUrl + '/goods' + c.extension;

        var data = {
          "action": "GetDetail",
          "account": $cookies.get('account'),
          "token": $cookies.get('token'),
          "projectName": $cookies.get('projectName'),
          "goodsId": self.id
        };
        data = JSON.stringify(data);

        $http.post(url, data).then(function successCallback(response) {
            var data = response.data;
            if(data.rescode === 200) {
              self.goods = data.goods;

              // 有效时间设置
              var sDate = $filter('date')(data.goods.validDateStart, 'yyyy-MM-dd');
              var eDate = $filter('date')(data.goods.validDateEnd, 'yyyy-MM-dd');
              $('#rd_dmukgs').val(sDate);
              $('#valid-date-start').val(sDate);
              $('#rd_qcaxwa').val(eDate);
              $('#valid-date-end').val(eDate);

            }else if(data.rescode === 401){
              $location.path('/index');
            }else {
              alert(data.errInfo);
            }  
          }, function errorCallback(response) {
            alert('读取信息失败');
          });
      }

      self.setSubmit = function (status) {
        if(status) {
          this.btnText = "保存中...";
          this.submitting = true;
        }else {
          self.btnText = "保存修改";
          self.submitting = false;
        }
      }

      self.setSubmit(false);

      this.submit = function() {

        // 有效时间 必填
        if ($('#rd_dmukgs').val() === "" || $('#rd_qcaxwa').val() === "") {
          alert('请输入有效时间');
          return;
        }
        var c = $scope.root.config;
        var url = c.requestUrl + '/goods' + c.extension;
        this.goods.validDateStart = new Date($('#rd_dmukgs').val()).getTime();
        this.goods.validDateEnd = new Date($('#rd_qcaxwa').val()).getTime();

        var data = {
          "action": "Modify",
          "account": $cookies.get('account'),
          "token": $cookies.get('token'),
          "projectName": $cookies.get('projectName'),
          "goods": self.goods
        };
        data = JSON.stringify(data);
        self.setSubmit(true);

        $http.post(url, data).then(function successCallback(response) {
            var data = response.data;
            if(data.rescode === 200) {
              $location.path('/goodsList');
            }else if(data.rescode === 401){
              $location.path('/index');
            }else {
              self.setSubmit(false);
              alert(data.errInfo);
            }  
          }, function errorCallback(response) {
            self.setSubmit(false);
            alert('保存失败，请重试');
          });
      }
    }
  ]);

  app.controller('goodsListController', ['$scope', '$http', '$cookies', '$location', '$window', 'NgTableParams', 
    function($scope, $http, $cookies, $location, $window, NgTableParams) {
      console.log('goodsList');
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

      self.isChecked = function() {
        var ret = false;
        var keepGoing = true;
        angular.forEach(self.checkboxes.items, function(value, key) {
          if(keepGoing) {
            if(value === true){
              ret = true;
              keepGoing = false;
            }
          }
        });
        return ret;
      }

      self.getStatusAction = function(status) {
        var ret = status === 'on' ? '禁用' : '启用';
        return ret;
      }

      self.delete = function() {
        if(!confirm('确定删除？')) {
          return;
        }
        
        var goods = [];
        angular.forEach(self.checkboxes.items, function(value, key) {
          if(value === true) {
            goods.push({"id": key});
          }
        });
        var c = $scope.root.config;
        var url = c.requestUrl + '/goods' + c.extension;
        var data = {
          "action": "Delete",
          "account": $cookies.get('account'),
          "token": $cookies.get('token'),
          "projectName": $cookies.get('projectName'),
          "goods": goods
        };
        data = JSON.stringify(data);
        
        $http.post(url, data).then(function successCallback(response) {
            var data = response.data;
            if(data.rescode === 200) {
              $window.location.reload();
            }else if(data.rescode === 401){
              $location.path('/index');
            }else {
              alert(data.errInfo);
            }  
          }, function errorCallback(response) {
            alert('删除失败，请重试');
          });
      }

      self.changeStatus = function(status) {
        var c = $scope.root.config;
        var url = c.requestUrl + '/goods' + c.extension;
        var data = {
          "action": "ChangeStatus",
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
              alert('启用／禁用 设置成功！');
              $window.location.reload();
            }else if(data.rescode === 401){
              $location.path('/index');
            }else {
              alert(data.errInfo);
            }  
          }, function errorCallback(response) {
            alert('设置失败，请重试');
          });
      }

      // watch for check all checkbox
      $scope.$watch('goodsList.checkboxes.checked', function(value) {
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
                "sortBy": "CreateTime",
                "orderBy": "desc",
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

  app.controller('saleListController', ['$scope', '$http', '$cookies', '$location', '$window', 'NgTableParams', 
    function($scope, $http, $cookies, $location, $window, NgTableParams) {
      console.log('saleList');
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

      self.isChecked = function() {
        var ret = false;
        var keepGoing = true;
        angular.forEach(self.checkboxes.items, function(value, key) {
          if(keepGoing) {
            if(value === true){
              ret = true;
              keepGoing = false;
            }
          }
        });
        return ret;
      }

      self.getStatusAction = function(status) {
        var ret = status === 'on' ? '禁用' : '启用';
        return ret;
      }

      self.delete = function() {
        if(!confirm('确定删除？')) {
          return;
        }
        
        var sale = [];
        angular.forEach(self.checkboxes.items, function(value, key) {
          if(value === true) {
            sale.push({"id": key});
          }
        });
        var c = $scope.root.config;
        var url = c.requestUrl + '/sale' + c.extension;
        var data = {
          "action": "Delete",
          "account": $cookies.get('account'),
          "token": $cookies.get('token'),
          "projectName": $cookies.get('projectName'),
          "sale": sale
        };
        data = JSON.stringify(data);
        
        $http.post(url, data).then(function successCallback(response) {
            var data = response.data;
            if(data.rescode === 200) {
              $window.location.reload();
            }else if(data.rescode === 401){
              $location.path('/index');
            }else {
              alert(data.errInfo);
            }  
          }, function errorCallback(response) {
            alert('删除失败，请重试');
          });
      }

      self.changeStatus = function(status) {
        var c = $scope.root.config;
        var url = c.requestUrl + '/sale' + c.extension;
        var data = {
          "action": "ChangeStatus",
          "account": $cookies.get('account'),
          "token": $cookies.get('token'),
          "projectName": $cookies.get('projectName'),
          "saleId": 1,
          "state": status === 'on' ? 'off' : 'on'
        };
        data = JSON.stringify(data);
        
        $http.post(url, data).then(function successCallback(response) {
            var data = response.data;
            if(data.rescode === 200) {
              alert('启用／禁用 设置成功！');
              $window.location.reload();
            }else if(data.rescode === 401){
              $location.path('/index');
            }else {
              alert(data.errInfo);
            }  
          }, function errorCallback(response) {
            alert('设置失败，请重试');
          });
      }

      // watch for check all checkbox
      $scope.$watch('saleList.checkboxes.checked', function(value) {
          angular.forEach(self.tableData, function(item) {
              if (angular.isDefined(item.saleId)) {
                self.checkboxes.items[item.saleId] = value;
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
              var searchStr = "";
              if (self.searchStr) {
                searchStr = self.searchStr;
              }

              var c = $scope.root.config;
              var url = c.requestUrl + '/sale' + c.extension;
              var data = {
                "action": "GetList",
                "account": $cookies.get('account'),
                "token": $cookies.get('token'),
                "projectName": $cookies.get('projectName'),
                "sortBy": "CreateTime",
                "orderBy": "desc",
                "count": paramsUrl.count, //一页显示数量
                "page": paramsUrl.page,   //当前页
                "search": {
                  "searchStr": searchStr //完全匹配查询
                }
              };
              data = JSON.stringify(data);
              self.loading = true;
              
              return $http.post(url, data).then(function successCallback(response) {
                  var data = response.data;
                  if(data.rescode === 200) {
                    self.checkboxes = { 'checked': false, items: {} };
                    self.loading = false;
                    params.total(data.sale.totalCount);
                    self.tableData = data.sale.lists;
                    return data.sale.lists;
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
  
  app.controller('partnerConfigController', ['$scope', '$http', '$cookies', '$location', '$window', 'NgTableParams', 
    function($scope, $http, $cookies, $location, $window, NgTableParams) {
      console.log('partnerConfig');
      var self = this;
      
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
          "action": "ChangeStatus",
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
              alert('启用／禁用 设置成功！');
              $window.location.reload();
            }else if(data.rescode === 401){
              $location.path('/index');
            }else {
              alert(data.errInfo);
            }  
          }, function errorCallback(response) {
            alert('设置失败，请重试');
          });
      }

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

              var c = $scope.root.config;
              var url = c.requestUrl + '/partners' + c.extension;
              var data = {
                "action": "GetList",
                "account": $cookies.get('account'),
                "token": $cookies.get('token'),
                "projectName": $cookies.get('projectName'),
                "sortBy": "CreateTime",
                "orderBy": "desc",
                "count": paramsUrl.count, //一页显示数量
                "page": paramsUrl.page,   //当前页
                "search": {
                  "partnerName": ""
                }
              };
              data = JSON.stringify(data);
              self.loading = true;
              
              return $http.post(url, data).then(function successCallback(response) {
                  var data = response.data;
                  if(data.rescode === 200) {
                    self.loading = false;
                    params.total(data.partners.totalCount);
                    return data.partners.lists;
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

  app.controller('saleAddController', ['$scope', '$location', '$cookies', '$http', function($scope, $location, $cookies, $http) {
    console.log('saleAdd');
    var self = this;

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
      this.initPartnersList();
      this.initpartnerConfig();
    };

    this.initPartnersList = function() {

      var c = $scope.root.config;
      var url = c.requestUrl + '/partners' + c.extension;

      var data = {
        "action": "GetList",
        "account": $cookies.get('account'),
        "token": $cookies.get('token'),
        "projectName": $cookies.get('projectName'),
        "sortBy": "CreateTime",
        "orderBy": "desc",
        "count": 10000,
        "page": 1,
        "search": {
          "partnerName": ""
        }
      };
      data = JSON.stringify(data);

      $http.post(url, data).then(function successCallback(response) {
          var data = response.data;
          if(data.rescode === 200) {
            self.partners = data.partners.lists;
            // self.myPartner = self.partners[0];
          }else if(data.rescode === 401){
            $location.path('/index');
          }else {
            alert(data.errInfo);
          }  
        }, function errorCallback(response) {
          alert('读取分销商信息失败');
        });
    };
    
    this.initpartnerConfig = function() {
      var c = $scope.root.config;
      var url = c.requestUrl + '/goods' + c.extension;

      var data = {
        "action": "GetList",
        "account": $cookies.get('account'),
        "token": $cookies.get('token'),
        "projectName": $cookies.get('projectName'),
        "sortBy": "CreateTime",
        "orderBy": "desc",
        "count": 10000,
        "page": 1,
        "search": {
          "goodsName": ""
        }
      };
      data = JSON.stringify(data);

      $http.post(url, data).then(function successCallback(response) {
          var data = response.data;
          if(data.rescode === 200) {
            self.goods = data.goods.lists;
            // self.myGoods = self.goods[0];
          }else if(data.rescode === 401){
            $location.path('/index');
          }else {
            alert(data.errInfo);
          }  
        }, function errorCallback(response) {
          alert('读取商品信息失败');
        });
    };

    self.setSubmit = function (status) {
      if(status) {
        self.addBtnText = "添加中...";
        self.submitting = true;
      }else {
        self.addBtnText = "添加";
        self.submitting = false;
      }
    }

    self.setSubmit(false);

    this.submit = function() {

      // 有效时间 必填
      if ($('#rd_dmukgs').val() === "" || $('#rd_qcaxwa').val() === "") {
        alert('请输入有效时间');
        return;
      }
      var c = $scope.root.config;
      var url = c.requestUrl + '/sale' + c.extension;
      self.sale.status = 'on';
      self.sale.saleDateStart = new Date($('#rd_dmukgs').val()).getTime();
      self.sale.saleDateEnd = new Date($('#rd_qcaxwa').val()).getTime();
      self.sale.goodsId = self.myGoods.id;
      self.sale.partnerCode = self.myPartner.partnerCode;

      var data = {
        "action": "Add",
        "account": $cookies.get('account'),
        "token": $cookies.get('token'),
        "projectName": $cookies.get('projectName'),
        "sale": self.sale
      };
      data = JSON.stringify(data);
      self.setSubmit(true);

      $http.post(url, data).then(function successCallback(response) {
          var data = response.data;
          if(data.rescode === 200) {
            $location.path('/saleList');
          }else if(data.rescode === 401){
            $location.path('/index');
          }else {
            self.setSubmit(false);
            alert(data.errInfo);
          }  
        }, function errorCallback(response) {
          self.setSubmit(false);
          alert('添加失败，请重试');
        });
    }
  }]);
  
  app.controller('saleEditController', ['$scope', '$state', '$stateParams', '$location', '$cookies', '$http', '$filter',
    function($scope,$state, $stateParams, $location, $cookies, $http, $filter) {
    console.log('saleEdit');
    var self = this;
    self.id = $stateParams.id;
    
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
      this.initSaleDetailInfo();
      this.initPartnersList();
      this.initpartnerConfig();
    };

    this.initSaleDetailInfo = function() {
      var c = $scope.root.config;
      var url = c.requestUrl + '/sale' + c.extension;

      var data = {
        "action": "GetDetail",
        "account": $cookies.get('account'),
        "token": $cookies.get('token'),
        "projectName": $cookies.get('projectName'),
        "saleId": self.id
      };
      data = JSON.stringify(data);

      $http.post(url, data).then(function successCallback(response) {
          var data = response.data;
          if(data.rescode === 200) {
            self.sale = data.sale;

            // 有效时间设置
            var sDate = $filter('date')(data.sale.saleDateStart, 'yyyy-MM-dd');
            var eDate = $filter('date')(data.sale.saleDateEnd, 'yyyy-MM-dd');
            $('#rd_dmukgs').val(sDate);
            $('#sale-date-start').val(sDate);
            $('#rd_qcaxwa').val(eDate);
            $('#sale-date-end').val(eDate);

          }else if(data.rescode === 401){
            $location.path('/index');
          }else {
            alert(data.errInfo);
          }  
        }, function errorCallback(response) {
          alert('添加失败，请重试');
        });
    };

    this.initPartnersList = function() {

      var c = $scope.root.config;
      var url = c.requestUrl + '/partners' + c.extension;

      var data = {
        "action": "GetList",
        "account": $cookies.get('account'),
        "token": $cookies.get('token'),
        "projectName": $cookies.get('projectName'),
        "sortBy": "CreateTime",
        "orderBy": "desc",
        "count": 10000,
        "page": 1,
        "search": {
          "partnerName": ""
        }
      };
      data = JSON.stringify(data);

      $http.post(url, data).then(function successCallback(response) {
          var data = response.data;
          if(data.rescode === 200) {
            self.partners = data.partners.lists;
            for (var i = 0; i < self.partners.length; i++) {
              if(self.partners[i].partnerCode === self.sale.partnerCode) {
                self.myPartner = self.partners[i];
                break;
              }
            }
          }else if(data.rescode === 401){
            $location.path('/index');
          }else {
            alert(data.errInfo);
          }  
        }, function errorCallback(response) {
          alert('读取分销商信息失败');
        });
    };
    
    this.initpartnerConfig = function() {
      var c = $scope.root.config;
      var url = c.requestUrl + '/goods' + c.extension;

      var data = {
        "action": "GetList",
        "account": $cookies.get('account'),
        "token": $cookies.get('token'),
        "projectName": $cookies.get('projectName'),
        "sortBy": "CreateTime",
        "orderBy": "desc",
        "count": 10000,
        "page": 1,
        "search": {
          "goodsName": ""
        }
      };
      data = JSON.stringify(data);

      $http.post(url, data).then(function successCallback(response) {
          var data = response.data;
          if(data.rescode === 200) {
            self.goods = data.goods.lists;
            for (var i = 0; i < self.goods.length; i++) {
              if(self.goods[i].id === self.sale.goodsId) {
                self.myGoods = self.goods[i];
                break;
              }
            }
          }else if(data.rescode === 401){
            $location.path('/index');
          }else {
            alert(data.errInfo);
          }  
        }, function errorCallback(response) {
          alert('读取商品信息失败');
        });
    };

    self.setSubmit = function (status) {
      if(status) {
        self.addBtnText = "保存中...";
        self.submitting = true;
      }else {
        self.addBtnText = "保存修改";
        self.submitting = false;
      }
    }

    self.setSubmit(false);

    this.submit = function() {

      // 有效时间 必填
      if ($('#rd_dmukgs').val() === "" || $('#rd_qcaxwa').val() === "") {
        alert('请输入有效时间');
        return;
      }
      var c = $scope.root.config;
      var url = c.requestUrl + '/sale' + c.extension;
      self.sale.status = 'on';
      self.sale.saleDateStart = new Date($('#rd_dmukgs').val()).getTime();
      self.sale.saleDateEnd = new Date($('#rd_qcaxwa').val()).getTime();
      self.sale.goodsId = self.myGoods.id;
      self.sale.partnerCode = self.myPartner.partnerCode;

      var data = {
        "action": "Modify",
        "account": $cookies.get('account'),
        "token": $cookies.get('token'),
        "projectName": $cookies.get('projectName'),
        "sale": self.sale
      };
      data = JSON.stringify(data);
      self.setSubmit(true);

      $http.post(url, data).then(function successCallback(response) {
          var data = response.data;
          if(data.rescode === 200) {
            $location.path('/saleList');
          }else if(data.rescode === 401){
            $location.path('/index');
          }else {
            self.setSubmit(false);
            alert(data.errInfo);
          }  
        }, function errorCallback(response) {
          self.setSubmit(false);
          alert('保存失败，请重试');
        });
    }
  }]);

})();