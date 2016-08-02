'use strict';

(function() {
  var app = angular.module('app.controllers', ['ngCookies', 'ngTable']);

  app.controller('loginController', ['$scope', '$location', '$http', '$cookies', '$filter', 
    function($scope, $location, $http, $cookies, $filter) {
      console.log('login');
      var self = this;

      this.login = function() {
        var c = $scope.root.config;
        var url = c.requestUrl + '/login' + c.extension;
        var password = $filter('md5_32_lowerCase')(this.password);
        
        var data = {
          "action": "GetToken",
          "account": this.account,
          "password": password,
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
              $cookies.put('roleId', data.roleId);
              $cookies.put('roleName', data.roleName);
              $cookies.put('userId', data.userId);
              // todo 权限
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

  app.controller('mainController', ['$scope', '$location', '$cookies', '$state','auth', function($scope, $location, $cookies, $state, auth) {
    console.log('main');

    if (!$cookies.get('token')) {
      $location.path('/index');
    }

    this.auth = function(authName) { return auth($cookies.get('roleId'), authName) };

    this.init = function() {
      this.userName = $cookies.get('userName');
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
        case 'userEdit':
          $scope.$state = 'admin';
          break;  
      }
      if( !this.auth($scope.$state) ) {
        alert('抱歉，您无权限访问该页面');
        this.logout();
      }
    };

    this.logout = function() {
      $cookies.put('token', '');
      $location.path('/index');
    };

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
        
        var users = [];
        angular.forEach(self.checkboxes.items, function(value, key) {
          if(value === true) {
            users.push({"id": key});
          }
        });
        var c = $scope.root.config;
        var url = c.requestUrl + '/users' + c.extension;
        var data = {
          "action": "Delete",
          "account": $cookies.get('account'),
          "token": $cookies.get('token'),
          "projectName": $cookies.get('projectName'),
          "users": users
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

      self.changeStatus = function(status, id) {
        var c = $scope.root.config;
        var url = c.requestUrl + '/users' + c.extension;
        var data = {
          "action": "ChangeStatus",
          "account": $cookies.get('account'),
          "token": $cookies.get('token'),
          "projectName": $cookies.get('projectName'),
          "userId": id,
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
              // admin不能被删除
              if (angular.isDefined(item.id) && item.account!=='admin') {
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
              var url = c.requestUrl + '/users' + c.extension;
              var data = {
                "action": "GetList",
                "account": $cookies.get('account'),
                "token": $cookies.get('token'),
                "projectName": $cookies.get('projectName'),
                "sortBy": "UserCreateTime",
                "orderBy": "asc",
                "count": paramsUrl.count, //一页显示数量
                "page": paramsUrl.page
              };
              data = JSON.stringify(data);
              self.loading = true;
              
              return $http.post(url, data).then(function successCallback(response) {
                  var data = response.data;
                  if(data.rescode === 200) {
                    self.checkboxes = { 'checked': false, items: {} };
                    self.loading = false;
                    params.total(data.users.totalCount);
                    self.tableData = data.users.lists;
                    return data.users.lists;
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
  
  app.controller('userAddController', ['$scope', '$location', '$cookies', '$http', function($scope, $location, $cookies, $http) {
    console.log('userAdd');
    var self = this;

    self.init = function() {
      this.initRolesList();
    };

    this.initRolesList = function() {
      var c = $scope.root.config;
      var url = c.requestUrl + '/users' + c.extension;

      var data = {
        "action": "GetRoleList",
        "account": $cookies.get('account'),
        "token": $cookies.get('token'),
        "projectName": $cookies.get('projectName'),
        "count": 10000,
        "page": 1
      };
      data = JSON.stringify(data);

      $http.post(url, data).then(function successCallback(response) {
          var data = response.data;
          if(data.rescode === 200) {
            self.roles = data.roles.lists;
            // self.roles = self.roles[0];
          }else if(data.rescode === 401){
            $location.path('/index');
          }else {
            alert(data.errInfo);
          }  
        }, function errorCallback(response) {
          alert('读取角色信息失败');
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

      var c = $scope.root.config;
      var url = c.requestUrl + '/users' + c.extension;
      this.user.status = 'on';
      self.user.roleId = self.myRole.id;

      var data = {
        "action": "Add",
        "account": $cookies.get('account'),
        "token": $cookies.get('token'),
        "projectName": $cookies.get('projectName'),
        "user": self.user
      };
      data = JSON.stringify(data);
      self.setSubmit(true);

      $http.post(url, data).then(function successCallback(response) {
          var data = response.data;
          if(data.rescode === 200) {
            $location.path('/userList');
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

  app.controller('applyRolesController', ['$scope', function($scope) {
    console.log('applyRoles');
    var self = this;
  }]);
  
  app.controller('userPasswordResetController', ['$scope', '$state', '$stateParams', '$http', '$cookies', '$location', '$filter',
    function($scope, $state, $stateParams, $http, $cookies, $location, $filter) {
      console.log('userPasswordReset');

      var self = this;
      self.id = $stateParams.id;

      self.setSubmit = function (status) {
        if(status) {
          this.btnText = "重置中...";
          this.submitting = true;
        }else {
          self.btnText = "重置密码";
          self.submitting = false;
        }
      }

      self.setSubmit(false);

      self.submit = function() {
        var c = $scope.root.config;
        var url = c.requestUrl + '/users' + c.extension;
        var data = {
          "action": "modifyPassword",
          "account": $cookies.get('account'),
          "token": $cookies.get('token'),
          "projectName": $cookies.get('projectName'),
          "myUserId": $cookies.get('userId'),
          "modifyUserId": self.id,
          "myPassword":$filter('md5_32_lowerCase')(self.myPassword),
          "newPassword":$filter('md5_32_lowerCase')(self.newPassword)
        };
        data = JSON.stringify(data);
        self.setSubmit(true);

        $http.post(url, data).then(function successCallback(response) {
            var data = response.data;
            if(data.rescode === 200) {
              alert('重置成功');
              $location.path('/userList');
            }else if(data.rescode === 401){
              $location.path('/index');
            }else {
              self.setSubmit(false);
              alert(data.errInfo);
            }  
          }, function errorCallback(response) {
            self.setSubmit(false);
            alert('重置失败，请重试');
          });
      };
    }
  ]);

  app.controller('userEditController', ['$scope', '$state', '$stateParams', '$http', '$cookies', '$location', '$filter',
    function($scope, $state, $stateParams, $http, $cookies, $location, $filter) {
      console.log('userEdit');

      var self = this;
      self.id = $stateParams.id;

      self.setRoleList = function() {
        var c = $scope.root.config;
        var url = c.requestUrl + '/users' + c.extension;

        var data = {
          "action": "GetRoleList",
          "account": $cookies.get('account'),
          "token": $cookies.get('token'),
          "projectName": $cookies.get('projectName'),
          "count": 10000,
          "page": 1
        };
        data = JSON.stringify(data);

        $http.post(url, data).then(function successCallback(response) {
            var data = response.data;
            if(data.rescode === 200) {
              self.roles = data.roles.lists;
              for (var i = 0; i < self.roles.length; i++) {
                if(self.roles[i].id === self.user.roleId) {
                  self.myRole = self.roles[i];
                  break;
                }
              }
            }else if(data.rescode === 401){
              $location.path('/index');
            }else {
              alert(data.errInfo);
            }  
          }, function errorCallback(response) {
            alert('读取角色信息失败');
          });
      };

      this.init = function() {
        // get data
        var c = $scope.root.config;
        var url = c.requestUrl + '/users' + c.extension;

        var data = {
          "action": "GetDetail",
          "account": $cookies.get('account'),
          "token": $cookies.get('token'),
          "projectName": $cookies.get('projectName'),
          "userId": self.id
        };
        data = JSON.stringify(data);

        $http.post(url, data).then(function successCallback(response) {
            var data = response.data;
            if(data.rescode === 200) {
              self.user = data.user;

              //角色设置
              self.setRoleList();

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
        var c = $scope.root.config;
        var url = c.requestUrl + '/users' + c.extension;
        self.user.roleId = self.myRole.id;

        var data = {
          "action": "Modify",
          "account": $cookies.get('account'),
          "token": $cookies.get('token'),
          "projectName": $cookies.get('projectName'),
          "user": self.user
        };
        data = JSON.stringify(data);
        self.setSubmit(true);

        $http.post(url, data).then(function successCallback(response) {
            var data = response.data;
            if(data.rescode === 200) {
              $location.path('/userList');
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

app.controller('toBeCheckedController', ['$scope', '$http', '$cookies', '$location', '$window', 'NgTableParams',
    function($scope, $http, $cookies, $location, $window, NgTableParams) {
      console.log('toBeChecked');
      var self = this;

      self.showDetail = function(orderId) {
        $scope.root.coverUrl = 'pages/orderDetail.html';
        $scope.root.coverParamId = orderId;
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
              var url = c.requestUrl + '/orders' + c.extension;

              var data = {
                "action": "GetWaitingList",
                "account": $cookies.get('account'),
                "token": $cookies.get('token'),
                "projectName": $cookies.get('projectName'),
                "sortBy": "OrderCreateTime",
                "orderBy": "desc",
                "count": paramsUrl.count, //一页显示数量
                "page": paramsUrl.page,   //当前页
                "search": {
                  "orderId": self.orderId ? self.orderId : "",
                  "parterOrderId": self.parterOrderId ? self.parterOrderId : "",
                  "bookPerson": self.bookPerson ? self.bookPerson : "",
                  "bookMobile": self.bookMobile ? self.bookMobile : ""
                }
              };
              data = JSON.stringify(data);
              self.loading = true;
              
              return $http.post(url, data).then(function successCallback(response) {
                  var data = response.data;
                  if(data.rescode === 200) {
                    self.loading = false;
                    params.total(data.orders.totalCount);
                    self.tableData = data.orders.lists;
                    return data.orders.lists;
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

      self.checkDetail = function(orderId) {
        $scope.root.coverUrl = 'pages/check.html';
        $scope.root.coverParamId = orderId;
      }
    }
  ]);

  app.controller('checkController', ['$scope', '$http', '$cookies', '$location', '$state', '$stateParams', 
    function($scope, $http, $cookies, $location, $state, $stateParams) {
      console.log('check');
      var self = this;
      self.id = $scope.root.coverParamId;

      this.close = function() {
        $scope.root.coverUrl = '';
        $scope.root.coverParamId = '';
      };

      this.check = function() {
        var c = $scope.root.config;
        var url = c.requestUrl + '/orders' + c.extension;

        var data = {
          "action": "Check",
          "account": $cookies.get('account'),
          "token": $cookies.get('token'),
          "projectName": $cookies.get('projectName'),
          "orderId": self.id,
          "checkNumber": self.orders.checkNumber,  //检票数量
          "userName": $cookies.get('userName')
        };
        data = JSON.stringify(data);

        $http.post(url, data).then(function successCallback(response) {
            var data = response.data;
            if(data.rescode === 200) {
              alert('检票成功')
              self.close();
              $state.reload();
            }else if(data.rescode === 401){
              $location.path('/index');
            }else {
              alert(data.errInfo);
            }  
          }, function errorCallback(response) {
            alert('检票可能失败，请返回“手动检票”列表复查。');
          });
      };

      this.init = function() {
        // get data
        var c = $scope.root.config;
        var url = c.requestUrl + '/orders' + c.extension;

        var data = {
          "action": "GetCheckDetail",
          "account": $cookies.get('account'),
          "token": $cookies.get('token'),
          "projectName": $cookies.get('projectName'),
          "orderId": self.id
        };
        data = JSON.stringify(data);

        $http.post(url, data).then(function successCallback(response) {
            var data = response.data;
            if(data.rescode === 200) {
              self.orders = data.orders;
            }else if(data.rescode === 401){
              $location.path('/index');
            }else {
              alert(data.errInfo);
            }  
          }, function errorCallback(response) {
            alert('读取信息失败');
          });
      }
    }
  ]);

  app.controller('checkDetailStatementController', ['$scope', '$http', '$cookies', '$location', '$window', '$filter', 'NgTableParams', 
    function($scope, $http, $cookies, $location, $window, $filter, NgTableParams) {
      console.log('checkDetailStatement');
      var self = this;

      self.init = function() {
        $('.form_datetime').datetimepicker({
          language:  'zh-CN',
          weekStart: 1,
          todayBtn:  1,
          autoclose: 1,
          todayHighlight: 1,
          startView: 2,
          forceParse: 0,
          showMeridian: 1
        });
      }

      self.sum = function(data, field){
        var t = 0;
        for (var i = 0; i < data.length; i++) {
          t += parseFloat(data[i][field]);
        }
        return t;
      };

      self.isLastPage = function() {
        return self.tableParams.page() === totalPages();
      }

      function totalPages(){
        return Math.ceil(self.tableParams.total() / self.tableParams.count());
      }

      self.export = function() {
        var c = $scope.root.config;
        var url = c.requestUrl + '/statement' + c.extension;

        //如果检票时间为空，默认设置为1个月查询，如果某个时间为空，补全整个时间段前移或后移1个月
        if(!$('#rd_qcaxwa').val() && !$('#rd_khaydt').val()) {

          var sDate = new Date();
          sDate.setMonth(sDate.getMonth() - 1);
          sDate = $filter('date')(sDate.getTime(), 'yyyy-MM-dd HH:mm:ss');
          $('#rd_qcaxwa').val(sDate);
          $('#check-date-start').val(sDate);

          var eDate = $filter('date')(new Date().getTime(), 'yyyy-MM-dd HH:mm:ss');
          $('#rd_khaydt').val(eDate);
          $('#check-date-end').val(eDate);

        }
        // 仅开始时间为空时
        else if(!$('#rd_qcaxwa').val()) {
          var d = new Date($('#rd_khaydt').val());
          d.setMonth(d.getMonth() - 1);
          d = $filter('date')(d.getTime(), 'yyyy-MM-dd HH:mm:ss');
          $('#rd_qcaxwa').val(d);
          $('#check-date-start').val(d);
        }
        // 仅结束时间为空时
        else if(!$('#rd_khaydt').val()) {
          var d = new Date($('#rd_qcaxwa').val());
          d.setMonth(d.getMonth() + 1);
          d = $filter('date')(d.getTime(), 'yyyy-MM-dd HH:mm:ss');
          $('#rd_khaydt').val(d);
          $('#check-date-end').val(d);
        }

        //读取成交日期
        self.checkDateStart = $('#rd_qcaxwa').val() ? new Date($('#rd_qcaxwa').val()).getTime() : '';
        self.checkDateEnd = $('#rd_khaydt').val() ? new Date($('#rd_khaydt').val()).getTime() : '';
      
        var data = {
          "action": "ExportcheckDetailStatement",
          "account": $cookies.get('account'),
          "token": $cookies.get('token'),
          "projectName": $cookies.get('projectName'),
          "exportPerson": $cookies.get('userName'),
          "search": {
            "goodsName": self.goodsName ? self.goodsName : "",
            "partnerName": self.partnerName ? self.partnerName : "",
            "parterOrderId": self.parterOrderId ? self.parterOrderId : "",
            "orderId": self.orderId ? self.orderId : "",
            "checkPerson": self.checkPerson ? self.checkPerson : "",
            "checkDateStart": self.checkDateStart ? self.checkDateStart : "", //检票日期开始
            "orderCreateDateEnd": self.orderCreateDateEnd ? self.orderCreateDateEnd : "" //检票日期结束
          }
        };

        $http.post(url, data).then(function successCallback(response) {
            var data = response.data;
            if(data.rescode === 200) {
              if (confirm('导出中，是否到“报表中心－导出列表”中查看？')) {
                $location.path('/exportStatementsList');
              }
            }else if(data.rescode === 401){
              $location.path('/index');
            }else {
              alert(data.errInfo);
            }  
          }, function errorCallback(response) {
            alert('导出失败，请重试');
          });
      };

      // ngtable
      self.search = function() {
        self.tableParams = new NgTableParams(
          {
            page: 1, 
            count: 15,
            url: '',
            group: "partnerName"
          }, 
          {
            counts: [15, 30],
            getData: function(params) {
              var paramsUrl = params.url();

              var c = $scope.root.config;
              var url = c.requestUrl + '/statement' + c.extension;

              //如果检票时间为空，默认设置为1个月查询，如果某个时间为空，补全整个时间段前移或后移1个月
              if(!$('#rd_qcaxwa').val() && !$('#rd_khaydt').val()) {

                var sDate = new Date();
                sDate.setMonth(sDate.getMonth() - 1);
                sDate = $filter('date')(sDate.getTime(), 'yyyy-MM-dd HH:mm:ss');
                $('#rd_qcaxwa').val(sDate);
                $('#check-date-start').val(sDate);

                var eDate = $filter('date')(new Date().getTime(), 'yyyy-MM-dd HH:mm:ss');
                $('#rd_khaydt').val(eDate);
                $('#check-date-end').val(eDate);

              }
              // 仅开始时间为空时
              else if(!$('#rd_qcaxwa').val()) {
                var d = new Date($('#rd_khaydt').val());
                d.setMonth(d.getMonth() - 1);
                d = $filter('date')(d.getTime(), 'yyyy-MM-dd HH:mm:ss');
                $('#rd_qcaxwa').val(d);
                $('#check-date-start').val(d);
              }
              // 仅结束时间为空时
              else if(!$('#rd_khaydt').val()) {
                var d = new Date($('#rd_qcaxwa').val());
                d.setMonth(d.getMonth() + 1);
                d = $filter('date')(d.getTime(), 'yyyy-MM-dd HH:mm:ss');
                $('#rd_khaydt').val(d);
                $('#check-date-end').val(d);
              }

              //读取成交日期
              self.checkDateStart = $('#rd_qcaxwa').val() ? new Date($('#rd_qcaxwa').val()).getTime() : '';
              self.checkDateEnd = $('#rd_khaydt').val() ? new Date($('#rd_khaydt').val()).getTime() : '';
            
              var data = {
                "action": "GetCheckStatement",
                "account": $cookies.get('account'),
                "token": $cookies.get('token'),
                "projectName": $cookies.get('projectName'),
                "count": paramsUrl.count, //一页显示数量
                "page": paramsUrl.page,   //当前页
                "search": {
                  "goodsName": self.goodsName ? self.goodsName : "",
                  "partnerName": self.partnerName ? self.partnerName : "",
                  "parterOrderId": self.parterOrderId ? self.parterOrderId : "",
                  "orderId": self.orderId ? self.orderId : "",
                  "checkPerson": self.checkPerson ? self.checkPerson : "",
                  "checkDateStart": self.checkDateStart ? self.checkDateStart : "", //检票日期开始
                  "orderCreateDateEnd": self.orderCreateDateEnd ? self.orderCreateDateEnd : "" //检票日期结束
                }
              };

              data = JSON.stringify(data);
              self.loading = true;
              
              return $http.post(url, data).then(function successCallback(response) {
                  var data = response.data;
                  if(data.rescode === 200) {
                    self.loading = false;
                    params.total(data.lists.totalCount);
                    self.tableData = data.lists.lists;
                    self.totalCheckedTickets = data.lists.totalCheckedTickets;
                    self.totalCheckedPrice = data.lists.totalCheckedPrice;
                    return data.lists.lists;
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
      };
    }
  ]);

  app.controller('exportStatementsListController', ['$scope', '$http', '$cookies', '$location', '$window', 'NgTableParams',
    function($scope, $http, $cookies, $location, $window, NgTableParams) {
      console.log('exportStatementsList');
      var self = this;

      // checkbox
      self.checkboxes = { 'checked': false, items: {} };
      
      var ret;
      self.getStatus = function(status) {
        switch (status) {
          case '0':
            ret = "导出中...";
            break;
          case '1':
            ret = "已导出";
            break;
          case '0':
            ret = "失败";
            break;    
        }
        return ret;
      }

      self.canDownload = function(status) {
        var ret = status === '1' ? true : false;
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

      self.delete = function() {
        if(!confirm('确定删除？')) {
          return;
        }
        
        var statements = [];
        angular.forEach(self.checkboxes.items, function(value, key) {
          if(value === true) {
            statements.push({"id": key});
          }
        });
        var c = $scope.root.config;
        var url = c.requestUrl + '/statement' + c.extension;
        var data = {
          "action": "Delete",
          "account": $cookies.get('account'),
          "token": $cookies.get('token'),
          "projectName": $cookies.get('projectName'),
          "statements": statements
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

              var c = $scope.root.config;
              var url = c.requestUrl + '/statement' + c.extension;
              var data = {
                "action": "GetList",
                "account": $cookies.get('account'),
                "token": $cookies.get('token'),
                "projectName": $cookies.get('projectName'),
                "sortBy": "ExportTime",
                "orderBy": "desc",
                "count": paramsUrl.count, //一页显示数量
                "page": paramsUrl.page
              };
              data = JSON.stringify(data);
              self.loading = true;
              
              return $http.post(url, data).then(function successCallback(response) {
                  var data = response.data;
                  if(data.rescode === 200) {
                    self.checkboxes = { 'checked': false, items: {} };
                    self.loading = false;
                    params.total(data.statements.totalCount);
                    self.tableData = data.statements.lists;
                    return data.statements.lists;
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

  app.controller('checkStatementController', ['$scope', '$http', '$cookies', '$location', '$window', '$filter', 'NgTableParams', 
    function($scope, $http, $cookies, $location, $window, $filter, NgTableParams) {
      console.log('checkStatement');
      var self = this;

      self.init = function() {
        $('.form_datetime').datetimepicker({
          language:  'zh-CN',
          weekStart: 1,
          todayBtn:  1,
          autoclose: 1,
          todayHighlight: 1,
          startView: 2,
          forceParse: 0,
          showMeridian: 1
        });
      }

      self.sum = function(data, field){
        var t = 0;
        for (var i = 0; i < data.length; i++) {
          t += parseFloat(data[i][field]);
        }
        return t;
      };

      self.isLastPage = function() {
        return self.tableParams.page() === totalPages();
      }

      function totalPages(){
        return Math.ceil(self.tableParams.total() / self.tableParams.count());
      }

      self.export = function() {
        var c = $scope.root.config;
        var url = c.requestUrl + '/statement' + c.extension;

        //如果检票时间为空，默认设置为1个月查询，如果某个时间为空，补全整个时间段前移或后移1个月
        if(!$('#rd_lptvht').val() && !$('#rd_idwdiz').val()) {

          var sDate = new Date();
          sDate.setMonth(sDate.getMonth() - 1);
          sDate = $filter('date')(sDate.getTime(), 'yyyy-MM-dd HH:mm:ss');
          $('#rd_lptvht').val(sDate);
          $('#check-date-start').val(sDate);

          var eDate = $filter('date')(new Date().getTime(), 'yyyy-MM-dd HH:mm:ss');
          $('#rd_idwdiz').val(eDate);
          $('#check-date-end').val(eDate);

        }
        // 仅开始时间为空时
        else if(!$('#rd_lptvht').val()) {
          var d = new Date($('#rd_idwdiz').val());
          d.setMonth(d.getMonth() - 1);
          d = $filter('date')(d.getTime(), 'yyyy-MM-dd HH:mm:ss');
          $('#rd_lptvht').val(d);
          $('#check-date-start').val(d);
        }
        // 仅结束时间为空时
        else if(!$('#rd_idwdiz').val()) {
          var d = new Date($('#rd_lptvht').val());
          d.setMonth(d.getMonth() + 1);
          d = $filter('date')(d.getTime(), 'yyyy-MM-dd HH:mm:ss');
          $('#rd_idwdiz').val(d);
          $('#check-date-end').val(d);
        }

        //读取成交日期
        self.orderCreateDateStart = $('#rd_qcaxwa').val() ? new Date($('#rd_qcaxwa').val()).getTime() : '';
        self.orderCreateDateEnd = $('#rd_khaydt').val() ? new Date($('#rd_khaydt').val()).getTime() : '';
        
        //读取检票日期
        self.checkDateStart = $('#rd_lptvht').val() ? new Date($('#rd_lptvht').val()).getTime() : '';
        self.checkDateEnd = $('#rd_idwdiz').val() ? new Date($('#rd_idwdiz').val()).getTime() : '';

        var data = {
          "action": "ExportCheckStatement",
          "account": $cookies.get('account'),
          "token": $cookies.get('token'),
          "projectName": $cookies.get('projectName'),
          "exportPerson": $cookies.get('userName'),
          "search": {
            "goodsName": self.goodsName ? self.goodsName : "",
            "partnerName": self.partnerName ? self.partnerName : "",
            "orderCreateDateStart": self.orderCreateDateStart ? self.orderCreateDateStart : "", //成交日期开始
            "orderCreateDateEnd": self.orderCreateDateEnd ? self.orderCreateDateEnd : "", //成交日期结束
            "checkDateStart": self.checkDateStart ? self.checkDateStart : "",
            "checkDateEnd": self.checkDateEnd ? self.checkDateEnd : ""
          }
        };

        $http.post(url, data).then(function successCallback(response) {
            var data = response.data;
            if(data.rescode === 200) {
              if (confirm('导出中，是否到“报表中心－导出列表”中查看？')) {
                $location.path('/exportStatementsList');
              }
            }else if(data.rescode === 401){
              $location.path('/index');
            }else {
              alert(data.errInfo);
            }  
          }, function errorCallback(response) {
            alert('导出失败，请重试');
          });
      };

      // ngtable
      self.search = function() {
        self.tableParams = new NgTableParams(
          {
            page: 1, 
            count: 15,
            url: '',
            group: "partnerName"
          }, 
          {
            counts: [15, 30],
            getData: function(params) {
              var paramsUrl = params.url();

              var c = $scope.root.config;
              var url = c.requestUrl + '/statement' + c.extension;

              //如果检票时间为空，默认设置为1个月查询，如果某个时间为空，补全整个时间段前移或后移1个月
              if(!$('#rd_lptvht').val() && !$('#rd_idwdiz').val()) {

                var sDate = new Date();
                sDate.setMonth(sDate.getMonth() - 1);
                sDate = $filter('date')(sDate.getTime(), 'yyyy-MM-dd HH:mm:ss');
                $('#rd_lptvht').val(sDate);
                $('#check-date-start').val(sDate);

                var eDate = $filter('date')(new Date().getTime(), 'yyyy-MM-dd HH:mm:ss');
                $('#rd_idwdiz').val(eDate);
                $('#check-date-end').val(eDate);

              }
              // 仅开始时间为空时
              else if(!$('#rd_lptvht').val()) {
                var d = new Date($('#rd_idwdiz').val());
                d.setMonth(d.getMonth() - 1);
                d = $filter('date')(d.getTime(), 'yyyy-MM-dd HH:mm:ss');
                $('#rd_lptvht').val(d);
                $('#check-date-start').val(d);
              }
              // 仅结束时间为空时
              else if(!$('#rd_idwdiz').val()) {
                var d = new Date($('#rd_lptvht').val());
                d.setMonth(d.getMonth() + 1);
                d = $filter('date')(d.getTime(), 'yyyy-MM-dd HH:mm:ss');
                $('#rd_idwdiz').val(d);
                $('#check-date-end').val(d);
              }

              //读取成交日期
              self.orderCreateDateStart = $('#rd_qcaxwa').val() ? new Date($('#rd_qcaxwa').val()).getTime() : '';
              self.orderCreateDateEnd = $('#rd_khaydt').val() ? new Date($('#rd_khaydt').val()).getTime() : '';
              
              //读取检票日期
              self.checkDateStart = $('#rd_lptvht').val() ? new Date($('#rd_lptvht').val()).getTime() : '';
              self.checkDateEnd = $('#rd_idwdiz').val() ? new Date($('#rd_idwdiz').val()).getTime() : '';

              var data = {
                "action": "GetCheckStatement",
                "account": $cookies.get('account'),
                "token": $cookies.get('token'),
                "projectName": $cookies.get('projectName'),
                "count": paramsUrl.count, //一页显示数量
                "page": paramsUrl.page,   //当前页
                "search": {
                  "goodsName": self.goodsName ? self.goodsName : "",
                  "partnerName": self.partnerName ? self.partnerName : "",
                  "orderCreateDateStart": self.orderCreateDateStart ? self.orderCreateDateStart : "", //成交日期开始
                  "orderCreateDateEnd": self.orderCreateDateEnd ? self.orderCreateDateEnd : "", //成交日期结束
                  "checkDateStart": self.checkDateStart ? self.checkDateStart : "",
                  "checkDateEnd": self.checkDateEnd ? self.checkDateEnd : ""
                }
              };

              data = JSON.stringify(data);
              self.loading = true;
              
              return $http.post(url, data).then(function successCallback(response) {
                  var data = response.data;
                  if(data.rescode === 200) {
                    self.loading = false;
                    params.total(data.lists.totalCount);
                    self.tableData = data.lists.lists;
                    self.totalTotalTickets = data.lists.totalTotalTickets;
                    self.totalCheckedTickets = data.lists.totalCheckedTickets;
                    self.totalCheckedPrice = data.lists.totalCheckedPrice;
                    return data.lists.lists;
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
      };
    }
  ]);
  
  app.controller('operatingStatementController', ['$scope', '$http', '$cookies', '$location', '$window', '$filter', 'NgTableParams', 
    function($scope, $http, $cookies, $location, $window, $filter, NgTableParams) {
      console.log('operatingStatement');
      var self = this;

      self.init = function() {
        $('.form_datetime').datetimepicker({
          language:  'zh-CN',
          weekStart: 1,
          todayBtn:  1,
          autoclose: 1,
          todayHighlight: 1,
          startView: 2,
          forceParse: 0,
          showMeridian: 1
        });
      }

      self.sum = function(data, field){
        var t = 0;
        for (var i = 0; i < data.length; i++) {
          t += parseFloat(data[i][field]);
        }
        return t;
      };

      self.isLastPage = function() {
        return self.tableParams.page() === totalPages();
      }

      function totalPages(){
        return Math.ceil(self.tableParams.total() / self.tableParams.count());
      }

      self.export = function() {
        var c = $scope.root.config;
        var url = c.requestUrl + '/statement' + c.extension;

        //如果成交时间为空，默认设置为1个月查询，如果某个时间为空，补全整个时间段前移或后移1个月
        if(!$('#rd_qcaxwa').val() && !$('#rd_khaydt').val()) {

          var sDate = new Date();
          sDate.setMonth(sDate.getMonth() - 1);
          sDate = $filter('date')(sDate.getTime(), 'yyyy-MM-dd HH:mm:ss');
          $('#rd_qcaxwa').val(sDate);
          $('#order-create-date-start').val(sDate);

          var eDate = $filter('date')(new Date().getTime(), 'yyyy-MM-dd HH:mm:ss');
          $('#rd_khaydt').val(eDate);
          $('#order-create-date-end').val(eDate);

        }
        // 仅开始时间为空时
        else if(!$('#rd_qcaxwa').val()) {
          var d = new Date($('#rd_khaydt').val());
          d.setMonth(d.getMonth() - 1);
          d = $filter('date')(d.getTime(), 'yyyy-MM-dd HH:mm:ss');
          $('#rd_qcaxwa').val(d);
          $('#order-create-date-start').val(d);
        }
        // 仅结束时间为空时
        else if(!$('#rd_khaydt').val()) {
          var d = new Date($('#rd_qcaxwa').val());
          d.setMonth(d.getMonth() + 1);
          d = $filter('date')(d.getTime(), 'yyyy-MM-dd HH:mm:ss');
          $('#rd_khaydt').val(d);
          $('#order-create-date-end').val(d);
        }

        //读取成交日期
        self.orderCreateDateStart = $('#rd_qcaxwa').val() ? new Date($('#rd_qcaxwa').val()).getTime() : '';
        self.orderCreateDateEnd = $('#rd_khaydt').val() ? new Date($('#rd_khaydt').val()).getTime() : '';
        
        //读取游玩日期
        self.visitDateStart = $('#rd_lptvht').val() ? new Date($('#rd_lptvht').val()).getTime() : '';
        self.visitDateEnd = $('#rd_idwdiz').val() ? new Date($('#rd_idwdiz').val()).getTime() : '';

        var data = {
          "action": "ExportOperatingStatement",
          "account": $cookies.get('account'),
          "token": $cookies.get('token'),
          "projectName": $cookies.get('projectName'),
          "exportPerson": $cookies.get('userName'),
          "search": {
            "goodsName": self.goodsName ? self.goodsName : "",
            "partnerName": self.partnerName ? self.partnerName : "",
            "orderCreateDateStart": self.orderCreateDateStart ? self.orderCreateDateStart : "", //成交日期开始
            "orderCreateDateEnd": self.orderCreateDateEnd ? self.orderCreateDateEnd : "", //成交日期结束
            "visitDateStart": self.visitDateStart ? self.visitDateStart : "",
            "visitDateEnd": self.visitDateEnd ? self.visitDateEnd : ""
          }
        };

        $http.post(url, data).then(function successCallback(response) {
            var data = response.data;
            if(data.rescode === 200) {
              if (confirm('导出中，是否到“报表中心－导出列表”中查看？')) {
                $location.path('/exportStatementsList');
              }
            }else if(data.rescode === 401){
              $location.path('/index');
            }else {
              alert(data.errInfo);
            }  
          }, function errorCallback(response) {
            alert('导出失败，请重试');
          });
      };

      // ngtable
      self.search = function() {
        self.tableParams = new NgTableParams(
          {
            page: 1, 
            count: 15,
            url: '',
            group: "partnerName"
          }, 
          {
            counts: [15, 30],
            getData: function(params) {
              var paramsUrl = params.url();

              var c = $scope.root.config;
              var url = c.requestUrl + '/statement' + c.extension;

              //如果成交时间为空，默认设置为1个月查询，如果某个时间为空，补全整个时间段前移或后移1个月
              if(!$('#rd_qcaxwa').val() && !$('#rd_khaydt').val()) {

                var sDate = new Date();
                sDate.setMonth(sDate.getMonth() - 1);
                sDate = $filter('date')(sDate.getTime(), 'yyyy-MM-dd HH:mm:ss');
                $('#rd_qcaxwa').val(sDate);
                $('#order-create-date-start').val(sDate);

                var eDate = $filter('date')(new Date().getTime(), 'yyyy-MM-dd HH:mm:ss');
                $('#rd_khaydt').val(eDate);
                $('#order-create-date-end').val(eDate);

              }
              // 仅开始时间为空时
              else if(!$('#rd_qcaxwa').val()) {
                var d = new Date($('#rd_khaydt').val());
                d.setMonth(d.getMonth() - 1);
                d = $filter('date')(d.getTime(), 'yyyy-MM-dd HH:mm:ss');
                $('#rd_qcaxwa').val(d);
                $('#order-create-date-start').val(d);
              }
              // 仅结束时间为空时
              else if(!$('#rd_khaydt').val()) {
                var d = new Date($('#rd_qcaxwa').val());
                d.setMonth(d.getMonth() + 1);
                d = $filter('date')(d.getTime(), 'yyyy-MM-dd HH:mm:ss');
                $('#rd_khaydt').val(d);
                $('#order-create-date-end').val(d);
              }

              //读取成交日期
              self.orderCreateDateStart = $('#rd_qcaxwa').val() ? new Date($('#rd_qcaxwa').val()).getTime() : '';
              self.orderCreateDateEnd = $('#rd_khaydt').val() ? new Date($('#rd_khaydt').val()).getTime() : '';
              
              //读取游玩日期
              self.visitDateStart = $('#rd_lptvht').val() ? new Date($('#rd_lptvht').val()).getTime() : '';
              self.visitDateEnd = $('#rd_idwdiz').val() ? new Date($('#rd_idwdiz').val()).getTime() : '';

              var data = {
                "action": "GetCheckStatement",
                "account": $cookies.get('account'),
                "token": $cookies.get('token'),
                "projectName": $cookies.get('projectName'),
                "count": paramsUrl.count, //一页显示数量
                "page": paramsUrl.page,   //当前页
                "search": {
                  "goodsName": self.goodsName ? self.goodsName : "",
                  "partnerName": self.partnerName ? self.partnerName : "",
                  "orderCreateDateStart": self.orderCreateDateStart ? self.orderCreateDateStart : "", //成交日期开始
                  "orderCreateDateEnd": self.orderCreateDateEnd ? self.orderCreateDateEnd : "", //成交日期结束
                  "visitDateStart": self.visitDateStart ? self.visitDateStart : "",
                  "visitDateEnd": self.visitDateEnd ? self.visitDateEnd : ""
                }
              };

              data = JSON.stringify(data);
              self.loading = true;
              
              return $http.post(url, data).then(function successCallback(response) {
                  var data = response.data;
                  if(data.rescode === 200) {
                    self.loading = false;
                    params.total(data.lists.totalCount);
                    self.tableData = data.lists.lists;
                    self.totalTotalTickets = data.lists.totalTotalTickets;
                    self.totalCheckedTickets = data.lists.totalCheckedTickets;
                    self.totalReturnedTickets = data.lists.totalReturnedTickets;
                    self.totalWaitingTickets = data.lists.totalWaitingTickets;
                    self.totalCheckedPrice = data.lists.totalCheckedPrice;
                    return data.lists.lists;
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
      };
    }
  ]);
  
  app.controller('orderDetailController', ['$scope', '$state', '$stateParams', '$http', '$cookies', '$location', '$filter', 
    function($scope, $state, $stateParams, $http, $cookies, $location, $filter) {
      console.log('orderDetail');
      var self = this;
      self.id = $scope.root.coverParamId;

      this.close = function() {
        $scope.root.coverUrl = '';
        $scope.root.coverParamId = '';
      };

      // get data
      var c = $scope.root.config;
      var url = c.requestUrl + '/orders' + c.extension;

      var data = {
        "action": "GetDetail",
        "account": $cookies.get('account'),
        "token": $cookies.get('token'),
        "projectName": $cookies.get('projectName'),
        "orderId": self.id
      };
      data = JSON.stringify(data);

      $http.post(url, data).then(function successCallback(response) {
          var data = response.data;
          if(data.rescode === 200) {
            self.orders = data.orders;
          }else if(data.rescode === 401){
            $location.path('/index');
          }else {
            alert(data.errInfo);
          }  
        }, function errorCallback(response) {
          alert('读取信息失败');
        });

    }
  ]);

  app.controller('ordersListController', ['$filter', '$scope', '$http', '$cookies', '$location', '$window', 'NgTableParams',
    function($filter, $scope, $http, $cookies, $location, $window, NgTableParams) {
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

      self.export = function() {
        var c = $scope.root.config;
        var url = c.requestUrl + '/orders' + c.extension;


        //如果成交时间为空，默认设置为1个月查询，如果某个时间为空，补全整个时间段前移或后移1个月
        if(!$('#rd_qcaxwa').val() && !$('#rd_khaydt').val()) {

          var sDate = new Date();
          sDate.setMonth(sDate.getMonth() - 1);
          sDate = $filter('date')(sDate.getTime(), 'yyyy-MM-dd');
          $('#rd_qcaxwa').val(sDate);
          $('#order-create-date-start').val(sDate);

          var eDate = $filter('date')(new Date().getTime(), 'yyyy-MM-dd');
          $('#rd_khaydt').val(eDate);
          $('#order-create-date-end').val(eDate);

        }
        // 仅开始时间为空时
        else if(!$('#rd_qcaxwa').val()) {
          var d = new Date($('#rd_khaydt').val());
          d.setMonth(d.getMonth() - 1);
          d = $filter('date')(d.getTime(), 'yyyy-MM-dd');
          $('#rd_qcaxwa').val(d);
          $('#order-create-date-start').val(d);
        }
        // 仅结束时间为空时
        else if(!$('#rd_khaydt').val()){
          var d = new Date($('#rd_qcaxwa').val());
          d.setMonth(d.getMonth() + 1);
          d = $filter('date')(d.getTime(), 'yyyy-MM-dd');
          $('#rd_khaydt').val(d);
          $('#order-create-date-end').val(d);
        }

        //读取成交日期
        self.orderCreateDateStart = $('#rd_qcaxwa').val() ? new Date($('#rd_qcaxwa').val() + ' 00:00:00').getTime() : '';
        self.orderCreateDateEnd = $('#rd_khaydt').val() ? new Date($('#rd_khaydt').val() + ' 23:59:59').getTime() : '';
        
        //读取游玩日期
        self.visitDateStart = $('#rd_lptvht').val() ? new Date($('#rd_lptvht').val() + ' 00:00:00').getTime() : '';
        self.visitDateEnd = $('#rd_idwdiz').val() ? new Date($('#rd_idwdiz').val() + ' 23:59:59').getTime() : '';
        
        var data = {
          "action": "Export",
          "account": $cookies.get('account'),
          "token": $cookies.get('token'),
          "projectName": $cookies.get('projectName'),
          "sortBy": "OrderCreateTime",
          "orderBy": "desc",
          "search": {
            "orderId": self.orderId ? self.orderId : "",
            "parterOrderId": self.parterOrderId ? self.parterOrderId : "",
            "bookPerson": self.bookPerson ? self.bookPerson : "",
            "bookMobile": self.bookMobile ? self.bookMobile : "",
            "goodsName": self.goodsName ? self.goodsName : "",
            "checkStatus": self.checkStatus ? self.checkStatus : "all", //checked：已检票，checking：检票中，waiting：待检票
            "partnerName": self.partnerName ? self.partnerName : "",
            "orderCreateDateStart": self.orderCreateDateStart ? self.orderCreateDateStart : "", //成交日期开始
            "orderCreateDateEnd": self.orderCreateDateEnd ? self.orderCreateDateEnd : "", //成交日期结束
            "visitDateStart": self.visitDateStart ? self.visitDateStart : "",
            "visitDateEnd": self.visitDateEnd ? self.visitDateEnd : "",
            "isExpired": self.isExpired ? self.isExpired : "all"
          }
        };

        $http.post(url, data).then(function successCallback(response) {
            var data = response.data;
            if(data.rescode === 200) {
              if (confirm('导出中，是否到“报表中心－导出列表”中查看？')) {
                $location.path('/exportStatementsList');
              }
            }else if(data.rescode === 401){
              $location.path('/index');
            }else {
              alert(data.errInfo);
            }  
          }, function errorCallback(response) {
            alert('导出失败，请重试');
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
              var url = c.requestUrl + '/orders' + c.extension;

              //如果成交时间为空，默认设置为1个月查询，如果某个时间为空，补全整个时间段前移或后移1个月
              if(!$('#rd_qcaxwa').val() && !$('#rd_khaydt').val()) {

                var sDate = new Date();
                sDate.setMonth(sDate.getMonth() - 1);
                sDate = $filter('date')(sDate.getTime(), 'yyyy-MM-dd');
                $('#rd_qcaxwa').val(sDate);
                $('#order-create-date-start').val(sDate);

                var eDate = $filter('date')(new Date().getTime(), 'yyyy-MM-dd');
                $('#rd_khaydt').val(eDate);
                $('#order-create-date-end').val(eDate);

              }
              // 仅开始时间为空时
              else if(!$('#rd_qcaxwa').val()) {
                var d = new Date($('#rd_khaydt').val());
                d.setMonth(d.getMonth() - 1);
                d = $filter('date')(d.getTime(), 'yyyy-MM-dd');
                $('#rd_qcaxwa').val(d);
                $('#order-create-date-start').val(d);
              }
              // 仅结束时间为空时
              else if(!$('#rd_khaydt').val()){
                var d = new Date($('#rd_qcaxwa').val());
                d.setMonth(d.getMonth() + 1);
                d = $filter('date')(d.getTime(), 'yyyy-MM-dd');
                $('#rd_khaydt').val(d);
                $('#order-create-date-end').val(d);
              }

              //读取成交日期
              self.orderCreateDateStart = $('#rd_qcaxwa').val() ? new Date($('#rd_qcaxwa').val() + ' 00:00:00').getTime() : '';
              self.orderCreateDateEnd = $('#rd_khaydt').val() ? new Date($('#rd_khaydt').val() + ' 23:59:59').getTime() : '';
              
              //读取游玩日期
              self.visitDateStart = $('#rd_lptvht').val() ? new Date($('#rd_lptvht').val() + ' 00:00:00').getTime() : '';
              self.visitDateEnd = $('#rd_idwdiz').val() ? new Date($('#rd_idwdiz').val() + ' 23:59:59').getTime() : '';
              
              var data = {
                "action": "GetList",
                "account": $cookies.get('account'),
                "token": $cookies.get('token'),
                "projectName": $cookies.get('projectName'),
                "sortBy": "OrderCreateTime",
                "orderBy": "desc",
                "count": paramsUrl.count, //一页显示数量
                "page": paramsUrl.page,   //当前页
                "search": {
                  "orderId": self.orderId ? self.orderId : "",
                  "parterOrderId": self.parterOrderId ? self.parterOrderId : "",
                  "bookPerson": self.bookPerson ? self.bookPerson : "",
                  "bookMobile": self.bookMobile ? self.bookMobile : "",
                  "goodsName": self.goodsName ? self.goodsName : "",
                  "checkStatus": self.checkStatus ? self.checkStatus : "all", //checked：已检票，checking：检票中，waiting：待检票
                  "partnerName": self.partnerName ? self.partnerName : "",
                  "orderCreateDateStart": self.orderCreateDateStart ? self.orderCreateDateStart+"" : "", //成交日期开始
                  "orderCreateDateEnd": self.orderCreateDateEnd ? self.orderCreateDateEnd+"" : "", //成交日期结束
                  "visitDateStart": self.visitDateStart ? self.visitDateStart : "",
                  "visitDateEnd": self.visitDateEnd ? self.visitDateEnd : "",
                  "isExpired": self.isExpired ? self.isExpired : "all"
                }
              };
              data = JSON.stringify(data);console.log(data);
              self.loading = true;
              
              return $http.post(url, data).then(function successCallback(response) {
                  var data = response.data;
                  if(data.rescode === 200) {
                    self.loading = false;
                    params.total(data.orders.totalCount);
                    self.tableData = data.orders.lists;
                    return data.orders.lists;
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

      self.showDetail = function(orderId) {
        $scope.root.coverUrl = 'pages/orderDetail.html';
        $scope.root.coverParamId = orderId;
      }
    }
  ]);

  app.controller('personalInfoController', ['$scope', '$state', '$stateParams', '$http', '$cookies', '$location', '$filter', '$window',
    function($scope, $state, $stateParams, $http, $cookies, $location, $filter, $window) {
      console.log('personalInfo');

      var self = this;
      self.id = $cookies.get('userId');

      self.init = function() {
        self.setSubmit(false);

        // get data
        var c = $scope.root.config;
        var url = c.requestUrl + '/users' + c.extension;

        var data = {
          "action": "GetDetail",
          "account": $cookies.get('account'),
          "token": $cookies.get('token'),
          "projectName": $cookies.get('projectName'),
          "userId": self.id
        };
        data = JSON.stringify(data);

        $http.post(url, data).then(function successCallback(response) {
            var data = response.data;
            if(data.rescode === 200) {
              self.user = data.user;
              // 更新导航栏和cookies的用户名
              $scope.main.userName = data.user.userName;
              $cookies.put('userName', data.user.userName);
            }else if(data.rescode === 401){
              $location.path('/index');
            }else {
              alert(data.errInfo);
            }  
          }, function errorCallback(response) {
            alert('读取信息失败');
          });        
      };

      self.setSubmit = function (status) {
        if(status) {
          this.btnText = "保存中...";
          this.submitting = true;
        }else {
          self.btnText = "保存修改";
          self.submitting = false;
        }
      }

      self.submit = function() {
        var c = $scope.root.config;
        var url = c.requestUrl + '/users' + c.extension;

        var data = {
          "action": "Modify",
          "account": $cookies.get('account'),
          "token": $cookies.get('token'),
          "projectName": $cookies.get('projectName'),
          "user": self.user
        };
        data = JSON.stringify(data);
        self.setSubmit(true);

        $http.post(url, data).then(function successCallback(response) {
            var data = response.data;
            if(data.rescode === 200) {
              alert('保存成功');
              $window.location.reload();
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

  app.controller('personalPasswordEditController', ['$scope', '$state', '$stateParams', '$http', '$cookies', '$location', '$filter',
    function($scope, $state, $stateParams, $http, $cookies, $location, $filter) {
      console.log('personalPasswordEdit');

      var self = this;
      self.id = $cookies.get('userId');

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

      self.submit = function() {

        //判断2次密码输入是否一致
        if(self.newPassword2 !== self.newPassword) {
          alert('新密码不一致');
          return;
        }

        var c = $scope.root.config;
        var url = c.requestUrl + '/users' + c.extension;
        var data = {
          "action": "modifyPassword",
          "account": $cookies.get('account'),
          "token": $cookies.get('token'),
          "projectName": $cookies.get('projectName'),
          "myUserId": $cookies.get('userId'),
          "modifyUserId": self.id,
          "myPassword":$filter('md5_32_lowerCase')(self.myPassword),
          "newPassword":$filter('md5_32_lowerCase')(self.newPassword)
        };
        data = JSON.stringify(data);
        self.setSubmit(true);

        $http.post(url, data).then(function successCallback(response) {
            var data = response.data;
            if(data.rescode === 200) {
              alert('保存成功，请重新登录');
              $cookies.put('token', '');              
              $location.path('/index');
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
      };
    }
  ]);

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
              var d = data.goods;
              d.cost = parseFloat(d.cost);
              self.goods = d;

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

      self.changeStatus = function(status, id) {
        var c = $scope.root.config;
        var url = c.requestUrl + '/goods' + c.extension;
        var data = {
          "action": "ChangeStatus",
          "account": $cookies.get('account'),
          "token": $cookies.get('token'),
          "projectName": $cookies.get('projectName'),
          "goodsId": id,
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

      self.changeStatus = function(status, id) {
        var c = $scope.root.config;
        var url = c.requestUrl + '/sale' + c.extension;
        var data = {
          "action": "ChangeStatus",
          "account": $cookies.get('account'),
          "token": $cookies.get('token'),
          "projectName": $cookies.get('projectName'),
          "saleId": id,
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

      self.changeStatus = function(status, id) {
        var c = $scope.root.config;
        var url = c.requestUrl + '/partners' + c.extension;
        var data = {
          "action": "ChangeStatus",
          "account": $cookies.get('account'),
          "token": $cookies.get('token'),
          "projectName": $cookies.get('projectName'),
          "partnerCode": id,
          "state": status === 'on' ? 'off' : 'on'
        };
        data = JSON.stringify(data);
        console.log(data);
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
                "sortBy": "CreateDate",
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
        "sortBy": "CreateDate",
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
      self.sale.state = 'on';
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
      console.log(data);
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
            var d = data.sale;
            d.price = parseFloat(d.price);
            self.sale = d;

            // 有效时间设置
            var sDate = $filter('date')(data.sale.saleDateStart, 'yyyy-MM-dd');
            var eDate = $filter('date')(data.sale.saleDateEnd, 'yyyy-MM-dd');
            $('#rd_dmukgs').val(sDate);
            $('#sale-date-start').val(sDate);
            $('#rd_qcaxwa').val(eDate);
            $('#sale-date-end').val(eDate);


            self.initPartnersList();
            self.initpartnerConfig();

          }else if(data.rescode === 401){
            $location.path('/index');
          }else {
            alert(data.errInfo);
          }  
        }, function errorCallback(response) {
          alert('加载失败，请重试');
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
        "sortBy": "CreateDate",
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