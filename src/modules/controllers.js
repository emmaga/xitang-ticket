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
        case 'checkTourist':
        case 'checkStatement':
        case 'exportBookerDetailStatement':
        case 'updateVisitStatement':
          $scope.$state = 'statement';
          break;
        case 'userList':
        case 'userAdd':
        case 'userEdit':
        case 'updateVisitStatement':
          $scope.$state = 'admin';
          break;
        case 'personalPasswordEdit':
        case 'personalInfo':
          $scope.$state = 'personal';
          break;
        case 'ordersCharts':
        case 'monthlySales':
        case 'goodsRate':
        case 'yearlySales':
        case 'sexRatio':
        case 'ageRatio':
        case 'provinceRatio':
            $scope.$state = 'charts';
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
              alert('登录超时，请重新登录');
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
              alert('登录超时，请重新登录');
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
              self.noData = false;

              return $http.post(url, data).then(function successCallback(response) {
                  self.loading = false;
                  var data = response.data;
                  if(data.rescode === 200) {
                    self.checkboxes = { 'checked': false, items: {} };
                    //查无数据
                    if(data.users.totalCount === 0) {
                      self.noData = true;
                    }
                    params.total(data.users.totalCount);
                    self.tableData = data.users.lists;
                    return data.users.lists;
                  }else if(data.rescode === 401){
                    alert('登录超时，请重新登录');
                    $location.path('/index');
                  }else {
                    alert(data.errInfo);
                  }  
                }, function errorCallback(response) {
                  self.loading = false;
                  alert('加载失败，请重试');
                });
            }
          }
        );
      }
    }
  ]);
  
  app.controller('userAddController', ['$scope', '$location', '$cookies', '$http', '$filter', function($scope, $location, $cookies, $http, $filter) {
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
            alert('登录超时，请重新登录');
            $location.path('/index');
          }else {
            alert(data.errInfo);
          }  
        }, function errorCallback(response) {
          alert('读取角色信息失败，请刷新页面重试');
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

      // 账号由3-16位的数字或英文字母组成
      var exp='^[0-9a-zA-Z]{3,16}$';
      var reg= new RegExp(exp);
      if(!reg.test(self.user.account)){
        alert('账号格式不正确');
        return;
      }

      var c = $scope.root.config;
      var url = c.requestUrl + '/users' + c.extension;
      this.user.status = 'on';
      self.user.roleId = self.myRole.id;
      self.user.password = $filter('md5_32_lowerCase')(self.user.password);
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
            alert('登录超时，请重新登录');
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
              alert('登录超时，请重新登录');
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
              alert('登录超时，请重新登录');
              $location.path('/index');
            }else {
              alert(data.errInfo);
            }  
          }, function errorCallback(response) {
            alert('读取角色信息失败，请刷新页面重试');
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
              alert('登录超时，请重新登录');
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
        
        // 账号由3-16位的数字或英文字母组成
        var exp='^[0-9a-zA-Z]{3,16}$';
        var reg= new RegExp(exp);
        if(!reg.test(self.user.account)){
          alert('账号格式不正确');
          return;
        }

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
              alert('登录超时，请重新登录');
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
      self.showPersonDetail = function(orderId) {
        $scope.root.coverUrl = 'pages/personDetail.html';
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
              // 本地测试
              // var url = c.requestUrl + '/toBeChecked' + c.extension;
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
                  "bookMobile": self.bookMobile ? self.bookMobile : "",
                  "orderTicketCode": self.orderTicketCode ? self.orderTicketCode : "",
                  "bookerIDType": self.bookerIDType ? self.bookerIDType : "",
                  "bookerID": self.bookerID ? self.bookerID : "",
                }
              };
              data = JSON.stringify(data);
              self.loading = true;
              self.noData = false;

              return $http.post(url, data).then(function successCallback(response) {
                  self.loading = false;
                  var data = response.data;
                  if(data.rescode === 200) {
                    // 查无数据
                    if(data.orders.totalCount === 0) {
                      self.noData = true;
                    }

                    params.total(data.orders.totalCount);
                    self.tableData = data.orders.lists;
                    return data.orders.lists;
                  }else if(data.rescode === 401){
                    alert('登录超时，请重新登录');
                    $location.path('/index');
                  }else {
                    alert(data.errInfo);
                  }  
                }, function errorCallback(response) {
                  self.loading = false;
                  alert('加载失败，请重试');
                });
            }
          }
        );
      }

      self.checkDetail = function(orderId) {
        $scope.root.coverUrl = 'pages/check.html';
        $scope.root.coverParamId = orderId;
        $scope.root.callback = function(){self.search();}
      }
    }
  ]);

  app.controller('checkController', ['$filter', '$scope', '$http', '$cookies', '$location', '$state', '$stateParams', 
    function($filter, $scope, $http, $cookies, $location, $state, $stateParams) {
      console.log('check');
      var self = this;
      
      self.confirmPay = function(){
        self.checkPay = !self.checkPay;
        self.disableCheckBtn(!self.checkPay);
      }

      self.disableCheckBtn = function(boo) {
        if (boo) {
          var btn = document.getElementById('btn-check');
          btn.disabled=true;
         } else {
          var btn = document.getElementById('btn-check');
          btn.disabled=false;
         }
      }

      // 确认提交按钮 
      self.showTxtFunc = function(boo){
           if (boo) {
            self.showTxt = "确认检票"
            self.disableCheckBtn(false);
           } else {
            self.showTxt = "检票中...";
            self.disableCheckBtn(true);
           }
      }
      
      this.close = function() {
        $scope.root.coverUrl = '';
        $scope.root.coverParamId = '';
        $scope.root.callback = '';
      };

      this.check = function() {
        var btn = document.getElementById('btn-check');
        
        console.log('btn.disabled' + btn.disabled);

        self.showTxtFunc(false);
        
        console.log('btn.disabled' + btn.disabled);

        var c = $scope.root.config;
        var url = c.requestUrl + '/orders' + c.extension;
        var serialNo = getSerialNo(new Date().getTime(), self.id, self.orders.checkNumber, $cookies.get('userId'));

        var data = {
          "action": "Check",
          "account": $cookies.get('account'),
          "token": $cookies.get('token'),
          "projectName": $cookies.get('projectName'),
          "orderId": self.id,
          "checkNumber": self.orders.checkNumber,  //检票数量
          "userName": $cookies.get('userName'),
          "serialNo": serialNo
        };
        data = JSON.stringify(data);
        $http.post(url, data).then(function successCallback(response) {
            var data = response.data;
            self.showTxtFunc(true);
            if(data.rescode === 200) {
              alert('检票成功')
              self.close();
              // $state.reload();
              self.callback();
            }else if(data.rescode === 401){
              alert('登录超时，请重新登录');
              $location.path('/index');
            }else {
              alert(data.errInfo);
            }  
          }, function errorCallback(response) {
            self.showTxtFunc(true);
            alert('检票可能失败，请返回“手动检票”列表复查。');
          });
      };

      /* 生成序列号：按“timestamp(精确到毫秒)，订单号，检票数，检票员userid”顺序字符串相加
       * @timestamp 时间戳（精确到毫秒）
       * @orderNum 订单号
       * @checkNum 检票数
       * @checkPersonID 检票员userid
       */
      function getSerialNo(timestamp, orderNum, checkNum, checkPersonID) {
        var str = '' + timestamp + orderNum + checkNum + checkPersonID;
        return str;
      }

      this.init = function() {
        self.id = $scope.root.coverParamId;
        self.callback = $scope.root.callback;
        
        // 是否支付, 默认未支付,是否可以提交
        self.checkPay = false;

        // 检票按钮初始化
        self.showTxtFunc(true);

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
              // 不是到付，则允许点击 检票按钮
              if (self.orders.offlinePay == 0) {
                self.checkPay = true;
              }
            }else if(data.rescode === 401){
              alert('登录超时，请重新登录');
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
        $('.form_date').datetimepicker({
            language:  'zh-CN',
            weekStart: 1,
            todayBtn:  1,
            autoclose: 1,
            todayHighlight: 1,
            startView: 2,
            minView: 2,
            forceParse: 0,
            showMeridian: 1
        });
        self.search(false);
        $('#check-time-start').val('00:00:00')
        $('#check-time-end').val('23:59:59')
      }

      self.clearCheckStart = function () {
        $('#check-time-start').val('00:00:00')
        $('#rd_qcaxwa').val('')
        $('#check-date-start').val('')
      }
      self.clearCheckEnd = function () {
        $('#check-time-end').val('23:59:59')
        $('#rd_khaydt').val('')
        $('#check-date-end').val('')
      }
      self.sumFloat = function(data, field){
        var t = 0;
        for (var i = 0; i < data.length; i++) {
          t += parseFloat(data[i][field]);
        }
        return t.toFixed(2);
      };

      self.sum = function(data, field){
        var t = 0;
        for (var i = 0; i < data.length; i++) {
          t += Number(data[i][field]);
        }
        return t;
      };
   
      self.ticket = function(data, field) {
        var ret = "";
        var tickets = [];
        for (var i = 0; i < data.length; i++) {
          checkTickets(data[i][field], data[i]['checkedTickets']);
        }
        for(var i = 0; i < tickets.length; i++) {
          ret += tickets[i].name +'：'+ tickets[i].num ;
          if (i  < tickets.length -1) {
            ret  += '，';
          }
        }
        return ret;

        function checkTickets(name, ticketsCount) {
          var tc = Number(ticketsCount);
          var isIn = false;
          for(var i = 0; i < tickets.length; i++) {
            if(name == tickets[i].name) {
              tickets[i].num += tc;
              isIn = true;
              break;
            }
          }
          if(!isIn) {
            tickets.push({name: name, num: tc});
          }
        }
      }

      self.isLastPage = function() {
        return self.tableParams.page() === totalPages();
      }

      function totalPages(){
        return Math.ceil(self.tableParams.total() / self.tableParams.count());
      }

      self.export = function() {
        var c = $scope.root.config;
        var url = c.requestUrl + '/statement' + c.extension;

        //如果检票时间为空，默认设置为当天查询，如果某个时间为空
        if(!$('#rd_qcaxwa').val() && !$('#rd_khaydt').val()) {

          var sDate = new Date();
          
          sDate = $filter('date')(sDate.getTime(), 'yyyy-MM-dd');
          $('#rd_qcaxwa').val(sDate);
          $('#check-date-start').val(sDate);

          var eDate = new Date();
          
          eDate = $filter('date')(eDate.getTime(), 'yyyy-MM-dd');
          $('#rd_khaydt').val(eDate);
          $('#check-date-end').val(eDate);

        }
        // 仅开始时间为空时
        else if(!$('#rd_qcaxwa').val()) {          
          $('#rd_qcaxwa').val($('#rd_khaydt').val());
          $('#check-date-start').val($('#rd_khaydt').val());
        }
        // 仅结束时间为空时
        else if(!$('#rd_khaydt').val()) {
          $('#rd_khaydt').val($('#rd_qcaxwa').val());
          $('#check-date-end').val($('#rd_qcaxwa').val());
        }

        //读取成交日期
        self.checkDateStart = $('#rd_qcaxwa').val() ? new Date($('#rd_qcaxwa').val() + ' ' + $('#check-time-start').val()).getTime() : '';
        self.checkDateEnd = $('#rd_khaydt').val() ? new Date($('#rd_khaydt').val() + ' ' + $('#check-time-end').val()).getTime() : '';
      
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
            "checkDateEnd": self.checkDateEnd ? self.checkDateEnd : "" //检票日期结束
          }
        };

        $http.post(url, data).then(function successCallback(response) {
            var data = response.data;
            if(data.rescode === 200) {
              if (confirm('导出中，导出成功后会在“报表中心－导出列表”中显示，是否前往查看？')) {
                $location.path('/exportStatementsList');
              }
            }else if(data.rescode === 401){
              alert('登录超时，请重新登录');
              $location.path('/index');
            }else {
              alert(data.errInfo);
            }  
          }, function errorCallback(response) {
            alert('导出失败，请重试');
          });
      };

      // ngtable
      self.search = function(flag) {
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
              // 页面初始化时，添加默认时间段；页面点击时，不添加默认时间段
              if (!flag) {
                  //如果检票时间为空，默认设置为当天查询，如果某个时间为空
                  if (!$('#rd_qcaxwa').val() && !$('#rd_khaydt').val()) {
                      var sDate = new Date(); 
                      sDate = $filter('date')(sDate.getTime(), 'yyyy-MM-dd');
                      $('#rd_qcaxwa').val(sDate);
                      $('#check-date-start').val(sDate);

                      var eDate = new Date();
                     
                      eDate = $filter('date')(eDate.getTime(), 'yyyy-MM-dd');
                      $('#rd_khaydt').val(eDate);
                      $('#check-date-end').val(eDate);

                  }
                  // 仅开始时间为空时
                  else if (!$('#rd_qcaxwa').val()) {                     
                      $('#rd_qcaxwa').val($('#rd_khaydt').val());
                      $('#check-date-start').val($('#rd_khaydt').val());
                  }
                  // 仅结束时间为空时
                  else if (!$('#rd_khaydt').val()) {
                      $('#rd_khaydt').val($('#rd_qcaxwa').val());
                      $('#check-date-end').val($('#rd_qcaxwa').val());
                  }
              }

              //读取检票日期
              self.checkDateStart = $('#rd_qcaxwa').val() ? new Date($('#rd_qcaxwa').val() + ' ' + $('#check-time-start').val()).getTime() : '';
              self.checkDateEnd = $('#rd_khaydt').val() ? new Date($('#rd_khaydt').val() + ' ' + $('#check-time-end').val()).getTime() : '';
            
              var data = {
                "action": "GetcheckDetailStatement",
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
                  "checkDateEnd": self.checkDateEnd ? self.checkDateEnd : "" //检票日期结束
                }
              };

              data = JSON.stringify(data);
              self.loading = true;
              self.noData = false;
              
              return $http.post(url, data).then(function successCallback(response) {
                  var data = response.data;
                  self.loading = false;
                  if(data.rescode === 200) {
                    //查无数据
                    if(data.lists.totalCount === 0) {
                      self.noData = true;
                    }
                    params.total(data.lists.totalCount);
                    self.tableData = data.lists.lists;
                    self.totalCheckedTickets = data.lists.totalCheckedTickets;
                    self.totalCheckedPrice = data.lists.totalCheckedPrice;
                    return data.lists.lists;
                  } else if(data.rescode === 401){
                    alert('登录超时，请重新登录');
                    $location.path('/index');
                  } else {
                    alert(data.errInfo);
                  }  
                }, function errorCallback(response) {
                  self.loading = false;
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
              alert('登录超时，请重新登录');
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
              self.noData = false;
              
              return $http.post(url, data).then(function successCallback(response) {
                  self.loading = false;
                  var data = response.data;
                  if(data.rescode === 200) {
                    self.checkboxes = { 'checked': false, items: {} };
                    //查无数据
                    if(data.statements.totalCount === 0) {
                      self.noData = true;
                    }
                    params.total(data.statements.totalCount);
                    self.tableData = data.statements.lists;
                    return data.statements.lists;
                  }else if(data.rescode === 401){
                    alert('登录超时，请重新登录');
                    $location.path('/index');
                  }else {
                    self.loading = false;
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
      // 显示报表列表 或 明细列表
      // 默认显示 报表列表
      self.showTable = function(bool){
          if (bool) {
             self.showStatement = true;
          } else {
              self.showStatement = false;
          }
      }
      self.showTable(true);

      self.init = function() {
        $('.form_date').datetimepicker({
          language:  'zh-CN',
          weekStart: 1,
          todayBtn:  1,
          autoclose: 1,
          todayHighlight: 1,
          startView: 2,
          minView: 2,
          forceParse: 0,
          showMeridian: 1
        });
        $('#order-create-time-start').val('00:00:00')
        $('#order-create-time-end').val('23:59:59')
        $('#check-time-start').val('00:00:00')
        $('#check-time-end').val('23:59:59')
      }
      // 成交 检票的清除按钮
      self.clearOrderStart = function () {
        $('#order-create-time-start').val('00:00:00')
        $('#rd_qcaxwa').val('')
        $('#order-create-date-start').val('')
      }
      self.clearOrderEnd = function () {
        $('#order-create-time-end').val('23:59:59')
        $('#rd_khaydt').val('')
        $('#order-create-date-end').val('')
      }
      self.clearCheckStart = function () {
        $('#check-time-start').val('00:00:00')
        $('#rd_lptvht').val('')
        $('#check-date-start').val('')
      }
      self.clearCheckEnd = function () {
        $('#check-time-end').val('23:59:59')
        $('#rd_idwdiz').val('')
        $('#check-date-end').val('')
      }
      self.sum = function(data, field){
        var t = 0;
        for (var i = 0; i < data.length; i++) {
          t += parseFloat(data[i][field]);
        }
        return t.toFixed(2);
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

        //如果检票时间为空，默认设置为当天查询，如果某个时间为空，补全整个时间段前移或后移
        if(!$('#rd_lptvht').val() && !$('#rd_idwdiz').val()) {
          var sDate = new Date();
          sDate = $filter('date')(sDate.getTime(), 'yyyy-MM-dd');
          $('#rd_lptvht').val(sDate);
          $('#check-date-start').val(sDate);
          var eDate = new Date();
          eDate = $filter('date')(eDate.getTime(), 'yyyy-MM-dd');
          $('#rd_idwdiz').val(eDate);
          $('#check-date-end').val(eDate);
        }

        // 仅开始时间为空时
        else if(!$('#rd_lptvht').val()) {
          $('#rd_lptvht').val($('#rd_idwdiz').val());
          $('#check-date-start').val($('#rd_idwdiz').val());
        }
        // 仅结束时间为空时
        else if(!$('#rd_idwdiz').val()) {
          $('#rd_idwdiz').val($('#rd_lptvht').val());
          $('#check-date-end').val($('#rd_lptvht').val());
        }

        //读取成交日期
        self.orderCreateDateStart = $('#rd_qcaxwa').val() ? new Date($('#rd_qcaxwa').val() + ' ' + $('#order-create-time-start').val()).getTime() : '';
        self.orderCreateDateEnd = $('#rd_khaydt').val() ? new Date($('#rd_khaydt').val() + ' ' + $('#order-create-time-end').val()).getTime() : '';
        
        //读取检票日期
        self.checkDateStart = $('#rd_lptvht').val() ? new Date($('#rd_lptvht').val() + ' ' + $('#check-time-start').val()).getTime() : '';
        self.checkDateEnd = $('#rd_idwdiz').val() ? new Date($('#rd_idwdiz').val() + ' ' + $('#check-time-end').val()).getTime() : '';

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
            "checkDateEnd": self.checkDateEnd ? self.checkDateEnd : "",
            "checkUserName": self.checkUserName ? self.checkUserName : ""
          }
        };
        alert('导出命令已发送，请稍后');
        $http.post(url, data).then(function successCallback(response) {
            var data = response.data;
            if(data.rescode === 200) {
              if (confirm('导出已成功，是否前往查看？')) {
                $location.path('/exportStatementsList');
              }
            }else if(data.rescode === 401){
              alert('登录超时，请重新登录');
              $location.path('/index');
            }else {
              alert(data.errInfo);
            }  
          }, function errorCallback(response) {
            alert('导出失败，请重试');
          });
      };
      

      // ngtable 报表列表
      self.search = function(flag) {
        self.showTable(true);
        self.tableParams = new NgTableParams(
          {
            page: 1, 
            count: 15,
            url: '',
            group: "partnerName"
          }, 
          {
            // 不分页
            // counts: [],
            counts: [15,30],
            getData: function(params) {
              var paramsUrl = params.url();

              var c = $scope.root.config;
              var url = c.requestUrl + '/statement' + c.extension;
              // 页面初始化时，添加默认时间段；页面点击时，不添加默认时间段
              if (!flag) { 
                //如果检票时间为空，默认设置为当天查询，如果某个时间为空，补全整个时间段前移或后移
                if(!$('#rd_lptvht').val() && !$('#rd_idwdiz').val()) {

                  var sDate = new Date();
                  sDate = $filter('date')(sDate.getTime(), 'yyyy-MM-dd');
                  $('#rd_lptvht').val(sDate);
                  $('#check-date-start').val(sDate);
                  var eDate = new Date();
                  eDate = $filter('date')(eDate.getTime(), 'yyyy-MM-dd');
                  $('#rd_idwdiz').val(eDate);
                  $('#check-date-end').val(eDate);

                }
                // 仅开始时间为空时
                else if(!$('#rd_lptvht').val()) {
                  $('#rd_lptvht').val($('#rd_idwdiz').val());
                  $('#check-date-start').val($('#rd_idwdiz').val());
                }
                // 仅结束时间为空时
                else if(!$('#rd_idwdiz').val()) {
                  $('#rd_idwdiz').val($('#rd_lptvht').val());
                  $('#check-date-end').val($('#rd_lptvht').val());
                }
              }
               
              //读取成交日期             
              self.orderCreateDateStart = $('#rd_qcaxwa').val() ? new Date($('#rd_qcaxwa').val() + ' ' + $('#order-create-time-start').val()).getTime() : '';
              self.orderCreateDateEnd = $('#rd_khaydt').val() ? new Date($('#rd_khaydt').val() + ' ' + $('#order-create-time-end').val()).getTime() : '';
              
              //读取检票日期
              self.checkDateStart = $('#rd_lptvht').val() ? new Date($('#rd_lptvht').val() + ' ' + $('#check-time-start').val()).getTime() : '';
              self.checkDateEnd = $('#rd_idwdiz').val() ? new Date($('#rd_idwdiz').val() + ' ' + $('#check-time-end').val()).getTime() : '';
              
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
                  "checkDateEnd": self.checkDateEnd ? self.checkDateEnd : "",
                  "checkUserName": self.checkUserName ? self.checkUserName : ""
                }
              };

              data = JSON.stringify(data);
              self.loading = true;
              self.noData = false;
              
              return $http.post(url, data).then(function successCallback(response) {
                  self.loading = false;
                  var data = response.data;
                  if(data.rescode === 200) {
                    //查无数据
                    if(data.lists.totalCount === 0) {
                      self.noData = true;
                    }
                    params.total(data.lists.totalCount);
                    self.tableData = data.lists.lists;
                    self.totalTotalTickets = data.lists.totalTotalTickets;
                    self.totalCheckedTickets = data.lists.totalCheckedTickets;
                    self.totalCheckedPrice = data.lists.totalCheckedPrice;
                    return data.lists.lists;
                  }else if(data.rescode === 401){
                    alert('登录超时，请重新登录');
                    $location.path('/index');
                  }else {
                    alert(data.errInfo);
                  }  
                }, function errorCallback(response) {
                  self.loading = false;
                  alert('加载失败，请重试');
                });
            }
          }
        );
      };
      // ngtable 明细列表
      self.searchDetail = function(flag) {
        self.showTable(false);
        self.detailTaleParams = new NgTableParams(
          {
            page: 1, 
            count: 15,
            url: '',
          }, 
          {
            counts: [15, 30],
            getData: function(params) {
              var paramsUrl = params.url();

              var c = $scope.root.config;
              var url = c.requestUrl + '/statement' + c.extension;
              // var url = '/xitang-ticket/src/api' + '/GetCheckStatementList.json';
              // 页面初始化时，添加默认时间段；页面点击时，不添加默认时间段
              if (!flag) { 
                //如果检票时间为空，默认设置为当天查询，如果某个时间为空，补全整个时间段前移或后移
                if(!$('#rd_lptvht').val() && !$('#rd_idwdiz').val()) {
                  var sDate = new Date();
                  sDate.setHours(0);
                  sDate.setMinutes(0);
                  sDate.setSeconds(0)
                  sDate = $filter('date')(sDate.getTime(), 'yyyy-MM-dd  HH:mm:ss');
                  $('#rd_lptvht').val(sDate);
                  $('#check-date-start').val(sDate);
                  var eDate = new Date();
                  eDate.setHours(23);
                  eDate.setMinutes(59);
                  sDate.setSeconds(59)
                  eDate = $filter('date')(eDate.getTime(), 'yyyy-MM-dd HH:mm:ss');
                  $('#rd_idwdiz').val(eDate);
                  $('#check-date-end').val(eDate);

                }
                // 仅开始时间为空时
                else if(!$('#rd_lptvht').val()) {
                  var d = new Date($('#rd_idwdiz').val());
                  d.setHours(0);
                  d.setMinutes(0);
                  d.setSeconds(0)
                  d = $filter('date')(d.getTime(), 'yyyy-MM-dd HH:mm:ss');
                  $('#rd_lptvht').val(d);
                  $('#check-date-start').val(d);
                }
                // 仅结束时间为空时
                else if(!$('#rd_idwdiz').val()) {
                  var d = new Date($('#rd_lptvht').val());
                   d.setHours(23);
                   d.setMinutes(59);
                   d.setSeconds(59)
                  d = $filter('date')(d.getTime(), 'yyyy-MM-dd HH:mm:mm');
                  $('#rd_idwdiz').val(d);
                  $('#check-date-end').val(d);
                }
              } 

      
              //读取成交日期
              self.orderCreateDateStart = $('#rd_qcaxwa').val() ? new Date($('#rd_qcaxwa').val()).getTime() : '';
              self.orderCreateDateEnd = $('#rd_khaydt').val() ? new Date($('#rd_khaydt').val()).getTime() : '';
              // //
              // self.orderCreateDateStart = $('#rd_qcaxwa').val() ? new Date($('#rd_qcaxwa').val() + ' 00:00:00').getTime() : '';
              // self.orderCreateDateEnd = $('#rd_khaydt').val() ? new Date($('#rd_khaydt').val() + ' 23:59:59').getTime() : '';
              
              //读取检票日期
              self.checkDateStart = $('#rd_lptvht').val() ? new Date($('#rd_lptvht').val()).getTime() : '';
              self.checkDateEnd = $('#rd_idwdiz').val() ? new Date($('#rd_idwdiz').val()).getTime() : '';

              var data = {
                "action": "GetCheckStatementList",
                "account": $cookies.get('account'),
                "token": $cookies.get('token'),
                "projectName": $cookies.get('projectName'),
                "sortBy": "OrderID", //成交时间
                "orderBy": "desc", //asc 升序，desc 降序
                "count": paramsUrl.count, //一页显示数量
                "page": paramsUrl.page,   //当前页
                "search": {
                  "goodsName": self.goodsName ? self.goodsName : "",
                  "partnerName": self.partnerName ? self.partnerName : "",
                  "orderCreateDateStart": self.orderCreateDateStart ? self.orderCreateDateStart : "", //成交日期开始
                  "orderCreateDateEnd": self.orderCreateDateEnd ? self.orderCreateDateEnd : "", //成交日期结束
                  "checkDateStart": self.checkDateStart ? self.checkDateStart : "",
                  "checkDateEnd": self.checkDateEnd ? self.checkDateEnd : "",
                  "checkUserName": self.checkUserName ? self.checkUserName : ""
                }
              };

              data = JSON.stringify(data);
              self.loading = true;
              self.noData = false;
              
              return $http.post(url, data).then(function successCallback(response) {
                  self.loading = false;
                  var data = response.data;
                  if(data.rescode === 200) {
                    //查无数据
                    if(data.lists.totalCount === 0) {
                      self.noData = true;
                    }
                    params.total(data.lists.totalCount);
                    self.tableData = data.lists.lists;
                    // self.totalTotalTickets = data.lists.totalTotalTickets;
                    // self.totalCheckedTickets = data.lists.totalCheckedTickets;
                    // self.totalCheckedPrice = data.lists.totalCheckedPrice;
                    return data.lists.lists;
                  }else if(data.rescode === 401){
                    alert('登录超时，请重新登录');
                    $location.path('/index');
                  }else {
                    alert(data.errInfo);
                  }  
                }, function errorCallback(response) {
                  self.loading = false;
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
        $('.form_date').datetimepicker({
            language:  'zh-CN',
            weekStart: 1,
            todayBtn:  1,
            autoclose: 1,
            todayHighlight: 1,
            startView: 2,
            minView: 2,
            forceParse: 0,
            showMeridian: 1
        });
        self.search(false);
        $('#order-create-time-start').val('00:00:00')
        $('#order-create-time-end').val('23:59:59')
        $('#visit-time-start').val('00:00:00')
        $('#visit-time-end').val('23:59:59')
      }
      self.clearOrderStart = function () {
        $('#order-create-time-start').val('00:00:00')
        $('#rd_qcaxwa').val('')
        $('#order-create-date-start').val('')
      }
      self.clearOrderEnd = function () {
        $('#order-create-time-end').val('23:59:59')
        $('#rd_khaydt').val('')
        $('#order-create-date-end').val('')
      }
      self.clearVisitStart = function () {
        $('#visit-time-start').val('00:00:00')
        $('#rd_lptvht').val('')
        $('#visit-date-start').val('')
      }
      self.clearVisitEnd = function () {
        $('#visit-time-end').val('23:59:59')
        $('#rd_idwdiz').val('')
        $('#visit-date-end').val('')
      }
      self.sum = function(data, field){
        var t = 0;
        for (var i = 0; i < data.length; i++) {
          t += parseFloat(data[i][field]);
        }
        return t.toFixed(2);
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

        //如果成交时间为空，默认设置为当天查询，如果某个时间为空，补全当天时间段
        if(!$('#rd_qcaxwa').val() && !$('#rd_khaydt').val()) {          
          var sDate = new Date();
          sDate = $filter('date')(sDate.getTime(), 'yyyy-MM-dd');
          $('#rd_qcaxwa').val(sDate);
          $('#order-create-date-start').val(sDate);
          var eDate = new Date();
          var eDate = $filter('date')(eDate.getTime(), 'yyyy-MM-dd');
          $('#rd_khaydt').val(eDate);
          $('#order-create-date-end').val(eDate);
        }
        // 仅开始时间为空时
        else if(!$('#rd_qcaxwa').val()) {
          $('#rd_qcaxwa').val($('#rd_khaydt').val());
          $('#order-create-date-start').val($('#rd_khaydt').val());
        }
        // 仅结束时间为空时
        else if(!$('#rd_khaydt').val()) {
          $('#rd_khaydt').val($('#rd_qcaxwa').val());
          $('#order-create-date-end').val($('#rd_qcaxwa').val());
        }

        //读取成交日期
        self.orderCreateDateStart = $('#rd_qcaxwa').val() ? new Date($('#rd_qcaxwa').val() + ' ' + $('#order-create-time-start').val()).getTime() : '';
        self.orderCreateDateEnd = $('#rd_khaydt').val() ? new Date($('#rd_khaydt').val() + ' ' + $('#order-create-time-end').val()).getTime() : '';
        
        //读取游玩日期
        self.visitDateStart = $('#rd_lptvht').val() ? new Date($('#rd_lptvht').val() + ' ' + $('#visit-time-start').val()).getTime() : '';
        self.visitDateEnd = $('#rd_idwdiz').val() ? new Date($('#rd_idwdiz').val() + ' ' + $('#visit-time-end').val()).getTime() : '';

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

        data = JSON.stringify(data);

        $http.post(url, data).then(function successCallback(response) {
            var data = response.data;
            if(data.rescode === 200) {
              if (confirm('导出中，导出成功后会在“报表中心－导出列表”中显示，是否前往查看？')) {
                $location.path('/exportStatementsList');
              }
            }else if(data.rescode === 401){
              alert('登录超时，请重新登录');
              $location.path('/index');
            }else {
              alert(data.errInfo);
            }  
          }, function errorCallback(response) {
            alert('导出失败，请重试');
          });
      };

      // ngtable
      self.search = function(flag) {
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

              // 页面初始化时，添加默认时间段；页面点击时，不添加默认时间段
              if (!flag) {
                //如果成交时间为空，默认设置为当天查询，如果某个时间为空，补全当天时间段
                if(!$('#rd_qcaxwa').val() && !$('#rd_khaydt').val()) {
                  
                  var sDate = new Date();          
                  sDate = $filter('date')(sDate.getTime(), 'yyyy-MM-dd');
                  $('#rd_qcaxwa').val(sDate);
                  $('#order-create-date-start').val(sDate);
                  var eDate = new Date();                  
                  var eDate = $filter('date')(eDate.getTime(), 'yyyy-MM-dd');
                  $('#rd_khaydt').val(eDate);
                  $('#order-create-date-end').val(eDate);

                }
                // 仅开始时间为空时
                else if(!$('#rd_qcaxwa').val()) {
                  $('#rd_qcaxwa').val($('#rd_khaydt').val());
                  $('#order-create-date-start').val($('#rd_khaydt').val());
                }
                // 仅结束时间为空时
                else if(!$('#rd_khaydt').val()) {              
                  $('#rd_khaydt').val($('#rd_qcaxwa').val());
                  $('#order-create-date-end').val($('#rd_qcaxwa').val());
                }
              }
              
              //读取成交日期
              self.orderCreateDateStart = $('#rd_qcaxwa').val() ? new Date($('#rd_qcaxwa').val() + ' ' + $('#order-create-time-start').val()).getTime() : '';
              self.orderCreateDateEnd = $('#rd_khaydt').val() ? new Date($('#rd_khaydt').val() + ' ' + $('#order-create-time-end').val()).getTime() : '';
              
              //读取游玩日期
              self.visitDateStart = $('#rd_lptvht').val() ? new Date($('#rd_lptvht').val() + ' ' + $('#visit-time-start').val()).getTime() : '';
              self.visitDateEnd = $('#rd_idwdiz').val() ? new Date($('#rd_idwdiz').val() + ' ' + $('#visit-time-end').val()).getTime() : '';

              var data = {
                "action": "GetOperatingStatement",
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
              self.noData = false;
              
              return $http.post(url, data).then(function successCallback(response) {
                  self.loading = false;
                  var data = response.data;
                  if(data.rescode === 200) {
                    //查无数据
                    if(data.lists.totalCount === 0) {
                      self.noData = true;
                    }
                    params.total(data.lists.totalCount);
                    self.tableData = data.lists.lists;
                    self.totalTotalTickets = data.lists.totalTotalTickets;
                    self.totalCheckedTickets = data.lists.totalCheckedTickets;
                    self.totalReturnedTickets = data.lists.totalReturnedTickets;
                    self.totalWaitingTickets = data.lists.totalWaitingTickets;
                    self.totalCheckedPrice = data.lists.totalCheckedPrice;
                    return data.lists.lists;
                  }else if(data.rescode === 401){
                    alert('登录超时，请重新登录');
                    $location.path('/index');
                  }else {
                    alert(data.errInfo);
                  }  
                }, function errorCallback(response) {
                  self.loading = false;
                  alert('加载失败，请重试');
                });
            }
          }
        );
      };
    }
  ]);
  // 改签报表 
  app.controller('updateVisitStatementController', ['$scope', '$http', '$cookies', '$location', '$window', '$filter', 'NgTableParams', 
    function($scope, $http, $cookies, $location, $window, $filter, NgTableParams) {
      console.log('operatingStatement');
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
          forceParse: 0,
          showMeridian: 1
        });
        $('#order-create-time-start').val('00:00:00')
        $('#order-create-time-end').val('23:59:59')
        self.search(false)
      }
      self.clearOrderStart = function () {
        $('#order-create-time-start').val('00:00:00')
        $('#rd_qcaxwa').val('')
        $('#order-create-date-start').val('')
      }
      self.clearOrderEnd = function () {
        $('#order-create-time-end').val('23:59:59')
        $('#rd_khaydt').val('')
        $('#order-create-date-end').val('')
      }
      self.sum = function(data, field){
        var t = 0;
        for (var i = 0; i < data.length; i++) {
          t += parseFloat(data[i][field]);
        }
        return t.toFixed(2);
      };

      self.isLastPage = function() {
        return self.tableParams.page() === totalPages();
      }

      function totalPages(){
        return Math.ceil(self.tableParams.total() / self.tableParams.count());
      }

      self.export = function() {
        var c = $scope.root.config;
        var url = c.requestUrl + '/orders' + c.extension;

        //如果成交时间为空，默认设置为当天查询，如果某个时间为空，补全整个时间段前移或后移
        if(!$('#rd_qcaxwa').val() && !$('#rd_khaydt').val()) {

          var sDate = new Date();
         
          sDate = $filter('date')(sDate.getTime(), 'yyyy-MM-dd');
          $('#rd_qcaxwa').val(sDate);
          $('#order-create-date-start').val(sDate);

          var eDate = new Date();
         
          var eDate = $filter('date')(eDate.getTime(), 'yyyy-MM-dd');
          $('#rd_khaydt').val(eDate);
          $('#order-create-date-end').val(eDate);

        }
        // 仅开始时间为空时
        else if(!$('#rd_qcaxwa').val()) {
          $('#rd_qcaxwa').val($('#rd_khaydt').val());
          $('#order-create-date-start').val($('#rd_khaydt').val());
        }
        // 仅结束时间为空时
        else if(!$('#rd_khaydt').val()) {
          $('#rd_khaydt').val($('#rd_qcaxwa').val());
          $('#order-create-date-end').val($('#rd_qcaxwa').val());
        }

        self.updateVisitDateStart = $('#rd_qcaxwa').val() ? new Date($('#rd_qcaxwa').val() + ' ' + $('#order-create-time-start').val()).getTime() : '';
        self.updateVisitDateEnd = $('#rd_khaydt').val() ? new Date($('#rd_khaydt').val() + ' ' + $('#order-create-time-end').val()).getTime() : '';
        var data = {
          "action": "ExportUpdateVisitDateStatus",
          "account": $cookies.get('account'),
          "token": $cookies.get('token'),
          "projectName": $cookies.get('projectName'),
          "search": {
            "updateVisitDateStart": self.updateVisitDateStart ? self.updateVisitDateStart : "", //改签时间开始（精确到日期、时、分）
            "updateVisitDateEnd": self.updateVisitDateEnd ? self.updateVisitDateEnd : "",   //改签时间结束（精确到日期、时、分）
            "orderId": self.orderId ? self.orderId : "",            //订单号
            "parterOrderId":self.parterOrderId ? self.parterOrderId : "",       //分销商订单号
            "updater": self.updater ? self.updater : "",           //改签人（姓名）
          }
        };

        data = JSON.stringify(data);

        $http.post(url, data).then(function successCallback(response) {
            var data = response.data;
            if(data.rescode === 200) {
              if (confirm('导出中，导出成功后会在“报表中心－导出列表”中显示，是否前往查看？')) {
                $location.path('/exportStatementsList');
              }
            }else if(data.rescode === 401){
              alert('登录超时，请重新登录');
              $location.path('/index');
            }else {
              alert(data.errInfo);
            }  
          }, function errorCallback(response) {
            alert('导出失败，请重试');
          });
      };

      // ngtable
      self.search = function(flag) {
        self.tableParams = new NgTableParams(
          {
            page: 1, 
            count: 15,
            url: '',
            group: "OTAName"
          }, 
          {
            counts: [15, 30],
            getData: function(params) {
              var paramsUrl = params.url();

              var c = $scope.root.config;
              // var url = c.requestUrl + '/GetUpdateVisitDateStatus' + c.extension;
              var url = c.requestUrl + '/orders' + c.extension;
              // 页面初始化时，添加默认时间段；页面点击时，不添加默认时间段
              if (!flag) { 
                //如果成交时间为空，默认设置为当天查询，如果某个时间为空，补全整个时间段前移或后移
                if(!$('#rd_qcaxwa').val() && !$('#rd_khaydt').val()) {

                  var sDate = new Date();
                 
                  sDate = $filter('date')(sDate.getTime(), 'yyyy-MM-dd');
                  $('#rd_qcaxwa').val(sDate);
                  $('#order-create-date-start').val(sDate);

                  var eDate = new Date();
                  
                  var eDate = $filter('date')(eDate.getTime(), 'yyyy-MM-dd');
                  $('#rd_khaydt').val(eDate);
                  $('#order-create-date-end').val(eDate);

                }
                // 仅开始时间为空时
                else if(!$('#rd_qcaxwa').val()) {

                  $('#rd_qcaxwa').val($('#rd_khaydt').val());
                  $('#order-create-date-start').val($('#rd_khaydt').val());
                }
                // 仅结束时间为空时
                else if(!$('#rd_khaydt').val()) {

                  $('#rd_khaydt').val($('#rd_qcaxwa').val());
                  $('#order-create-date-end').val($('#rd_qcaxwa').val());
                }
              }



              //改签时间
              self.updateVisitDateStart = $('#rd_qcaxwa').val() ? new Date($('#rd_qcaxwa').val() + ' ' + $('#order-create-time-start').val()).getTime() : '';
              self.updateVisitDateEnd = $('#rd_khaydt').val() ? new Date($('#rd_khaydt').val() + ' ' + $('#order-create-time-end').val()).getTime() : '';


              var data = {
                "action": "GetUpdateVisitDateStatus",
                "account": $cookies.get('account'),
                "token": $cookies.get('token'),
                "projectName": $cookies.get('projectName'),
                "sortBy": "OU_UpdateTime", //成交时间
                "orderBy": "asc", //asc 升序，desc 降序
                "count": paramsUrl.count, //一页显示数量
                "page": paramsUrl.page,   //当前页
                "search": {
                  "updateVisitDateStart": self.updateVisitDateStart ? self.updateVisitDateStart : "", //改签时间开始（精确到日期、时、分）
                  "updateVisitDateEnd": self.updateVisitDateEnd ? self.updateVisitDateEnd : "",   //改签时间结束（精确到日期、时、分）
                  "orderId": self.orderId ? self.orderId : "",            //订单号
                  "parterOrderId":self.parterOrderId ? self.parterOrderId : "",       //分销商订单号
                  "updater": self.updater ? self.updater : "",           //改签人（姓名）
                }
              };

              data = JSON.stringify(data);
              self.loading = true;
              self.noData = false;
              
              return $http.post(url, data).then(function successCallback(response) {
                  self.loading = false;
                  var data = response.data;                  
                  if(data.rescode === 200) {
                    //查无数据
                    if(data.orders.totalCount === 0) {
                      self.noData = true;
                    }
                    self.totalTotalTicketCount = self.sum(data.orders.lists,"TicketCount");
                    params.total(data.orders.totalCount);
                    // self.tableData = data.lists.lists;
                    // self.totalTotalTickets = data.lists.totalTotalTickets;
                    // self.totalCheckedTickets = data.lists.totalCheckedTickets;
                    // self.totalReturnedTickets = data.lists.totalReturnedTickets;
                    // self.totalWaitingTickets = data.lists.totalWaitingTickets;
                    // self.totalCheckedPrice = data.lists.totalCheckedPrice;
                    return data.orders.lists;
                  }else if(data.rescode === 401){
                    alert('登录超时，请重新登录');
                    $location.path('/index');
                  }else {
                    alert(data.errInfo);
                  }  
                }, function errorCallback(response) {
                  self.loading = false;
                  alert('加载失败，请重试');
                });
            }
          }
        );
      };
    }
  ]);
   // 游客信息(身份证) 包括搜索 导出 两部分
  app.controller('exportBookerDetailStatementController', ['$scope', '$http', '$cookies', '$location', '$window', '$filter', 'NgTableParams', 
    function($scope, $http, $cookies, $location, $window, $filter, NgTableParams) {
      console.log('exportBookerDetailStatement');
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
          forceParse: 0,
          showMeridian: 1
        });
        $('#order-create-time-start').val('00:00:00')
        $('#order-create-time-end').val('23:59:59')
        $('#visit-time-start').val('00:00:00')
        $('#visit-time-end').val('23:59:59')
        self.search(false);
      }
      self.clearOrderStart = function () {
        $('#order-create-time-start').val('00:00:00')
        $('#rd_qcaxwa').val('')
        $('#order-create-date-start').val('')
      }
      self.clearOrderEnd = function () {
        $('#order-create-time-end').val('23:59:59')
        $('#rd_khaydt').val('')
        $('#order-create-date-end').val('')
      }
      self.clearVisitStart = function () {
        $('#visit-time-start').val('00:00:00')
        $('#rd_lptvht').val('')
        $('#visit-date-start').val('')
      }
      self.clearVisitEnd = function () {
        $('#visit-time-end').val('23:59:59')
        $('#rd_idwdiz').val('')
        $('#visit-date-end').val('')
      }
      self.sum = function(data, field){
        var t = 0;
        for (var i = 0; i < data.length; i++) {
          t += parseFloat(data[i][field]);
        }
        return t.toFixed(2);
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
        // 如果成交时间为空，默认设置为当天查询，
        if(!$('#rd_qcaxwa').val() && !$('#rd_khaydt').val()) {
          var sDate = new Date();          
          sDate = $filter('date')(sDate.getTime(), 'yyyy-MM-dd');
          $('#rd_qcaxwa').val(sDate);
          $('#check-date-start').val(sDate);

          var eDate = new Date();         
          var eDate = $filter('date')(new Date().getTime(), 'yyyy-MM-dd');
          $('#rd_khaydt').val(eDate);
          $('#check-date-end').val(eDate);
        }
        // 仅开始时间为空时
        else if(!$('#rd_qcaxwa').val()) {
          $('#rd_qcaxwa').val($('#rd_khaydt').val());
          $('#check-date-start').val($('#rd_khaydt').val());
        }
        // 仅结束时间为空时
        else if(!$('#rd_khaydt').val()) {
          $('#rd_khaydt').val($('#rd_qcaxwa').val());
          $('#check-date-end').val($('#rd_qcaxwa').val());
        }

        //读取成交日期
        self.orderCreateDateStart = $('#rd_qcaxwa').val() ? new Date($('#rd_qcaxwa').val() + ' ' + $('#order-create-time-start').val()).getTime() : '';
        self.orderCreateDateEnd = $('#rd_khaydt').val() ? new Date($('#rd_khaydt').val() + ' ' + $('#order-create-time-end').val()).getTime() : '';
        
        //读取游玩日期
        self.visitDateStart = $('#rd_lptvht').val() ? new Date($('#rd_lptvht').val() + ' ' + $('#visit-time-start').val()).getTime() : '';
        self.visitDateEnd = $('#rd_idwdiz').val() ? new Date($('#rd_idwdiz').val() + ' ' + $('#visit-time-end').val()).getTime() : '';

        var data = {
          "action": "ExportBookerDetailStatement",
          "account": $cookies.get('account'),
          "token": $cookies.get('token'),
          "projectName": $cookies.get('projectName'),
          "exportPerson": $cookies.get('userName'),
          "search": {
           "orderCreateDateStart": self.orderCreateDateStart ? self.orderCreateDateStart : "", //成交时间开始   年月日，时分
           "orderCreateDateEnd": self.orderCreateDateEnd ? self.orderCreateDateEnd : "", //成交时间结束   年月日，时分
           "visitDateStart": self.visitDateStart ? self.visitDateStart : "", //游玩时间开始   年月日，时分
           "visitDateEnd": self.visitDateEnd ? self.visitDateEnd : "",   //游玩时间开始   年月日，时分
           "bookerLocation":self.bookerLocation ? self.bookerLocation : "", 
           "sex":self.sex ? self.sex : "",    //男：male；女:female
           "age":self.age ? self.age : "", 
          }
        };

        data = JSON.stringify(data);

        $http.post(url, data).then(function successCallback(response) {
            var data = response.data;
            if(data.rescode === 200) {
              if (confirm('导出中，导出成功后会在“报表中心－导出列表”中显示，是否前往查看？')) {
                $location.path('/exportStatementsList');
              }
            }else if(data.rescode === 401){
              alert('登录超时，请重新登录');
              $location.path('/index');
            }else {
              alert(data.errInfo);
            }  
          }, function errorCallback(response) {
            alert('导出失败，请重试');
          });
      };

      // ngtable
      // 游客信息（身份证） 获取
      self.search = function(flag) {
        self.tableParams = new NgTableParams(
          {
            page: 1, 
            count: 15,
            url: '',
            group: "bookerLocation"
          }, 
          {
            counts: [15, 30],
            getData: function(params) {
              var paramsUrl = params.url();

              var c = $scope.root.config;
              var url = c.requestUrl + '/statement' + c.extension;
              // var url = c.requestUrl + '/GetBookerDetailStatement' + c.extension;

              // 页面初始化时，添加默认时间段；页面点击时，不添加默认时间段
              if (!flag) {
                  // 如果成交时间为空，默认设置为当天查询，
                  if (!$('#rd_qcaxwa').val() && !$('#rd_khaydt').val()) {
                      var sDate = new Date();            
                      sDate = $filter('date')(sDate.getTime(), 'yyyy-MM-dd');
                      $('#rd_qcaxwa').val(sDate);
                      $('#check-date-start').val(sDate);
                      var eDate = new Date();                     
                      var eDate = $filter('date')(new Date().getTime(), 'yyyy-MM-dd');
                      $('#rd_khaydt').val(eDate);
                      $('#check-date-end').val(eDate);
                  }
                  // 仅开始时间为空时
                  else if (!$('#rd_qcaxwa').val()) {
                      $('#rd_qcaxwa').val($('#rd_khaydt').val());
                      $('#check-date-start').val($('#rd_khaydt').val());
                  }
                  // 仅结束时间为空时
                  else if (!$('#rd_khaydt').val()) {
                      $('#rd_khaydt').val($('#rd_qcaxwa').val());
                      $('#check-date-end').val($('#rd_qcaxwa').val());
                  }
              }



              //读取成交日期
              self.orderCreateDateStart = $('#rd_qcaxwa').val() ? new Date($('#rd_qcaxwa').val() + ' ' + $('#order-create-time-start').val()).getTime() : '';
              self.orderCreateDateEnd = $('#rd_khaydt').val() ? new Date($('#rd_khaydt').val() + ' ' + $('#order-create-time-end').val()).getTime() : '';

              //读取游玩日期
              self.visitDateStart = $('#rd_lptvht').val() ? new Date($('#rd_lptvht').val() + ' ' + $('#visit-time-start').val()).getTime() : '';
              self.visitDateEnd = $('#rd_idwdiz').val() ? new Date($('#rd_idwdiz').val() + ' ' + $('#visit-time-end').val()).getTime() : '';

              var data = {
                "action": "GetBookerDetailStatement",
                "account": $cookies.get('account'),
                "token": $cookies.get('token'),
                "projectName": $cookies.get('projectName'),
                "count": paramsUrl.count, //一页显示数量
                "page": paramsUrl.page,   //当前页
                "search": {
                  "orderCreateDateStart": self.orderCreateDateStart ? self.orderCreateDateStart : "", //成交时间开始   年月日，时分
                  "orderCreateDateEnd": self.orderCreateDateEnd ? self.orderCreateDateEnd : "", //成交时间结束   年月日，时分
                  "visitDateStart": self.visitDateStart ? self.visitDateStart : "", //游玩时间开始   年月日，时分
                  "visitDateEnd": self.visitDateEnd ? self.visitDateEnd : "",   //游玩时间开始   年月日，时分
                  "bookerLocation":self.bookerLocation ? self.bookerLocation : "", 
                  "sex":self.sex ? self.sex : "",    //男：male；女:female
                  "age":self.age ? self.age : "", 
                }
              };
              data = JSON.stringify(data);
              self.loading = true;
              self.noData = false;
              
              return $http.post(url, data).then(function successCallback(response) {
                  self.loading = false;
                  var data = response.data;
                  if(data.rescode === 200) {
                    //查无数据
                    if(data.lists.totalCount === 0) {
                      self.noData = true;
                    }
                    params.total(data.lists.totalCount);
                    self.totalTotalTickets = self.sum(data.lists.lists,"totalTickets");
                    return data.lists.lists;
                  }else if(data.rescode === 401){
                    alert('登录超时，请重新登录');
                    $location.path('/index');
                  }else {
                    alert(data.errInfo);
                  }  
                }, function errorCallback(response) {
                  self.loading = false;
                  alert('加载失败，请重试');
                });
            }
          }
        );
      };
    }
  ]);
  
  app.controller('orderDetailController', ['$scope', '$state', '$stateParams', '$http', '$cookies', '$location', '$filter', '$window', 'auth', 
    function($scope, $state, $stateParams, $http, $cookies, $location, $filter, $window, auth ) {
      console.log('orderDetail');
      var self = this;
      // 初始化 隐藏 保存 按钮
      self.showSave = false;

      self.id = $scope.root.coverParamId;

      self.close = function() {
        $scope.root.coverUrl = '';
        $scope.root.coverParamId = '';
      };

      self.formatOrderTicketCode = function(str) {
        return str && str.split(',').join(', ');
      }
      self.formatCheckTime = function (time) {
        return $filter('date')(time, 'yyyy-MM-dd HH:mm:ss');
      }

      // 保存按钮，不可重复点击
      self.submitting = false;
      self.saveTxt = '保存';
      self.updateVisitDate=function(){

        $('#visitTimeHidden').datetimepicker('show').on('changeDate', function(ev){
            $scope.$apply(function(){
              self.orders.visitDateStart = $('#updateDate').val();
              self.orders.visitDateEnd = $('#updateDate').val();
              self.visitDate = $('#updateDate').val();
              self.showSave = true;
            } 
            );
        });
      }
      // get data
      var c = $scope.root.config;
      // var url = c.requestUrl + '/ordersDetail' + c.extension;
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
            alert('登录超时，请重新登录');
            $location.path('/index');
          }else {
            alert(data.errInfo);
          }  
        }, function errorCallback(response) {
          alert('读取信息失败');
        });
      // 超级管理员 权限问题
      self.auth = function(authName) { return auth($cookies.get('roleId'), authName) };
      self.init = function() {
        self.userName = $cookies.get('userName');
        $scope.$state = 'admin'; 
       
        $('.form_date').datetimepicker({
          format: 'yyyy-mm-dd',
          language:  'zh-CN',
          weekStart: 1,
          todayBtn:  1,
          autoclose: true,
          todayHighlight: 1,
          startView: 2,
          minView: 'month',
          maxView: 'month'
        })
      };
      // 保存按钮
      self.updateDate = function(){
        self.submitting = true;
        self.saveTxt = '保存中';
        // get data
        var c = $scope.root.config;
        // var url = c.requestUrl + '/updateVisitDate' + c.extension;
        var url = c.requestUrl + '/orders' + c.extension;

        var data = {
          "action": "UpdateVisitDate",
          "account": $cookies.get('account'),
          "token": $cookies.get('token'),
          "projectName": $cookies.get('projectName'),
          "order": {
                "orderId": self.orders.orderId,
                "visitDate": self.visitDate ? $filter('emptySec')(new Date(self.visitDate)).getTime() : ''
                
        }
        };
        data = JSON.stringify(data);
        $http.post(url, data).then(function successCallback(response) {
            var data = response.data;
            if(data.rescode === 200) {
              self.showSave = false;
              $window.location.reload();
              // $state.reload();
            
              alert('改签成功');
              self.submitting = false;
              self.saveTxt = '保存';
            }else if(data.rescode === 401){
              alert('登录超时，请重新登录');
              $location.path('/index');
            }else {
              alert(data.errInfo);
            }  
          }, function errorCallback(response) {
            alert('改签失败');
          }); 
      }       
      }
    
  ]);

  // 退已检票
  app.controller('orderCheckedRefundController', ['$scope', '$state', '$http', '$cookies', '$location', '$filter', '$window',
    function($scope, $state, $http, $cookies, $location, $filter, $window) {
      console.log('orderCheckedRefund');
      var self = this;
      // 初始化 隐藏 保存 按钮
      self.showSave = false;

      self.close = function() {
        $scope.root.coverUrl = '';
        $scope.root.coverParams = null;
      };

      self.alterSubmitTxt = function(boo) {
        self.submitting = boo;
        self.saveTxt = boo ? '退票中' : '退票';
      }

      self.init = function() {
        self.id = $scope.root.coverParams.orderId;
        self.checkedNum = $scope.root.coverParams.checkedNum;
        self.alterSubmitTxt(false)
      };
      // 保存按钮
      self.refund = function(){
        self.alterSubmitTxt(true)

        // refund tickets
        var c = $scope.root.config;
        var url = c.requestUrl + '/orders' + c.extension;

        var data = {
          "action": "UpdateCheckedNumber",
          "token": $cookies.get('token'),
          "projectName": $cookies.get('projectName'),
          "data": {
            "OrderID": self.id,
            "Ammount": self.refundNum   
          }
        };
        data = JSON.stringify(data);
        $http.post(url, data).then(function successCallback(response) {
            var data = response.data;
            if(data.rescode === 200) {
              self.alterSubmitTxt(false)
              alert('退票成功');
              self.close()
              $scope.root.refreshList()
            }else if(data.rescode === 401){
              alert('登录超时，请重新登录');
              $location.path('/index');
            }else {
              self.alterSubmitTxt(false)
              alert(data.errInfo);
            }
        }, function errorCallback(response) {
            alert('退票失败');
            self.alterSubmitTxt(false)
        });
      }      
    }
  ]);

  // 游客信息
  app.controller('personDetailController', ['$scope', '$state', '$stateParams', '$http', '$cookies', '$location', '$filter', 'auth', 
    function($scope, $state, $stateParams, $http, $cookies, $location, $filter, auth) {
      console.log('orderDetail');
      var self = this;
      // 初始化 隐藏 保存 按钮
      self.showSave = false;

      self.id = $scope.root.coverParamId;

      self.close = function() {
        $scope.root.coverUrl = '';
        $scope.root.coverParamId = '';


      };
      // 保存按钮，不可重复点击
      self.submitting = false;
      self.saveTxt = '保存';
      self.updateVisitDate=function(){ 
            
        $('#visitTimeHidden').datetimepicker('show').on('changeDate', function(ev){
            $scope.$apply(function(){
              self.orders.visitDateStart = $('#updateDate').val();
              self.orders.visitDateEnd = $('#updateDate').val();
              self.visitDate = $('#updateDate').val();
              self.showSave = true;
            } 
            );
        });
      }
      // get data
      var c = $scope.root.config;
      // var url = c.requestUrl + '/ordersDetail' + c.extension;
      var url = c.requestUrl + '/orders' + c.extension;

      var data = {
        "action": "GetOrderUserList",
        "account": $cookies.get('account'),
        "token": $cookies.get('token'),
        "projectName": $cookies.get('projectName'),
        "orderId": self.id + "" 
      };
      data = JSON.stringify(data);

      $http.post(url, data).then(function successCallback(response) {
          var data = response.data;
          
          if(data.rescode === 200) {
            self.users = data.users;
             
          }else if(data.rescode === 401){
            alert('登录超时，请重新登录');
            $location.path('/index');
          }else {
            alert(data.errInfo);
          }  
        }, function errorCallback(response) {
          alert('读取信息失败');
        });
      // 超级管理员 权限问题
      self.auth = function(authName) { return auth($cookies.get('roleId'), authName) };
      self.init = function() {
        self.userName = $cookies.get('userName');
        $scope.$state = 'admin'; 
       
        $('.form_date').datetimepicker({
          format: 'yyyy-mm-dd',
          language:  'zh-CN',
          weekStart: 1,
          todayBtn:  1,
          autoclose: true,
          todayHighlight: 1,
          startView: 2,
          minView: 'month',
          maxView: 'month'
        })
      };
      // 保存按钮
      self.updateDate = function(){
        self.submitting = true;
        self.saveTxt = '保存中';
        // get data
        var c = $scope.root.config;
        // var url = c.requestUrl + '/updateVisitDate' + c.extension;
        var url = c.requestUrl + '/orders' + c.extension;

        var data = {
          "action": "UpdateVisitDate",
          "account": $cookies.get('account'),
          "token": $cookies.get('token'),
          "projectName": $cookies.get('projectName'),
          "order": {
                "orderId": self.orders.orderId,
                "visitDate": self.visitDate ? $filter('emptySec')(new Date(self.visitDate)).getTime() : ''
                
        }
        };
        data = JSON.stringify(data);
        $http.post(url, data).then(function successCallback(response) {
            var data = response.data;
            if(data.rescode === 200) {
              self.showSave = false;
              
              alert('改签成功');
              self.submitting = false;
              self.saveTxt = '保存';
            }else if(data.rescode === 401){
              alert('登录超时，请重新登录');
              $location.path('/index');
            }else {
              alert(data.errInfo);
            }  
          }, function errorCallback(response) {
            alert('改签失败');
          }); 
      }       
      }
    
  ]);

  //检票信息
  app.controller('checkDetailController', ['$scope', '$state', '$stateParams', '$http', '$cookies', '$location', '$filter', 'auth',
        function($scope, $state, $stateParams, $http, $cookies, $location, $filter, auth) {
            console.log('checkDetail');
            var self = this;
            self.id = $scope.root.coverParamId;
            self.close = function() {
                $scope.root.coverUrl = '';
                $scope.root.coverParamId = '';
            };
            // 保存按钮，不可重复点击
            self.submitting = false;
            self.saveTxt = '保存';
            self.updateVisitDate=function(){
                $('#visitTimeHidden').datetimepicker('show').on('changeDate', function(ev){
                    $scope.$apply(function(){
                            self.orders.visitDateStart = $('#updateDate').val();
                            self.orders.visitDateEnd = $('#updateDate').val();
                            self.visitDate = $('#updateDate').val();
                            self.showSave = true;
                        }
                    );
                });
            }
            // get data
            var c = $scope.root.config;
            // var url = c.requestUrl + '/ordersDetail' + c.extension;
            var url = c.requestUrl + '/orders' + c.extension;

            var data = {
                "action": "GetOrderCheckDetailInfo",
                "token": $cookies.get('token'),
                "projectName": $cookies.get('projectName'),
                "orderId": self.id + ""
            };
            data = JSON.stringify(data);

            $http.post(url, data).then(function successCallback(response) {
                var data = response.data;

                if(data.rescode === 200) {
                    self.users = data.orderCheckInfo;

                }else if(data.rescode === 401){
                    alert('登录超时，请重新登录');
                    $location.path('/index');
                }else {
                    alert(data.errInfo);
                }
            }, function errorCallback(response) {
                alert('读取信息失败');
            });
            // 超级管理员 权限问题
            self.auth = function(authName) { return auth($cookies.get('roleId'), authName) };
            self.init = function() {
                self.userName = $cookies.get('userName');
                $scope.$state = 'admin';
            };
        }

    ]);

  app.controller('ordersListController', ['$filter', '$scope', '$http', '$cookies', '$location', '$window', 'NgTableParams', 'auth',
    function($filter, $scope, $http, $cookies, $location, $window, NgTableParams, auth) {
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
          forceParse: 0,
          showMeridian: 1
        });
        $('#check-time-start').val('00:00:00')
        $('#check-time-end').val('23:59:59')
        self.search(false);
      }
      // 自制清空按钮
      self.clearCheckStart = function () {
        $('#check-time-start').val('00:00:00')
        $('#rd_zpqvrt').val('')
        $('#check-date-start').val('')
      }
      self.clearCheckEnd = function () {
        $('#check-time-end').val('23:59:59')
        $('#rd_fiekwn').val('')
        $('#check-date-end').val('')
      }

      self.export = function() {
        var c = $scope.root.config;
        var url = c.requestUrl + '/orders' + c.extension;

        // 如果成交时间为空，默认设置三天查询，如果某个时间为空，补全整个时间段前移或后移三天
        if(!$('#rd_qcaxwa').val() && !$('#rd_khaydt').val()) {
          var sDate = new Date();
          sDate.setDate(sDate.getDate() - 3);
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
          d.setDate(d.getDate() - 3);
          d = $filter('date')(d.getTime(), 'yyyy-MM-dd');
          $('#rd_qcaxwa').val(d);
          $('#order-create-date-start').val(d);
        }
        // 仅结束时间为空时
        else if(!$('#rd_khaydt').val()){
          var d = new Date($('#rd_qcaxwa').val());
          d.setDate(d.getDate() + 3);
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
            "orderTicketCode": self.orderTicketCode ? self.orderTicketCode : "",
            "bookerIDType": self.bookerIDType ? self.bookerIDType : "",      //  ID_CARD是身份证
            "bookerID": self.bookerID ? self.bookerID : "",  //身份证号
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
              if (confirm('导出中，导出成功后会在“报表中心－导出列表”中显示，是否前往查看？')) {
                $location.path('/exportStatementsList');
              }
            }else if(data.rescode === 401){
              alert('登录超时，请重新登录');
              $location.path('/index');
            }else {
              alert(data.errInfo);
            }  
          }, function errorCallback(response) {
            alert('导出失败，请重试');
          });
      }
      
      // 超级管理员 权限问题
      self.auth = function(authName) { return auth($cookies.get('roleId'), authName) };

      // ngtable
      // reload值为true时，记住当前page
      self.search = function(flag, reload) {
        var page = 1
        if (reload && self.tableParams) {
          page = self.tableParams.page()
        }
        self.tableParams = new NgTableParams(
          {
            page: page, 
            count: 15,
            url: ''
          }, 
          {
            counts: [15, 30],
            getData: function(params) {
              var paramsUrl = params.url();
              var c = $scope.root.config;
              var url = c.requestUrl + '/orders' + c.extension;
              // 页面初始化时，添加默认时间段；页面点击时，不添加默认时间段
              if (!flag) { 
                // 如果成交时间为空，默认设置三天查询，如果某个时间为空，补全整个时间段前移或后移三天
                if(!$('#rd_qcaxwa').val() && !$('#rd_khaydt').val()) {
                  var sDate = new Date();
                  sDate.setDate(sDate.getDate() - 3);
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
                  d.setDate(d.getDate() - 3);
                  d = $filter('date')(d.getTime(), 'yyyy-MM-dd');
                  $('#rd_qcaxwa').val(d);
                  $('#order-create-date-start').val(d);
                }
                // 仅结束时间为空时
                else if(!$('#rd_khaydt').val()){
                  var d = new Date($('#rd_qcaxwa').val());
                  d.setDate(d.getDate() + 3);
                  d = $filter('date')(d.getTime(), 'yyyy-MM-dd');
                  $('#rd_khaydt').val(d);
                  $('#order-create-date-end').val(d);
                }

              }
              //读取成交日期
              self.orderCreateDateStart = $('#rd_qcaxwa').val() ? new Date($('#rd_qcaxwa').val() + ' 00:00:00').getTime() : '';
              self.orderCreateDateEnd = $('#rd_khaydt').val() ? new Date($('#rd_khaydt').val() + ' 23:59:59').getTime() : '';
              
              //读取游玩日期
              self.visitDateStart = $('#rd_lptvht').val() ? new Date($('#rd_lptvht').val() + ' 00:00:00').getTime() : '';
              self.visitDateEnd = $('#rd_idwdiz').val() ? new Date($('#rd_idwdiz').val() + ' 23:59:59').getTime() : '';

              // 检票时间
              self.checkDateStart = $('#rd_zpqvrt').val() ? new Date($('#rd_zpqvrt').val() + ' ' + $('#check-time-start').val()).getTime() : '';
              self.checkDateEnd = $('#rd_fiekwn').val() ? new Date($('#rd_fiekwn').val() + ' ' + $('#check-time-end').val()).getTime() : '';
              
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
                  "orderTicketCode": self.orderTicketCode ? self.orderTicketCode : "",
                  "bookerIDType": self.bookerIDType ? self.bookerIDType : "",      //  ID_CARD是身份证
                  "bookerID": self.bookerID ? self.bookerID : "",  //身份证号
                  "goodsName": self.goodsName ? self.goodsName : "",
                  "checkStatus": self.checkStatus ? self.checkStatus : "all", //checked：已检票，checking：检票中，waiting：待检票
                  "partnerName": self.partnerName ? self.partnerName : "",
                  "orderCreateDateStart": self.orderCreateDateStart ? self.orderCreateDateStart+"" : "", //成交日期开始
                  "orderCreateDateEnd": self.orderCreateDateEnd ? self.orderCreateDateEnd+"" : "", //成交日期结束
                  "visitDateStart": self.visitDateStart ? self.visitDateStart : "",
                  "visitDateEnd": self.visitDateEnd ? self.visitDateEnd : "",
                  "checkDateStart": self.checkDateStart ? self.checkDateStart : "", //检票时间开始   年月日，时分
                  "checkDateEnd": self.checkDateEnd ? self.checkDateEnd : "",    //检票时间开始   年月日，时分
                  "isExpired": self.isExpired ? self.isExpired : "all"
                }
              };
              data = JSON.stringify(data);
              self.loading = true;
              self.noData = false;
              
              return $http.post(url, data).then(function successCallback(response) {
                  self.loading = false;
                  var data = response.data;
                  if(data.rescode === 200) {
                    // 查无数据
                    if(data.orders.totalCount === 0) {
                      self.noData = true;
                    }
                    params.total(data.orders.totalCount);
                    self.tableData = data.orders.lists;
                    return data.orders.lists;
                  }else if(data.rescode === 401){
                    alert('登录超时，请重新登录');
                    $location.path('/index');
                  }else {
                    alert(data.errInfo);
                  }  
                }, function errorCallback(response) {
                  self.loading = false;
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
      // 游客信息
      self.showPersonDetail = function(orderId) {
        $scope.root.coverUrl = 'pages/personDetail.html';
        $scope.root.coverParamId = orderId;
      }
      // 退已检票
      self.refundChecked = function(orderId, checkedNum) {
        $scope.root.coverUrl = 'pages/orderCheckedRefund.html';
        $scope.root.coverParams = {orderId: orderId, checkedNum: checkedNum};
        $scope.root.refreshList = function () {
          self.search(true, true);
          $scope.root.refreshList = null;
        }
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
              alert('登录超时，请重新登录');
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
              alert('登录超时，请重新登录');
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
              alert('登录超时，请重新登录');
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
      self.goods = {};
      self.goods.offlinePay = '0';

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
    // self.sex = [
    //  {"key":"是"},
    //  {}
    // ]
    // 
    self.setSubmit(false);

    this.submit = function() {

      // 有效时间 必填
      if ($('#rd_dmukgs').val() === "" || $('#rd_qcaxwa').val() === "") {
        alert('请输入有效时间');
        return;
      }
      // 客户要求，去掉检票时间的必填要求
      // 检票时间 必填
      // if($('#checkTimeEnd').val() == '' || $('#checkTimeStart').val() == '') {
      //   alert('请输入检票开始时间和结束时间');
      //   return;
      // }

      // 成本价默认0.00
      if(!this.goods.cost) {
        this.goods.cost = 0.00;
      }

      var c = $scope.root.config;
      var url = c.requestUrl + '/goods' + c.extension;
      this.goods.status = 'on';

      this.goods.validDateStart = '915120000000';
      this.goods.validDateEnd = '2082729600000';
      this.goods.offlinePay = Number(this.goods.offlinePay);
      this.goods.checkTimeStart = $('#checkTimeStart').val() ? $('#checkTimeStart').val() : '00:00';
      this.goods.checkTimeEnd = $('#checkTimeEnd').val() ? $('#checkTimeEnd').val() : '23:59';
      
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
            alert('登录超时，请重新登录');
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

              // 检票时间设置
              $('#checkTimeEnd').val(data.goods.checkTimeEnd);
              $('#checkTimeStart').val(data.goods.checkTimeStart);

            }else if(data.rescode === 401){
              alert('登录超时，请重新登录');
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
        //    客户要求，去掉检票时间的必填
        // // 检票时间 必填
        // if($('#checkTimeStart').val() == '' || $('#checkTimeEnd').val() == '') {
        //   alert('请输入检票开始时间和结束时间');
        //   return;
        // }

        // 成本价默认0.00
        if(!this.goods.cost) {
          this.goods.cost = 0.00;
        }

        var c = $scope.root.config;
        var url = c.requestUrl + '/goods' + c.extension;
        this.goods.validDateStart = '915120000000';
        this.goods.validDateEnd = '2082729600000';

        this.goods.checkTimeStart = $('#checkTimeStart').val() ? $('#checkTimeStart').val() : '00:00';
        this.goods.checkTimeEnd = $('#checkTimeEnd').val() ? $('#checkTimeEnd').val() : '23:59';

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
              alert('登录超时，请重新登录');
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
              alert('登录超时，请重新登录');
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
              alert('登录超时，请重新登录');
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
              self.noData = false;
              
              return $http.post(url, data).then(function successCallback(response) {
                  var data = response.data;
                  self.loading = false;
                  if(data.rescode === 200) {
                    self.checkboxes = { 'checked': false, items: {} };
                    
                    //查无数据
                    if(data.goods.totalCount === 0) {
                      self.noData = true;
                    }

                    params.total(data.goods.totalCount);
                    self.tableData = data.goods.lists;
                    return data.goods.lists;
                  }else if(data.rescode === 401){
                    alert('登录超时，请重新登录');
                    $location.path('/index');
                  }else {
                    alert(data.errInfo);
                  }  
                }, function errorCallback(response) {
                  self.loading = false;
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
              alert('登录超时，请重新登录');
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
              alert('登录超时，请重新登录');
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
              self.noData = false;
              
              return $http.post(url, data).then(function successCallback(response) {
                  self.loading = false;
                  var data = response.data;
                  if(data.rescode === 200) {
                    self.checkboxes = { 'checked': false, items: {} };
                    
                    //查无数据
                    if(data.sale.totalCount === 0) {
                      self.noData = true;
                    }
                    params.total(data.sale.totalCount);
                    self.tableData = data.sale.lists;
                    return data.sale.lists;
                  }else if(data.rescode === 401){
                    alert('登录超时，请重新登录');
                    $location.path('/index');
                  }else {
                    alert(data.errInfo);
                  }  
                }, function errorCallback(response) {
                  self.loading = false;
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

      self.resetPW = function(OTACode) {
        if (!confirm('确认重置密码？')) {
          return
        }
        var c = $scope.root.config;
        var url = c.requestUrl + '/partners' + c.extension;
        var data = {
          "action": "ResetAdminPassword",
          "token": $cookies.get('token'),
          "projectName": $cookies.get('projectName'),
          "data": {
            OTACode: OTACode
          }
        };
        data = JSON.stringify(data);
        
        $http.post(url, data).then(function successCallback(response) {
            var data = response.data;
            if(data.rescode === 200) {
              alert('密码重置成功！新密码为：123456');
            }else if(data.rescode === 401){
              alert('登录超时，请重新登录');
              $location.path('/index');
            }else {
              alert(data.errInfo);
            }  
          }, function errorCallback(response) {
            alert('重置失败，请重试');
          });
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
        
        $http.post(url, data).then(function successCallback(response) {
            var data = response.data;
            if(data.rescode === 200) {
              alert('启用／禁用 设置成功！');
              $window.location.reload();
            }else if(data.rescode === 401){
              alert('登录超时，请重新登录');
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
              self.noData = false;
              
              return $http.post(url, data).then(function successCallback(response) {
                  self.loading = false;
                  var data = response.data;
                  if(data.rescode === 200) {
                    //查无数据
                    if(data.partners.totalCount === 0) {
                      self.noData = true;
                    }
                    params.total(data.partners.totalCount);
                    return data.partners.lists;
                  }else if(data.rescode === 401){
                    alert('登录超时，请重新登录');
                    $location.path('/index');
                  }else {
                    alert(data.errInfo);
                  }  
                }, function errorCallback(response) {
                  self.loading = false;
                  alert('加载失败，请重试');
                });
            }
          }
        );
      }
    }
  ]);

  app.controller('partnerAddController', ['$scope', '$location', '$cookies', '$http', function($scope, $location, $cookies, $http) {
    console.log('partnerAdd');
    var self = this;

    this.init = function() {
      self.Status = 'off';
      self.OrderType = '2'
      self.PrePayment = '0'
      self.PaymentAmount = 0;
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
      // 判断是否要填预付款
      if (this.PrePayment - 0 === 1) {
        console.log(this.PaymentAmount)
        if (!this.PaymentAmount) {
          alert('请填写预付款额')
          return
        }
      }

      // 分销商Code格式, 只允许连续的字符串（字母+数字）
      var re = /^[A-Za-z0-9]+$/;
      var result = re.test(this.OTACode);
      if (!result) {
        alert('分销商Code只支持字母和数字')
        return
      }

      var data = {
        "action": "AddOTA",
        "token": $cookies.get('token'),
        "projectName": $cookies.get('projectName'),
        "data": {
          "OTACode": this.OTACode,
          "OTAName": this.OTAName,
          "Status": this.Status,
          "OrderType": this.OrderType - 0,
          "PrePayment": this.PrePayment - 0,
          "PaymentAmount": (this.PaymentAmount - 0) * 100,
          "PaymentLimit": this.PaymentLimit
        }
      };
      data = JSON.stringify(data);
      self.setSubmit(true);

      var c = $scope.root.config;
      var url = c.requestUrl + '/partners' + c.extension;

      $http.post(url, data).then(function successCallback(response) {
          var data = response.data;
          if(data.rescode === 200) {
            $location.path('/partnerConfig');
          }else if(data.rescode === 401){
            alert('登录超时，请重新登录');
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

  app.controller('partnerBalanceEditController', ['$scope', '$state', '$stateParams', '$http', '$cookies', '$location', '$filter', 
    function($scope, $state, $stateParams, $http, $cookies, $location, $filter) {
      console.log('partnerBalanceEdit')
      var self = this
      self.init = function () {
        self.id = $stateParams.id;
        self.addOrMinus = 'add'
        self.setSubmit(false);
        // get data
        var c = $scope.root.config;
        var url = c.requestUrl + '/partners' + c.extension;
        var data = {
          "action": "GetOTADetail",
          "token": $cookies.get('token'),
          "projectName": $cookies.get('projectName'),
          "data": {
            "OTACode": self.id
          } 
        };
        data = JSON.stringify(data);
        $http.post(url, data).then(function successCallback(response) {
          var data = response.data;
          if(data.rescode === 200) {
            self.info = data.data;
            $('#prePayment').val(self.info.PrePayment)
          }else if(data.rescode === 401){
            alert('登录超时，请重新登录');
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
          this.btnText = "提交中...";
          this.submitting = true;
        }else {
          self.btnText = "提交";
          self.submitting = false;
        }
      }
      self.submit = function () {
        var c = $scope.root.config;
        var url = c.requestUrl + '/partners' + c.extension;
        self.info.PrePayment = Number($('#prePayment').val())
        self.info.OTACode = self.id
        console.log(self.info)
        var data = {
          "action": "UpdateOTA",
          "OTACode": self.id,
          "token": $cookies.get('token'),
          "projectName": $cookies.get('projectName'),
          "data": self.info
        };
        data = JSON.stringify(data);
        self.setSubmit(true);
        $http.post(url, data).then(function successCallback(response) {
          var data = response.data;
          if(data.rescode === 200) {
            self.setMoney()
          }else if(data.rescode === 401){
            alert('登录超时，请重新登录');
            $location.path('/index');
          }else {
            self.setSubmit(false);
            alert('错误信息' + data.errInfo);
          }  
        }, function errorCallback(response) {
          self.setSubmit(false);
          alert('保存失败，请重试');
        });
      }

      self.setMoney = function() {
        var c = $scope.root.config;
        var action = ''
        var amount = 0
        if (self.addOrMinus === 'add') {
          action = 'AddPrePaymentAmount'
          if (!self.addAmount) {
            self.addAmount = 0
          }
          amount = (self.addAmount - 0) * 100
        } else {
          action = 'MinusPrePaymentAmount'
          if (!self.minusAmount) {
            self.minusAmount = 0
          }
          amount = (self.minusAmount - 0) * 100
        }

        var url = c.requestUrl + '/partners' + c.extension;
        var data = {
          "action": action,
          "OTACode": self.id,
          "token": $cookies.get('token'),
          "projectName": $cookies.get('projectName'),
          "amount": amount
        };
        data = JSON.stringify(data);
        self.setSubmit(true);

        $http.post(url, data).then(function successCallback(response) {
            var data = response.data;
            if(data.rescode === 200) {
              alert('保存成功')
              $location.path('/partnerConfig');
            }else if(data.rescode === 401){
              alert('登录超时，请重新登录');
              $location.path('/index');
            }else {
              self.setSubmit(false);
              alert(data.errInfo);
            }  
          }, function errorCallback(response) {
            self.setSubmit(false);
            alert('修改失败，请重试');
          });
      }
    }
  ]);

  app.controller('partnerEditController', ['$scope', '$state', '$stateParams', '$http', '$cookies', '$location', '$filter', 
    function($scope, $state, $stateParams, $http, $cookies, $location, $filter) {
      console.log('partnerEdit');
      var self = this;
      self.init = function () {
        self.id = $stateParams.id;
        self.info = {}
        var c = $scope.root.config;
        var url = c.requestUrl + '/partners' + c.extension;
        var data = {
          "action": "GetOTADetail",
          "token": $cookies.get('token'),
          "projectName": $cookies.get('projectName'),
          "data": {
            "OTACode": self.id
          } 
        };
        data = JSON.stringify(data);
        $http.post(url, data).then(function successCallback(response) {
          var data = response.data;
          if(data.rescode === 200) {            
            self.info = data.data;            
          } else if (data.rescode === 401){
            alert('登录超时，请重新登录');
            $location.path('/index');
          }else {
            alert(data.errInfo);
          }  
        }, function errorCallback(response) {
          alert('读取信息失败');
        });
        self.setSubmit(false);
      }

      self.setSubmit = function (status) {
        if(status) {
          this.btnText = "保存中...";
          this.submitting = true;
        }else {
          self.btnText = "保存";
          self.submitting = false;
        }
      }

      self.submit = function() {
        var c = $scope.root.config;
        var url = c.requestUrl + '/partners' + c.extension;
        self.info.OTACode = self.id
        var data = {
          "action": "UpdateOTA",
          "OTACode": self.id,
          "token": $cookies.get('token'),
          "projectName": $cookies.get('projectName'),
          "data": self.info
        };
        data = JSON.stringify(data);
        self.setSubmit(true);
        $http.post(url, data).then(function successCallback(response) {
          var data = response.data;
          if(data.rescode === 200) {
            alert('保存成功')
            $location.path('/partnerConfig');
          }else if(data.rescode === 401){
            alert('登录超时，请重新登录');
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

  app.controller('saleAddController', ['$scope', '$state', '$stateParams', '$location', '$cookies', '$http', '$filter',
    function($scope,$state, $stateParams, $location, $cookies, $http, $filter) {
      console.log('saleAdd');
      var self = this;
      self.id = $stateParams.id;
      self.init = function() {
        self.setSubmit(false);
        // 二维码 
        self.twoCodeOptions = [
          {code:1,value:"是"},
          {code:0,value:"否"}
        ]
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
        self.showCityList = false;
        self.showRegionList = false;      
        self.provinceList = [
          {
            "name": "北京",
            "id": 1,
            "number": 0
          }, {
            "name": "天津",
            "id": 2,
            "number": 0
          }, {
            "name": "河北",
            "id": 3,
            "number": 0
          }, {
            "name": "山西",
            "id": 4,
            "number": 0
          }, {
            "name": "内蒙古", 
            "id": 5,
            "number": 0
          }, {
            "name": "辽宁",
            "id": 6,
            "number": 0
          }, {
            "name": "吉林",
            "id": 7,
            "number": 0
          }, {
            "name": "黑龙江",
            "id": 8,
            "number": 0
          }, {
            "name": "上海",
            "id": 9,
            "number": 0
          }, {
            "name": "江苏",
            "id": 10,
            "number": 0
          }, {
            "name": "浙江",
            "id": 11,
            "number": 0
          }, {
            "name": "安徽",
            "id": 12,
            "number": 0
          }, {
            "name": "福建",
            "id": 13,
            "number": 0
          }, {
            "name": "江西",
            "id": 14,
            "number": 0
          }, {
            "name": "山东",
            "id": 15,
            "number": 0
          }, {
            "name": "河南",
            "id": 16,
            "number": 0
          }, {
            "name": "湖北",
            "id": 17,
            "number": 0
          }, {
            "name": "湖南",
            "id": 18,
            "number": 0
          }, {
            "name": "广东",
            "id": 19,
            "number": 0
          }, {
            "name": "广西",
            "id": 20,
            "number": 0
          }, {
            "name": "海南",
            "id": 21,
            "number": 0
          }, {
            "name": "重庆",
            "id": 22,
            "number": 0
          }, {
            "name": "四川",
            "id": 23,
            "number": 0
          }, {
            "name": "贵州",
            "id": 24,
            "number": 0
          }, {
            "name": "云南",
            "id": 25,
            "number": 0
          }, {
            "name": "西藏",  
            "id": 26,
            "number": 0
          }, {
            "name": "陕西",
            "id": 27,
            "number": 0
          }, {
            "name": "甘肃",
            "id": 28,
            "number": 0
          }, {
            "name": "青海",
            "id": 29,
            "number": 0
          }, {
            "name": "宁夏",
            "id": 30,
            "number": 0
          }, {
            "name": "新疆",
            "id": 31,
            "number": 0
          }, {
            "name": "台湾",
            "id": 32,
            "number": 0
          }, {
            "name": "香港",
            "id": 33,
            "number": 0
          }, {
            "name": "澳门",
            "id": 34,
            "number": 0
          }, {
            "name": "国外",
            "id": 35,
            "number": 0
          }
        ]
        self.orientationList = [
          {
            id: 0,
            name: "华北",
            allSelected: false,
            province:[]
          },{
            id: 1,
            name: "东北",
            allSelected: false,
            province: []
          },{
            id: 2,
            name: "华东",
            allSelected: false,
            province: []
          },{
            id: 3,
            name: "中南",
            allSelected: false,
            province: []
          },{
            id: 4,
            name: "西南",
            allSelected: false,
            province: []
          },{
            id: 5,
            name: "西北",
            allSelected: false,
            province: []
          },{
            id: 6,
            name: "其他",
            allSelected: false,
            province: []
          }
        ]
        
        self.provinceListR = JSON.parse(JSON.stringify(self.provinceList))
        self.orientationListR = JSON.parse(JSON.stringify(self.orientationList))
        self.initSaleDetailInfo();
      };
      self.chooseAll = function (item) {
        // 全选
        if (item.allSelected) {
          item.province.forEach(function(province){
            province.number=-1
          })
        } else { //全不选
          item.province.forEach(function(province){
            province.number=0
          })
        }
      }

      // 点选省份
      self.checkPvc = function (province) {
        self.showRegionList = false
        // 省份的√联动城市的√
        if (self.expandProvince && (self.expandProvince.id == province.id)) {
          self.expandProvince.citys.forEach(function(city){
            city.number = province.number
          })
        }
        // 省份的√联动大区的√

      }
      // 实名制点选省份
      self.checkPvcR = function (province) {
        self.showRegionList = false
        // 省份的√联动城市的√
        if (self.expandProvinceR && (self.expandProvinceR.id == province.id)) {
          self.expandProvinceR.citys.forEach(function(city){
            city.number = province.number
          })
        }
        // 省份的√联动大区的√

      }
      // 点选城市
      self.checkCity = function (city) {
        // 城市的√联动区县的√
        if (self.expandCity && (self.expandCity.id == city.id)) {
          self.expandCity.regions.forEach(function(region){
            if (city.number == -1) {
              region.selected = 1
            } else {
              region.selected = 0
            }
          })
        }   
        // 城市的√联动省份的number
        var fullCity = 0, halfCity = 0
        self.cityList.forEach(function(city){
          if (city.number == -1) {
            fullCity += 1
          } else if (city.number > 0) {
            halfCity += 1
          }
        })
        if (self.cityList.length == fullCity) {
          self.expandProvince.number = -1
        } else {
          self.expandProvince.number = fullCity + halfCity
        }
      }
      // 实名制点选城市
      self.checkCityR = function (city) {
        // 城市的√联动区县的√
        if (self.expandCityR && (self.expandCityR.id == city.id)) {
          self.expandCityR.regions.forEach(function(region){
            if (city.number == -1) {
              region.selected = 1
            } else {
              region.selected = 0
            }
          })
        }   
        // 城市的√联动省份的number
        var fullCity = 0, halfCity = 0
        self.cityListR.forEach(function(city){
          if (city.number == -1) {
            fullCity += 1
          } else if (city.number > 0) {
            halfCity += 1
          }
        })
        if (self.cityListR.length == fullCity) {
          self.expandProvinceR.number = -1
        } else {
          self.expandProvinceR.number = fullCity + halfCity
        }
      }
      // 点选区县
      self.checkRegion = function (region) {
        // 区县的√联动城市的√
        if (region.selected == 1) {
          self.expandCity.number += 1
          if (self.expandCity.number == self.regionList.length) {
            self.expandCity.number = -1
          }
        } else {
          self.expandCity.number -= 1
          if (self.expandCity.number == -2) {
            self.expandCity.number = self.regionList.length -1
          }
        }
        // 区县的点选还要联动到省份
        var fullCity = 0, halfCity = 0
        self.cityList.forEach(function(city){
          if (city.number == -1) {
            fullCity += 1
          } else if (city.number > 0) {
            halfCity += 1
          }
        })
        if (self.cityList.length == fullCity) {
          self.expandProvince.number = -1
        } else {
          self.expandProvince.number = fullCity + halfCity
        }
      }
      // 实名制点选区县
      self.checkRegionR = function (region) {
        // 区县的√联动城市的√
        if (region.selected == 1) {
          self.expandCityR.number += 1
          if (self.expandCityR.number == self.regionListR.length) {
            self.expandCityR.number = -1
          }
        } else {
          self.expandCityR.number -= 1
          if (self.expandCityR.number == -2) {
            self.expandCityR.number = self.regionListR.length -1
          }
        }
        // 区县的点选还要联动到省份
        var fullCity = 0, halfCity = 0
        self.cityListR.forEach(function(city){
          if (city.number == -1) {
            fullCity += 1
          } else if (city.number > 0) {
            halfCity += 1
          }
        })
        if (self.cityListR.length == fullCity) {
          self.expandProvinceR.number = -1
        } else {
          self.expandProvinceR.number = fullCity + halfCity
        }
      }

      self.getCityList = function (province,real) {
        var promise = new Promise(function(resolve, reject){
          var c = $scope.root.config;
          var url = c.requestUrl + '/sale' + c.extension;
          var realname = real ? 1 : 0
          var data = {
            "action": "GetCity",
            "account": $cookies.get('account'),
            "token": $cookies.get('token'),
            "projectName": $cookies.get('projectName'),
            "id": province.id,
            "saleId": "",
            "realname": realname
          };
          data = JSON.stringify(data);
          $http.post(url, data).then(function successCallback (res) {
            var data = res.data;
              if (data.rescode === 200) {  
                province.citys = data.city
                resolve(province.citys)                  
              } else if (data.rescode === 401) {
                reject()
                alert('登录超时，请重新登录');
                $location.path('/index');
              } else {
                reject()
                alert(data.errInfo);
              }  
          }, function errorCallback (res) {
            reject()
            alert('获取城市列表失败')
          })
        })
        return promise 
      }

      self.getRegionList = function (city, real) {
        var promise = new Promise(function(resolve, reject){
          var c = $scope.root.config;
          var url = c.requestUrl + '/sale' + c.extension;
          var realname = real ? 1 : 0
          var data = {
            "action": "GetRegion",
            "account": $cookies.get('account'),
            "token": $cookies.get('token'),
            "projectName": $cookies.get('projectName'),
            "id": city.id,
            "saleId": "",
            "realname": realname
          };
          data = JSON.stringify(data);

          $http.post(url, data).then(function successCallback (res) {
            var data = res.data;
              if (data.rescode === 200) {
                city.regions = data.region;   
                resolve(city.regions)            
              } else if (data.rescode === 401) {
                alert('登录超时，请重新登录');
                $location.path('/index');
              } else {
                alert(data.errInfo);
              }  
          }, function errorCallback (res) {
            alert('获取区县列表失败')
          })
        })
        return promise
      }

      // 点击省份名字
      self.updateCityList = function (province) {
        self.showCityList = true
        self.showRegionList = false
        self.expandProvince = province
        if (!province.citys) {
          self.getCityList(province, false).then(function(citys){
            self.cityList = self.expandProvince.citys
            if (self.expandProvince.number < 1) {
              self.cityList.forEach(function(city){
                city.number = self.expandProvince.number
              })
            }
            $scope.$digest()
          })
        } else {
          self.cityList = self.expandProvince.citys
          if (self.expandProvince.number < 1) {
            self.cityList.forEach(function(city){
              city.number = self.expandProvince.number
            })
          }
        }      
      }
      // 实名制点击省份名字
      self.updateCityListR = function (province) {
        self.showCityListR = true
        self.showRegionListR = false
        self.expandProvinceR = province
        if (!province.citys) {
          self.getCityList(province, true).then(function(citys){
            self.cityListR = self.expandProvinceR.citys
            if (self.expandProvinceR.number < 1) {
              self.cityListR.forEach(function(city){
                city.number = self.expandProvinceR.number
              })
            }
            $scope.$digest()
          })
        } else {
          self.cityListR = self.expandProvinceR.citys
          if (self.expandProvinceR.number < 1) {
            self.cityListR.forEach(function(city){
              city.number = self.expandProvinceR.number
            })
          }
        }      
      }
      // 点击城市名字
      self.updateRegionList = function (city) {
        self.expandCity = city
        if (!city.regions) {
          self.getRegionList(city, false).then(function(regions){
            self.regionList = self.expandCity.regions
            if (self.expandCity.number < 1) {
              self.regionList.forEach(function(region){
                if (self.expandCity.number == -1) {
                  region.selected = 1
                } else {
                  region.selected = 0
                }
              })
            }
            self.showRegionList = true
            $scope.$digest()
            
          })
        } else {
          self.regionList = self.expandCity.regions
          if (self.expandCity.number < 1) {
            self.regionList.forEach(function(region){
              if (self.expandCity.number == -1) {
                region.selected = 1
              } else {
                region.selected = 0
              }
            })
          }
          self.showRegionList = true
        }
      }
      // 实名制点击城市名字
      self.updateRegionListR = function (city) {
        self.expandCityR = city
        if (!city.regions) {
          self.getRegionList(city, true).then(function(regions){
            self.regionListR = self.expandCityR.regions
            if (self.expandCityR.number < 1) {
              self.regionListR.forEach(function(region){
                if (self.expandCityR.number == -1) {
                  region.selected = 1
                } else {
                  region.selected = 0
                }
              })
            }
            self.showRegionListR = true
            $scope.$digest()
          })
        } else {
          self.regionListR = self.expandCityR.regions
          if (self.expandCityR.number < 1) {
            self.regionListR.forEach(function(region){
              if (self.expandCityR.number == -1) {
                region.selected = 1
              } else {
                region.selected = 0
              }
            })
          }
          self.showRegionListR = true
        }
      }
      self.initSaleDetailInfo = function () {
        self.sale = {}
        self.sale.price = 0
        self.sale.TwoDBarCodeOn = self.twoCodeOptions[1];   
        // 可销售日期初始化
        var sDate = $filter('date')(new Date(), 'yyyy-MM-dd');
        var eDate = $filter('date')(new Date(), 'yyyy-MM-dd');
        $('#saleDateStart').val(sDate);
        $('#sale-date-start').val(sDate);
        $('#saleDateEnd').val(eDate);
        $('#sale-date-end').val(eDate);

        // visit date 可游玩时间设置
        var vDateStart = $filter('date')(new Date(), 'yyyy-MM-dd');
        var vDateEnd = $filter('date')(new Date(), 'yyyy-MM-dd');
        $('#visit-date-start').val(vDateStart);
        $('#visitDateStart').val(vDateStart);
        $('#visit-date-end').val(vDateEnd);
        $('#visitDateEnd').val(vDateEnd);

        // 当天可买票时间设置
        // $('#validTimeStart').val(data.sale.validTimeStart);
        $('#validTimeEnd').val('08:00');
        // 可预定时间设置
        $('#orderTimeStart').val('00:00:00');
        $('#orderTimeEnd').val('23:59:59');


        //二维码是否开启
        // self.twoCode = data.sale.TwoDBarCodeOn;
        $('#twoCode').val(0)
        $('#twoCode').removeClass('ng-invalid-required');
        self.sale.GateGoodsCount = 1
        self.sale.GateGoodsID = 70

        self.sale.MinPreOrderDays = 0
        self.sale.MaxPreOrderDays = 0
        self.sale.MinOrderNumber = 1
        self.sale.MaxOrderNumber = 0
        self.sale.PerPhoneLimit = {"Days": 0, "Number": 0}
        // 身份限制
        self.sale.IDCardNeeded = 0
        self.sale.SexLimit = -1
        self.sale.PerIDLimit = {"Days": 0, "Number": 0}
        self.sale.AgeLimit = {"min": 0, "max": 0}
        self.sale.AreaLimit = 0
        // 实名制身份限制
        self.sale.RealSexLimit = -1
        self.sale.RealPerIDLimit = {"Days": 0, "Number": 0}
        self.sale.RealAgeLimit = {"min": 0, "max": 0}
        self.sale.RealAreaLimit = 0
              
        // 改数据用provinceList，展示视图用orientationList
        for (var i=0;i<5;i++) {
          self.orientationList[0].province.push(self.provinceList[i])
        }
        for (var i=5;i<8;i++) {
          self.orientationList[1].province.push(self.provinceList[i])
        }
        for (var i=8;i<15;i++) {
          self.orientationList[2].province.push(self.provinceList[i])
        }
        for (var i=15;i<21;i++) {
          self.orientationList[3].province.push(self.provinceList[i])
        }
        for (var i=21;i<26;i++) {
          self.orientationList[4].province.push(self.provinceList[i])
        }
        for (var i=26;i<31;i++) {
          self.orientationList[5].province.push(self.provinceList[i])
        }
        for (var i=31;i<35;i++) {
          self.orientationList[6].province.push(self.provinceList[i])
        }

        for (var i=0;i<5;i++) {
          self.orientationListR[0].province.push(self.provinceListR[i])
        }
        for (var i=5;i<8;i++) {
          self.orientationListR[1].province.push(self.provinceListR[i])
        }
        for (var i=8;i<15;i++) {
          self.orientationListR[2].province.push(self.provinceListR[i])
        }
        for (var i=15;i<21;i++) {
          self.orientationListR[3].province.push(self.provinceListR[i])
        }
        for (var i=21;i<26;i++) {
          self.orientationListR[4].province.push(self.provinceListR[i])
        }
        for (var i=26;i<31;i++) {
          self.orientationListR[5].province.push(self.provinceListR[i])
        }
        for (var i=31;i<35;i++) {
          self.orientationListR[6].province.push(self.provinceListR[i])
        }

        self.initPartnersList();
        self.initpartnerConfig();    

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
              // for (var i = 0; i < self.partners.length; i++) {
              //   if(self.partners[i].partnerCode === self.sale.partnerCode) {
              //     self.myPartner = self.partners[i];
              //     break;
              //   }
              // }
            }else if(data.rescode === 401){
              alert('登录超时，请重新登录');
              $location.path('/index');
            }else {
              alert(data.errInfo);
            }  
          }, function errorCallback(response) {
            alert('读取分销商信息失败，请刷新页面重试');
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
              // for (var i = 0; i < self.goods.length; i++) {
              //   if(self.goods[i].id === self.sale.goodsId) {
              //     self.myGoods = self.goods[i];
              //     break;
              //   }
              // }
            }else if(data.rescode === 401){
              alert('登录超时，请重新登录');
              $location.path('/index');
            }else {
              alert(data.errInfo);
            }  
          }, function errorCallback(response) {
            alert('读取商品信息失败，请刷新页面重试');
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

      self.submit = function() {
        console.log(self.sale)
        
        // 当天可买票时间 必填
        if($('#validTimeEnd').val() == '') {
          alert('请输入当天可买票时间');
          return;
        }
        // 日期时间等的大小顺序校验
        if ($('#saleDateStart').val() > $('#saleDateEnd').val()) {
          alert('可销售日期设置错误')
          return
        }
        if ($('#visitDateStart').val() > $('#visitDateEnd').val()) {
          alert('可游玩日期设置错误')
          return
        }
        if ($('#orderTimeStart').val() > $('#orderTimeEnd').val()) {
          alert('可销售时间设置错误')
          return
        }
        if (self.sale.MaxPreOrderDays != 0 && self.sale.MinPreOrderDays > self.sale.MaxPreOrderDays - 1) {
          alert('提前购买时间设置错误')
          return
        }
        if (self.sale.MaxOrderNumber != 0 && self.sale.MinOrderNumber > self.sale.MaxOrderNumber) {
          alert('最小起订数不得大于最大限订数')
          return
        }
        if (self.sale.AgeLimit.max !=0 && self.sale.AgeLimit.min > self.sale.AgeLimit.max) {
          alert('年龄限定设置错误')
          return
        }
        if (self.sale.RealAgeLimit.max !=0 && self.sale.RealAgeLimit.min > self.sale.RealAgeLimit.max) {
          alert('年龄限定设置错误')
          return
        }
   
        // 要提交的三个数组
        self.sale.Province = []
        self.sale.City = []
        self.sale.Area = []
        // 如果要求身份信息和区域信息，就更新数组
        if (self.sale.AreaLimit == 0 && self.sale.AgeLimit.min == 0 
          && self.sale.AgeLimit.max == 0  && self.sale.SexLimit == -1 
          && self.sale.PerIDLimit.Days == 0){
          self.sale.IDCardNeeded = 0
        } else {
          self.sale.IDCardNeeded = 1
        }
        if (self.sale.AreaLimit == 1) {
          self.provinceList.forEach(function(province){
            if (province.number == -1) {
              self.sale.Province.push(province.id)
            } else if (province.number > 0) {
              province.citys.forEach(function(city){
                if (city.number == -1) {
                  self.sale.City.push(city.id)
                } else if (city.number > 0) {
                  city.regions.forEach(function(region){
                    if (region.selected == 1) {
                      self.sale.Area.push(region.id)
                    }
                  })
                }
              })
            }
          })
        }
        self.sale.RealProvince = []
        self.sale.RealCity = []
        self.sale.RealArea = []
        if (self.sale.RealAreaLimit == 1) {
          self.provinceListR.forEach(function(province){
            if (province.number == -1) {
              self.sale.RealProvince.push(province.id)
            } else if (province.number > 0) {
              province.citys.forEach(function(city){
                if (city.number == -1) {
                  self.sale.RealCity.push(city.id)
                } else if (city.number > 0) {
                  city.regions.forEach(function(region){
                    if (region.selected == 1) {
                      self.sale.RealArea.push(region.id)
                    }
                  })
                }
              })
            }
          })
        }

        var c = $scope.root.config;
        var url = c.requestUrl + '/sale' + c.extension;
        self.sale.status = 'on';
        // 可销售日期
        self.sale.saleDateStart = new Date($('#saleDateStart').val() + ' 00:00:00').getTime();
        self.sale.saleDateEnd = new Date($('#saleDateEnd').val() + ' 23:59:59').getTime();
        // 可游玩日期
        self.sale.visitDateStart =$('#visitDateStart').val() + ' 00:00:00';
        self.sale.visitDateEnd = $('#visitDateEnd').val() + ' 23:59:59';
        // 当日下单时间
        self.sale.validTimeEnd = $('#validTimeEnd').val();
        self.sale.validTimeStart = '00:00';
        // 通用可销售时间
        self.sale.OrderTimeLimit = {
          "StartTime": $('#orderTimeStart').val(),
          "EndTime": $('#orderTimeEnd').val()
        }
        
        self.sale.goodsId = self.myGoods.id;
        self.sale.partnerCode = self.myPartner.partnerCode;

        self.sale.TwoDBarCodeOn = self.sale.TwoDBarCodeOn.code || 0;
        self.sale.GateGoodsID = self.sale.GateGoodsID || 0;
        self.sale.GateGoodsCount = self.sale.GateGoodsCount || 0;

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
              alert('登录超时，请重新登录');
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
  
  app.controller('saleEditController', ['$scope', '$state', '$stateParams', '$location', '$cookies', '$http', '$filter',
    function($scope,$state, $stateParams, $location, $cookies, $http, $filter) {
    console.log('saleEdit');
    var self = this;
    self.id = $stateParams.id;
    this.init = function() {
      self.setSubmit(false);
      // 二维码 
      self.twoCodeOptions = [
        {code:1,value:"是"},
        {code:0,value:"否"}
      ]
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
      self.showCityList = false;
      self.showRegionList = false;      
      self.provinceList = [
        {
          "name": "北京",
          "id": 1,
          "number": 0
        }, {
          "name": "天津",
          "id": 2,
          "number": 0
        }, {
          "name": "河北",
          "id": 3,
          "number": 0
        }, {
          "name": "山西",
          "id": 4,
          "number": 0
        }, {
          "name": "内蒙古", 
          "id": 5,
          "number": 0
        }, {
          "name": "辽宁",
          "id": 6,
          "number": 0
        }, {
          "name": "吉林",
          "id": 7,
          "number": 0
        }, {
          "name": "黑龙江",
          "id": 8,
          "number": 0
        }, {
          "name": "上海",
          "id": 9,
          "number": 0
        }, {
          "name": "江苏",
          "id": 10,
          "number": 0
        }, {
          "name": "浙江",
          "id": 11,
          "number": 0
        }, {
          "name": "安徽",
          "id": 12,
          "number": 0
        }, {
          "name": "福建",
          "id": 13,
          "number": 0
        }, {
          "name": "江西",
          "id": 14,
          "number": 0
        }, {
          "name": "山东",
          "id": 15,
          "number": 0
        }, {
          "name": "河南",
          "id": 16,
          "number": 0
        }, {
          "name": "湖北",
          "id": 17,
          "number": 0
        }, {
          "name": "湖南",
          "id": 18,
          "number": 0
        }, {
          "name": "广东",
          "id": 19,
          "number": 0
        }, {
          "name": "广西",
          "id": 20,
          "number": 0
        }, {
          "name": "海南",
          "id": 21,
          "number": 0
        }, {
          "name": "重庆",
          "id": 22,
          "number": 0
        }, {
          "name": "四川",
          "id": 23,
          "number": 0
        }, {
          "name": "贵州",
          "id": 24,
          "number": 0
        }, {
          "name": "云南",
          "id": 25,
          "number": 0
        }, {
          "name": "西藏",  
          "id": 26,
          "number": 0
        }, {
          "name": "陕西",
          "id": 27,
          "number": 0
        }, {
          "name": "甘肃",
          "id": 28,
          "number": 0
        }, {
          "name": "青海",
          "id": 29,
          "number": 0
        }, {
          "name": "宁夏",
          "id": 30,
          "number": 0
        }, {
          "name": "新疆",
          "id": 31,
          "number": 0
        }, {
          "name": "台湾",
          "id": 32,
          "number": 0
        }, {
          "name": "香港",
          "id": 33,
          "number": 0
        }, {
          "name": "澳门",
          "id": 34,
          "number": 0
        }, {
          "name": "国外",
          "id": 35,
          "number": 0
        }
      ]
      self.orientationList = [
        {
          id: 0,
          name: "华北",
          allSelected: false,
          province:[]
        },{
          id: 1,
          name: "东北",
          allSelected: false,
          province: []
        },{
          id: 2,
          name: "华东",
          allSelected: false,
          province: []
        },{
          id: 3,
          name: "中南",
          allSelected: false,
          province: []
        },{
          id: 4,
          name: "西南",
          allSelected: false,
          province: []
        },{
          id: 5,
          name: "西北",
          allSelected: false,
          province: []
        },{
          id: 6,
          name: "其他",
          allSelected: false,
          province: []
        }
      ]
      self.provinceListR = JSON.parse(JSON.stringify(self.provinceList))
      self.orientationListR = JSON.parse(JSON.stringify(self.orientationList))
    };
    self.chooseAll = function (item) {
      // 全选
      if (item.allSelected) {
        item.province.forEach(function(province){
          province.number=-1
        })
      } else { //全不选
        item.province.forEach(function(province){
          province.number=0
        })
      }
    }

    // 点选省份
    self.checkPvc = function (province) {
      self.showRegionList = false
      // 省份的√联动城市的√
      if (self.expandProvince && (self.expandProvince.id == province.id)) {
        self.expandProvince.citys.forEach(function(city){
          city.number = province.number
        })
      }
      // 省份的√联动大区的√

    }
    // 实名制点选省份
    self.checkPvcR = function (province) {
      self.showRegionList = false
      // 省份的√联动城市的√
      if (self.expandProvinceR && (self.expandProvinceR.id == province.id)) {
        self.expandProvinceR.citys.forEach(function(city){
          city.number = province.number
        })
      }
      // 省份的√联动大区的√

    }
    // 点选城市
    self.checkCity = function (city) {
      // 城市的√联动区县的√
      if (self.expandCity && (self.expandCity.id == city.id)) {
        self.expandCity.regions.forEach(function(region){
          if (city.number == -1) {
            region.selected = 1
          } else {
            region.selected = 0
          }
        })
      }   
      // 城市的√联动省份的number
      var fullCity = 0, halfCity = 0
      self.cityList.forEach(function(city){
        if (city.number == -1) {
          fullCity += 1
        } else if (city.number > 0) {
          halfCity += 1
        }
      })
      if (self.cityList.length == fullCity) {
        self.expandProvince.number = -1
      } else {
        self.expandProvince.number = fullCity + halfCity
      }
    }
    // 实名制点选城市
    self.checkCityR = function (city) {
      // 城市的√联动区县的√
      if (self.expandCityR && (self.expandCityR.id == city.id)) {
        self.expandCityR.regions.forEach(function(region){
          if (city.number == -1) {
            region.selected = 1
          } else {
            region.selected = 0
          }
        })
      }   
      // 城市的√联动省份的number
      var fullCity = 0, halfCity = 0
      self.cityListR.forEach(function(city){
        if (city.number == -1) {
          fullCity += 1
        } else if (city.number > 0) {
          halfCity += 1
        }
      })
      if (self.cityListR.length == fullCity) {
        self.expandProvinceR.number = -1
      } else {
        self.expandProvinceR.number = fullCity + halfCity
      }
    }
    // 点选区县
    self.checkRegion = function (region) {
      // 区县的√联动城市的√
      if (region.selected == 1) {
        self.expandCity.number += 1
        if (self.expandCity.number == self.regionList.length) {
          self.expandCity.number = -1
        }
      } else {
        self.expandCity.number -= 1
        if (self.expandCity.number == -2) {
          self.expandCity.number = self.regionList.length -1
        }
      }
      // 区县的点选还要联动到省份
      var fullCity = 0, halfCity = 0
      self.cityList.forEach(function(city){
        if (city.number == -1) {
          fullCity += 1
        } else if (city.number > 0) {
          halfCity += 1
        }
      })
      if (self.cityList.length == fullCity) {
        self.expandProvince.number = -1
      } else {
        self.expandProvince.number = fullCity + halfCity
      }
    }
    // 实名制点选区县
    self.checkRegionR = function (region) {
      // 区县的√联动城市的√
      if (region.selected == 1) {
        self.expandCityR.number += 1
        if (self.expandCityR.number == self.regionListR.length) {
          self.expandCityR.number = -1
        }
      } else {
        self.expandCityR.number -= 1
        if (self.expandCityR.number == -2) {
          self.expandCityR.number = self.regionListR.length -1
        }
      }
      // 区县的点选还要联动到省份
      var fullCity = 0, halfCity = 0
      self.cityListR.forEach(function(city){
        if (city.number == -1) {
          fullCity += 1
        } else if (city.number > 0) {
          halfCity += 1
        }
      })
      if (self.cityListR.length == fullCity) {
        self.expandProvinceR.number = -1
      } else {
        self.expandProvinceR.number = fullCity + halfCity
      }
    }

    self.getCityList = function (province,real) {
      var promise = new Promise(function(resolve, reject){
        var c = $scope.root.config;
        var url = c.requestUrl + '/sale' + c.extension;
        var realname = real ? 1 : 0
        var data = {
          "action": "GetCity",
          "account": $cookies.get('account'),
          "token": $cookies.get('token'),
          "projectName": $cookies.get('projectName'),
          "id": province.id,
          "saleId": self.sale.saleId,
          "realname": realname
        };
        data = JSON.stringify(data);
        $http.post(url, data).then(function successCallback (res) {
          var data = res.data;
            if (data.rescode === 200) {  
              province.citys = data.city
              resolve(province.citys)                  
            } else if (data.rescode === 401) {
              reject()
              alert('登录超时，请重新登录');
              $location.path('/index');
            } else {
              reject()
              alert(data.errInfo);
            }  
        }, function errorCallback (res) {
          reject()
          alert('获取城市列表失败')
        })
      })
      return promise 
    }

    self.getRegionList = function (city, real) {
      var promise = new Promise(function(resolve, reject){
        var c = $scope.root.config;
        var url = c.requestUrl + '/sale' + c.extension;
        var realname = real ? 1 : 0
        var data = {
          "action": "GetRegion",
          "account": $cookies.get('account'),
          "token": $cookies.get('token'),
          "projectName": $cookies.get('projectName'),
          "id": city.id,
          "saleId": self.sale.saleId,
          "realname": realname
        };
        data = JSON.stringify(data);

        $http.post(url, data).then(function successCallback (res) {
          var data = res.data;
            if (data.rescode === 200) {
              city.regions = data.region;   
              resolve(city.regions)            
            } else if (data.rescode === 401) {
              alert('登录超时，请重新登录');
              $location.path('/index');
            } else {
              alert(data.errInfo);
            }  
        }, function errorCallback (res) {
          alert('获取区县列表失败')
        })
      })
      return promise
    }

    // 点击省份名字
    self.updateCityList = function (province) {
      self.showCityList = true
      self.showRegionList = false
      self.expandProvince = province
      if (!province.citys) {
        self.getCityList(province, false).then(function(citys){
          self.cityList = self.expandProvince.citys
          if (self.expandProvince.number < 1) {
            self.cityList.forEach(function(city){
              city.number = self.expandProvince.number
            })
          }
          $scope.$digest()
        })
      } else {
        self.cityList = self.expandProvince.citys
        if (self.expandProvince.number < 1) {
          self.cityList.forEach(function(city){
            city.number = self.expandProvince.number
          })
        }
      }      
    }
    // 实名制点击省份名字
    self.updateCityListR = function (province) {
      self.showCityListR = true
      self.showRegionListR = false
      self.expandProvinceR = province
      if (!province.citys) {
        self.getCityList(province, true).then(function(citys){
          self.cityListR = self.expandProvinceR.citys
          if (self.expandProvinceR.number < 1) {
            self.cityListR.forEach(function(city){
              city.number = self.expandProvinceR.number
            })
          }
          $scope.$digest()
        })
      } else {
        self.cityListR = self.expandProvinceR.citys
        if (self.expandProvinceR.number < 1) {
          self.cityListR.forEach(function(city){
            city.number = self.expandProvinceR.number
          })
        }
      }      
    }
    // 点击城市名字
    self.updateRegionList = function (city) {
      self.expandCity = city
      if (!city.regions) {
        self.getRegionList(city, false).then(function(regions){
          self.regionList = self.expandCity.regions
          if (self.expandCity.number < 1) {
            self.regionList.forEach(function(region){
              if (self.expandCity.number == -1) {
                region.selected = 1
              } else {
                region.selected = 0
              }
            })
          }
          self.showRegionList = true
          $scope.$digest()
          
        })
      } else {
        self.regionList = self.expandCity.regions
        if (self.expandCity.number < 1) {
          self.regionList.forEach(function(region){
            if (self.expandCity.number == -1) {
              region.selected = 1
            } else {
              region.selected = 0
            }
          })
        }
        self.showRegionList = true
      }
    }
    // 实名制点击城市名字
    self.updateRegionListR = function (city) {
      self.expandCityR = city
      if (!city.regions) {
        self.getRegionList(city, true).then(function(regions){
          self.regionListR = self.expandCityR.regions
          if (self.expandCityR.number < 1) {
            self.regionListR.forEach(function(region){
              if (self.expandCityR.number == -1) {
                region.selected = 1
              } else {
                region.selected = 0
              }
            })
          }
          self.showRegionListR = true
          $scope.$digest()
        })
      } else {
        self.regionListR = self.expandCityR.regions
        if (self.expandCityR.number < 1) {
          self.regionListR.forEach(function(region){
            if (self.expandCityR.number == -1) {
              region.selected = 1
            } else {
              region.selected = 0
            }
          })
        }
        self.showRegionListR = true
      }
    }
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
            // 返回的不是对象，在ng-options没法用
            self.sale.TwoDBarCodeOn = (self.sale.TwoDBarCodeOn == 1) ? self.twoCodeOptions[0] :self.twoCodeOptions[1];
            // 可销售时间初始化
            var sDate = $filter('date')(data.sale.saleDateStart, 'yyyy-MM-dd');
            var eDate = $filter('date')(data.sale.saleDateEnd, 'yyyy-MM-dd');
            $('#saleDateStart').val(sDate);
            $('#sale-date-start').val(sDate);
            $('#saleDateEnd').val(eDate);
            $('#sale-date-end').val(eDate);

            // visit date 可游玩时间初始化
            var vDateStart = $filter('date')(new Date(data.sale.visitDateStart), 'yyyy-MM-dd');
            var vDateEnd = $filter('date')(new Date(data.sale.visitDateEnd), 'yyyy-MM-dd');
            $('#visit-date-start').val(vDateStart);
            $('#visitDateStart').val(vDateStart);
            $('#visit-date-end').val(vDateEnd);
            $('#visitDateEnd').val(vDateEnd);

            // 当天可买票时间设置
            $('#validTimeStart').val(data.sale.validTimeStart);
            $('#validTimeEnd').val(data.sale.validTimeEnd);
            // 可预定时间设置
            $('#orderTimeStart').val(data.sale.OrderTimeLimit.StartTime);
            $('#orderTimeEnd').val(data.sale.OrderTimeLimit.EndTime);

            //二维码是否开启
            // self.twoCode = data.sale.TwoDBarCodeOn;
            $('#twoCode').val(data.sale.TwoDBarCodeOn)
            $('#twoCode').removeClass('ng-invalid-required');
            // 更新省份的选择情况
            self.sale.Province.forEach(function(province){
              self.provinceList[province.id-1].number = province.number
              if (province.number > 0) {
                self.getCityList(self.provinceList[province.id-1], false)
                .then(function(citys){
                  citys.forEach(function(city){
                    if (city.number > 0) {
                      self.getRegionList(city, false)
                    }
                  })
                })
              }              
            })
            self.sale.RealProvince.forEach(function(province){
              self.provinceListR[province.id-1].number = province.number
              if (province.number > 0) {
                self.getCityList(self.provinceListR[province.id-1], true)
                .then(function(citys){
                  citys.forEach(function(city){
                    if (city.number > 0) {
                      self.getRegionList(city, true)
                    }
                  })
                })
              }              
            })
            
            // 改数据用provinceList，展示视图用orientationList
            for (var i=0;i<5;i++) {
              self.orientationList[0].province.push(self.provinceList[i])
            }
            for (var i=5;i<8;i++) {
              self.orientationList[1].province.push(self.provinceList[i])
            }
            for (var i=8;i<15;i++) {
              self.orientationList[2].province.push(self.provinceList[i])
            }
            for (var i=15;i<21;i++) {
              self.orientationList[3].province.push(self.provinceList[i])
            }
            for (var i=21;i<26;i++) {
              self.orientationList[4].province.push(self.provinceList[i])
            }
            for (var i=26;i<31;i++) {
              self.orientationList[5].province.push(self.provinceList[i])
            }
            for (var i=31;i<35;i++) {
              self.orientationList[6].province.push(self.provinceList[i])
            }

            for (var i=0;i<5;i++) {
              self.orientationListR[0].province.push(self.provinceListR[i])
            }
            for (var i=5;i<8;i++) {
              self.orientationListR[1].province.push(self.provinceListR[i])
            }
            for (var i=8;i<15;i++) {
              self.orientationListR[2].province.push(self.provinceListR[i])
            }
            for (var i=15;i<21;i++) {
              self.orientationListR[3].province.push(self.provinceListR[i])
            }
            for (var i=21;i<26;i++) {
              self.orientationListR[4].province.push(self.provinceListR[i])
            }
            for (var i=26;i<31;i++) {
              self.orientationListR[5].province.push(self.provinceListR[i])
            }
            for (var i=31;i<35;i++) {
              self.orientationListR[6].province.push(self.provinceListR[i])
            }

            self.initPartnersList();
            self.initpartnerConfig();

          }else if(data.rescode === 401){
            alert('登录超时，请重新登录');
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
          } else if(data.rescode === 401){
            alert('登录超时，请重新登录');
            $location.path('/index');
          } else {
            alert(data.errInfo);
          }  
        }, function errorCallback(response) {
          alert('读取分销商信息失败，请刷新页面重试');
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
            alert('登录超时，请重新登录');
            $location.path('/index');
          }else {
            alert(data.errInfo);
          }  
        }, function errorCallback(response) {
          alert('读取商品信息失败，请刷新页面重试');
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

    this.submit = function() {
      // 当天可买票时间 必填
      if($('#validTimeEnd').val() == '') {
        alert('请输入当天可买票时间');
        return;
      }
      // 日期时间等的大小顺序校验
      if (new Date($('#saleDateStart').val() + ' 00:00:00') > new Date($('#saleDateStart').val() + ' 23:59:59')) {
        alert('可销售日期设置错误')
        return
      }
      if ($('#visitDateStart').val() + ' 00:00:00' > $('#visitDateEnd').val() + ' 23:59:59') {
        alert('可游玩日期设置错误')
        return
      }
      if ($('#orderTimeStart').val() > $('#orderTimeEnd').val()) {
        alert('可销售时间设置错误')
        return
      }
      if (self.sale.MaxPreOrderDays != 0 && self.sale.MinPreOrderDays > self.sale.MaxPreOrderDays - 1) {
        alert('提前购买时间设置错误')
        return
      }
      if (self.sale.MaxOrderNumber != 0 && self.sale.MinOrderNumber > self.sale.MaxOrderNumber) {
        alert('最小起订数不得大于最大限订数')
        return
      }
      if (self.sale.AgeLimit.max !=0 && self.sale.AgeLimit.min > self.sale.AgeLimit.max) {
        alert('年龄限定设置错误')
        return
      }
      if (self.sale.RealAgeLimit.max !=0 && self.sale.RealAgeLimit.min > self.sale.RealAgeLimit.max) {
        alert('年龄限定设置错误')
        return
      }
 
      // 要提交的三个数组
      self.sale.Province = []
      self.sale.City = []
      self.sale.Area = []
      // 如果要求身份信息和区域信息，就更新数组
      if (self.sale.AreaLimit == 0 && self.sale.AgeLimit.min == 0 
        && self.sale.AgeLimit.max == 0  && self.sale.SexLimit == -1 
        && self.sale.PerIDLimit.Days == 0){
        self.sale.IDCardNeeded = 0
      } else {
        self.sale.IDCardNeeded = 1
      }
      if (self.sale.AreaLimit == 1) {
        self.provinceList.forEach(function(province){
          if (province.number == -1) {
            self.sale.Province.push(province.id)
          } else if (province.number > 0) {
            province.citys.forEach(function(city){
              if (city.number == -1) {
                self.sale.City.push(city.id)
              } else if (city.number > 0) {
                city.regions.forEach(function(region){
                  if (region.selected == 1) {
                    self.sale.Area.push(region.id)
                  }
                })
              }
            })
          }
        })
      }
      self.sale.RealProvince = []
      self.sale.RealCity = []
      self.sale.RealArea = []
      if (self.sale.RealAreaLimit == 1) {
        self.provinceListR.forEach(function(province){
          if (province.number == -1) {
            self.sale.RealProvince.push(province.id)
          } else if (province.number > 0) {
            province.citys.forEach(function(city){
              if (city.number == -1) {
                self.sale.RealCity.push(city.id)
              } else if (city.number > 0) {
                city.regions.forEach(function(region){
                  if (region.selected == 1) {
                    self.sale.RealArea.push(region.id)
                  }
                })
              }
            })
          }
        })
      }

      var c = $scope.root.config;
      var url = c.requestUrl + '/sale' + c.extension;
      self.sale.status = 'on';
      // 可销售日期
      self.sale.saleDateStart = new Date($('#saleDateStart').val() + ' 00:00:00').getTime();
      self.sale.saleDateEnd = new Date($('#saleDateEnd').val() + ' 23:59:59').getTime();
      // 可游玩日期
      self.sale.visitDateStart = $('#visitDateStart').val() + ' 00:00:00';
      self.sale.visitDateEnd = $('#visitDateEnd').val() + ' 23:59:59';
      // 当日下单时间
      self.sale.validTimeEnd = $('#validTimeEnd').val();
      self.sale.validTimeStart = '00:00';
      // 通用可销售时间
      // 如果秒为0的话，jquery会把秒省略掉
      var orderS = $('#orderTimeStart').val()
      if (orderS.length == 5) {
        orderS = orderS + ':00'
      }
      var orderE = $('#orderTimeEnd').val()
      if (orderE.length == 5) {
        orderE = orderE + ':00'
      }
      self.sale.OrderTimeLimit = {
        StartTime: orderS,
        EndTime: orderE
      }      
      self.sale.goodsId = self.myGoods.id;
      self.sale.partnerCode = self.myPartner.partnerCode;

      self.sale.TwoDBarCodeOn = self.sale.TwoDBarCodeOn.code || 0;
      self.sale.GateGoodsID = self.sale.GateGoodsID || 0;
      self.sale.GateGoodsCount = self.sale.GateGoodsCount || 0;

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
            alert('登录超时，请重新登录');
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

  app.controller('checkTouristController', ['$filter', '$scope', '$http', '$cookies', '$location', '$window', 'NgTableParams',
        function($filter, $scope, $http, $cookies, $location, $window, NgTableParams) {
            console.log('checkTourist');
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
                    forceParse: 0,
                    showMeridian: 1
                });
                self.bookPerson = '';
                $('#check-time-start').val('00:00:00')
                $('#check-time-end').val('23:59:59')
            }
            self.clearCheckStart = function () {
              $('#check-time-start').val('00:00:00')
              $('#rd_zpqvrt').val('')
              $('#check-date-start').val('')
            }
            self.clearCheckEnd = function () {
              $('#check-time-end').val('23:59:59')
              $('#rd_fiekwn').val('')
              $('#check-date-end').val('')
            }
            self.export = function() {
                var c = $scope.root.config;
                var url = c.requestUrl + '/orders' + c.extension;

                // 如果成交时间为空，默认设置三天查询，如果某个时间为空，补全整个时间段前移或后移三天
                if(!$('#rd_qcaxwa').val() && !$('#rd_khaydt').val()) {
                    var sDate = new Date();
                    sDate.setDate(sDate.getDate() - 3);
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
                    d.setDate(d.getDate() - 3);
                    d = $filter('date')(d.getTime(), 'yyyy-MM-dd');
                    $('#rd_qcaxwa').val(d);
                    $('#order-create-date-start').val(d);
                }
                // 仅结束时间为空时
                else if(!$('#rd_khaydt').val()){
                    var d = new Date($('#rd_qcaxwa').val());
                    d.setDate(d.getDate() + 3);
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
                        "orderTicketCode": self.orderTicketCode ? self.orderTicketCode : "",
                        "bookerIDType": self.bookerIDType ? self.bookerIDType : "",      //  ID_CARD是身份证
                        "bookerID": self.bookerID ? self.bookerID : "",  //身份证号
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
                        if (confirm('导出中，导出成功后会在“报表中心－导出列表”中显示，是否前往查看？')) {
                            $location.path('/exportStatementsList');
                        }
                    }else if(data.rescode === 401){
                        alert('登录超时，请重新登录');
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
                            
                            //读取成交日期
                            self.orderCreateDateStart = $('#rd_qcaxwa').val() ? new Date($('#rd_qcaxwa').val() + ' 00:00:00').getTime() : '';
                            self.orderCreateDateEnd = $('#rd_khaydt').val() ? new Date($('#rd_khaydt').val() + ' 23:59:59').getTime() : '';

                            //读取游玩日期
                            self.visitDateStart = $('#rd_lptvht').val() ? new Date($('#rd_lptvht').val() + ' 00:00:00').getTime() : '';
                            self.visitDateEnd = $('#rd_idwdiz').val() ? new Date($('#rd_idwdiz').val() + ' 23:59:59').getTime() : '';

                            // 检票时间
                            self.checkDateStart = $('#rd_zpqvrt').val() ? new Date($('#rd_zpqvrt').val() + ' ' + $('#check-time-start').val()).getTime() : '';
                            self.checkDateEnd = $('#rd_fiekwn').val() ? new Date($('#rd_fiekwn').val() + ' ' + $('#check-time-end').val()).getTime() : '';

                            var data = {
                                "action": "GetOrderCheckList",
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
                                    "orderTicketCode": self.orderTicketCode ? self.orderTicketCode : "",
                                    "bookerIDType": self.bookerIDType ? self.bookerIDType : "",      //  ID_CARD是身份证
                                    "bookerID": self.bookerID ? self.bookerID : "",  //身份证号
                                    "goodsName": self.goodsName ? self.goodsName : "",
                                    "checkStatus": self.checkStatus ? self.checkStatus : "all", //checked：已检票，checking：检票中，waiting：待检票
                                    "partnerName": self.partnerName ? self.partnerName : "",
                                    "orderCreateDateStart": self.orderCreateDateStart ? self.orderCreateDateStart+"" : "", //成交日期开始
                                    "orderCreateDateEnd": self.orderCreateDateEnd ? self.orderCreateDateEnd+"" : "", //成交日期结束
                                    "visitDateStart": self.visitDateStart ? self.visitDateStart : "",
                                    "visitDateEnd": self.visitDateEnd ? self.visitDateEnd : "",
                                    "checkDateStart": self.checkDateStart ? self.checkDateStart : "", //检票时间开始   年月日，时分
                                    "checkDateEnd": self.checkDateEnd ? self.checkDateEnd : "",    //检票时间开始   年月日，时分
                                    "isExpired": self.isExpired ? self.isExpired : "all"
                                }
                            };
                            data = JSON.stringify(data);
                            self.loading = true;
                            self.noData = false;

                            return $http.post(url, data).then(function successCallback(response) {
                                self.loading = false;
                                var data = response.data;
                                if(data.rescode === 200) {
                                    // 查无数据
                                    if(data.orders.totalCount === 0) {
                                        self.noData = true;
                                    }
                                    params.total(data.orders.totalCount);
                                    self.tableData = data.orders.lists;
                                    console.log(data.orders.lists);
                                    return data.orders.lists;
                                }else if(data.rescode === 401){
                                    alert('登录超时，请重新登录');
                                    $location.path('/index');
                                }else {
                                    alert(data.errInfo);
                                }
                            }, function errorCallback(response) {
                                self.loading = false;
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
            // 游客信息
            self.showPersonDetail = function(orderId) {
                $scope.root.coverUrl = 'pages/personDetail.html';
                $scope.root.coverParamId = orderId;
            }
            //检票详情
            self.showCheckDetail = function (orderId) {
                $scope.root.coverUrl = 'pages/checkDetail.html';
                $scope.root.coverParamId = orderId;
            }
        }
  ]);

  app.controller('ordersChartsController', ['$filter', '$scope', '$http', '$cookies', '$location', '$window', 'NgTableParams',
    function($filter, $scope, $http, $cookies, $location, $window, NgTableParams) {
      console.log('ordersCharts');
      var self = this;
      self.init = function () {
        $('.form_date').datetimepicker({
          language: 'zh-CN',
          weekStart: 1,
          todayBtn: 1,
          autoclose: 1,
          todayHighlight: 1,
          startView: 2,
          minView: 2,
          forceParse: 0,
          showMeridian: 1
        });
        self.myChart = echarts.init(document.getElementById('e-pie'))
        self.myChart.setOption({
          title: {
            text: '订单统计',
            right: 'center',
            top: 20
          },
          series : [
            {
              name: '订单统计',
              label: {
                normal: {
                  formatter: '{b}\n{c}人，{d}%\n',
                }                    
              },
              type: 'pie',
              radius: '55%',
              data:[]
            }
          ]
        })
        self.initPartnersList()
        self.initpartnerConfig()
        self.search(false)                       
      }

      self.initpartnerConfig = function () {
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
        }
        data = JSON.stringify(data)
        $http.post(url, data).then(function successCallback(response) {
          var data = response.data;
          if (data.rescode === 200) {
            self.goods = data.goods.lists;
          } else if (data.rescode === 401) {
            alert('登录超时，请重新登录');
            $location.path('/index');
          } else {
            alert(data.errInfo);
          }  
        }, function errorCallback (response) {
          alert('读取商品信息失败，请刷新页面重试')
        })
      }

      self.initPartnersList = function () {
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
        }
        data = JSON.stringify(data);
        $http.post(url, data).then(function successCallback(response) {
          var data = response.data;
          if(data.rescode === 200) {
            self.partners = data.partners.lists;
          } else if (data.rescode === 401) {
            alert('登录超时，请重新登录');
            $location.path('/index');
          } else {
            alert(data.errInfo);
          }  
        }, function errorCallback(response) {
          alert('读取分销商信息失败，请刷新页面重试');
        });
      }
      //time to date
      self.timeToDate = function(time,format){
        var t = new Date(time);
        var tf = function(i){return (i < 10 ? '0' : '') + i};
        return format.replace(/yyyy|MM|dd|HH|mm|ss/g, function(a){
          switch(a){
            case 'yyyy':
              return tf(t.getFullYear());
              break;
            case 'MM':
              return tf(t.getMonth() + 1);
              break;
            case 'mm':
              return tf(t.getMinutes());
              break;
            case 'dd':
              return tf(t.getDate());
              break;
            case 'HH':
              return tf(t.getHours());
              break;
            case 'ss':
              return tf(t.getSeconds());
              break;
          }
        })
      }
      
      self.search = function (flag) {
        self.myChart.showLoading();
        var c = $scope.root.config;
        var url = c.requestUrl + '/statistics' + c.extension;
        if (flag) {
          self.orderCreateDateStart = $('#rd_qcaxwa').val() ? self.timeToDate(new Date($('#rd_qcaxwa').val() + ' 00:00:00'),'yyyy-MM-dd HH:mm:ss') : '';
          self.orderCreateDateEnd = $('#rd_khaydt').val() ? self.timeToDate(new Date($('#rd_khaydt').val() + ' 23:59:59'),'yyyy-MM-dd HH:mm:ss') : '';
          self.goodsName = self.myGoods ? self.myGoods.goodsName : ''
          self.OTAName = self.myPartner ? self.myPartner.partnerName : ''   
        } else {
          var n = new Date()
          var d = new Date().getDate()
          $('#rd_khaydt').val(self.timeToDate(n,'yyyy-MM-dd'))
          $('#order-create-date-end').val(self.timeToDate(n,'yyyy-MM-dd'))          
          $('#rd_qcaxwa').val(self.timeToDate(n.setDate(d - 6),'yyyy-MM-dd'))                    
          $('#order-create-date-start').val(self.timeToDate(n,'yyyy-MM-dd'))
          self.orderCreateDateStart = $('#rd_qcaxwa').val() ? self.timeToDate(new Date($('#rd_qcaxwa').val() + ' 00:00:00'),'yyyy-MM-dd HH:mm:ss') : '';
          self.orderCreateDateEnd = $('#rd_khaydt').val() ? self.timeToDate(new Date($('#rd_khaydt').val() + ' 23:59:59'),'yyyy-MM-dd HH:mm:ss') : '';
          self.goodsName = "";
          self.OTAName = "";
        }
        var data = {
          "action": "OrderStatistics",
          "token": $cookies.get('token'),
          "projectName": $cookies.get('projectName'),
          "search": {
            "OrderStartTime": self.orderCreateDateStart ? self.orderCreateDateStart + "" : "", //下单日期开始
            "OrderEndTime": self.orderCreateDateEnd ? self.orderCreateDateEnd + "" : "", //下单日期结束
            "GoodsName": self.goodsName,
            "OTAName": self.OTAName
          }
        }
        data = JSON.stringify(data);
        $http.post(url, data).then(function successCallback (response) {
          self.myChart.hideLoading();
          var data = response.data;
          if (data.rescode == 200) {
            if(data.OrderStatus.CheckedCount+data.OrderStatus.UncheckedCount+data.OrderStatus.RefundedCount == 0){
              self.showList = false
              self.myChart.setOption({
                title: {
                  text: '无数据',
                  left: 30
                },
                series : [
                  {
                    name: '订单统计',
                    data: []
                  }
                ]
              })
            } else {
              self.showList = true
              self.orderData = data.OrderStatus
              self.orderData.totalCount = self.orderData.CheckedCount + self.orderData.UncheckedCount + self.orderData.RefundedCount
              self.myChart.setOption({
                title: {
                  text: '订单统计',
                  right: 'center'
                },
                legend: {
                  bottom: 10,
                  data: ['已检人数', '未检人数', '退票人数']
                },
                series : [
                  {
                    name: '订单统计',
                    data: [
                      {
                        value: data.OrderStatus.CheckedCount,
                        name: '已检人数'
                      },{
                        value: data.OrderStatus.UncheckedCount,
                        name: '未检人数'
                      },{
                        value: data.OrderStatus.RefundedCount,
                        name: '退票人数'
                      }
                    ]
                  }
                ]
              })
            }
            if (data.Futrue7Days.length > 0) {
              self.showContent = true
              self.days = data.Futrue7Days
            } else {
              self.showContent = false
            }
          } else if (data.rescode == 401) {
            alert('登录超时，请重新登录');
            $location.path('/index');
          } else {
            alert(data.errInfo);
          }
        }, function errorCallback(response) {
          self.myChart.hideLoading();
          alert('加载失败，请重试');
        });
      }
    }
  ]);

  app.controller('monthlyChartsController', ['$filter', '$scope', '$http', '$cookies', '$location', '$window', 'NgTableParams',
    function($filter, $scope, $http, $cookies, $location, $window, NgTableParams) {
      console.log('monthlyCharts');
      var self = this;
      self.init = function () {
        self.year = new Date().getFullYear()
        self.month = new Date().getMonth()+1+''
        self.lineChart = echarts.init(document.getElementById('e-line'))
        self.lineChart.setOption({
          title: {
              text: '月度销售统计 - 金额',
              left: 80
          },
          tooltip: {
              trigger: 'axis'
          },
          legend: {
              data:['订单数','检票数','退票数']
          },
          xAxis:  {
              type: 'category',
              boundaryGap: false,
              data: []
          },
          yAxis: {
              type: 'value'
          },
          series: [
              {
                  name:'订单数',
                  type:'line',
                  data:[]
              },
              {
                  name:'检票数',
                  type:'line',
                  data:[]
              },
              {
                  name:'退票数',
                  type:'line',
                  data:[]
              }
          ]
        })
        self.search(1)
      }

      // chartsData
      self.search = function (type) {
        self.lineChart.showLoading()
        var c = $scope.root.config;
        var url = c.requestUrl + '/statistics' + c.extension;
        var data = {
          "action": "MonthlyOrderStatistics",
          "token": $cookies.get('token'),
          "projectName": $cookies.get('projectName'),
          "search": {
            "OrderYear": self.year ? self.year + "" : "",
            "OrderMonth": self.month ? self.month + "" : "",
            "SearchType": type + ""
          }
        };
        data = JSON.stringify(data);
        $http.post(url, data).then(function successCallback (response) {
          self.lineChart.hideLoading()
          var data = response.data;
          if (data.rescode == 200) {
              // 查无数据
            if (data.OrderMonthlyStatus.length == 0) {
              self.lineChart.setOption({
                title: {
                  text: '无数据',
                  left: 80
                },
                xAxis:  {
                  type: 'category',
                  boundaryGap: false,
                  data: []
                },         
                series: [
                  {
                    name:'订单数',
                    type:'line',
                    data:[]
                  },
                  {
                    name:'检票数',
                    type:'line',
                    data:[]
                  },
                  {
                    name:'退票数',
                    type:'line',
                    data:[]
                  }
                ]
              })
            } else {
              var monthData = data.OrderMonthlyStatus
              var xAxisList = Object.keys(monthData)
              xAxisList.sort()
              var orderCountList = []
              var checkCountList = []
              var refundCountList = []
              for (var i=0; i<xAxisList.length; i++) {
                orderCountList.push(monthData[xAxisList[i]].OrderCount) 
                checkCountList.push(monthData[xAxisList[i]].CheckCount)
                refundCountList.push(monthData[xAxisList[i]].RefundCount)
              }
              var titleText = type === 0 ? '月度销售统计 - 金额' : '月度销售统计 - 数量'
              self.lineChart.setOption({
                title: {
                  text: titleText,
                  left: 80
                },
                xAxis:  {
                  type: 'category',
                  boundaryGap: false,
                  data: xAxisList
                },         
                series: [
                  {
                    name:'订单数',
                    type:'line',
                    data:orderCountList
                  },
                  {
                    name:'检票数',
                    type:'line',
                    data:checkCountList
                  },
                  {
                    name:'退票数',
                    type:'line',
                    data:refundCountList
                  }
                ]
              })  
            }
          } else if (data.rescode == 401) {
            alert('登录超时，请重新登录')
            $location.path('/index')
          } else {
            alert(data.errInfo)
          }
        }, function errorCallback(response) {
          self.lineChart.hideLoading()
          alert('加载失败，请重试')
        })
      }
    }
  ])

  app.controller('yearlyChartsController', ['$filter', '$scope', '$http', '$cookies', '$location', '$window', 'NgTableParams',
    function($filter, $scope, $http, $cookies, $location, $window, NgTableParams) {
      console.log('yearlyCharts');
      var self = this;
      self.init = function () {
        self.year = new Date().getFullYear()  
        console.log(self.year)
        self.lineChart = echarts.init(document.getElementById('e-line'))
        self.lineChart.setOption({
          title: {
            text: '年度销售统计 - 数量',
            left: 80
          },
          tooltip: {
            trigger: 'axis'
          },
          legend: {
            data:['订单数','检票数','退票数']
          },
          xAxis:  {
            type: 'category',
            boundaryGap: false,
            data: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']
          },
          yAxis: {
            type: 'value'
          },
          series: [
            {
              name:'订单数',
              type:'line',
              data:[]
            },
            {
              name:'检票数',
              type:'line',
              data:[]
            },
            {
              name:'退票数',
              type:'line',
              data:[]
            }
          ]
        })
        self.search(0)
      }
      // chartsData
      self.search = function (type) {
        self.lineChart.showLoading()
        var c = $scope.root.config
        var url = c.requestUrl + '/statistics' + c.extension
        var data = {
          "action": "OrderYearStatistics",
          "token": $cookies.get('token'),
          "projectName": $cookies.get('projectName'),
          "search": {
            "OrderYear": self.year ? self.year + "" : "",
            "SearchType": type + ""
          }
        }
        data = JSON.stringify(data)   
        $http.post(url, data).then(function successCallback (response) {
          self.lineChart.hideLoading()
          var data = response.data;
          if (data.rescode == 200) {
              // 查无数据
            if (data.OrderSalesStatus == {}) {
              self.lineChart.setOption({
                title: {
                  text: '无数据',
                  left: 80
                },
                xAxis:  {
                  type: 'category',
                  boundaryGap: false,
                  data: []
                },         
                series: [
                  {
                    name:'订单数',
                    type:'line',
                    data:[],
                  },
                  {
                    name:'检票数',
                    type:'line',
                    data:[]
                  },
                  {
                    name:'退票数',
                    type:'line',
                    data:[]
                  }
                ]
              })
            } else {
              var monthData = data.OrderSalesStatus
              
              var orderCountList = []
              var checkCountList = []
              var refundCountList = []
              for (var i=1; i<13; i++) {
                var key = i + ''
                orderCountList.push(monthData[key].OrderCount) 
                checkCountList.push(monthData[key].CheckCount)
                refundCountList.push(monthData[key].RefundCount)
              }
              var titleText = type === 1 ? '年度销售统计 - 金额' : '年度销售统计 - 数量'
              self.lineChart.setOption({
                title: {
                  text: titleText,
                  left: 80
                },
                xAxis:  {
                  type: 'category',
                  boundaryGap: false,
                  data: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'] 
                },         
                series: [
                  {
                    name:'订单数',
                    type:'line',
                    data:orderCountList,
                  },
                  {
                    name:'检票数',
                    type:'line',
                    data:checkCountList
                  },
                  {
                    name:'退票数',
                    type:'line',
                    data:refundCountList
                  }
                ]
              })  
            }
          } else if (data.rescode == 401) {
              alert('登录超时，请重新登录');
              $location.path('/index');
          } else {
              alert(data.errInfo);
          }
        }, function errorCallback(response) {
            self.lineChart.hideLoading()
            alert('加载失败，请重试');
        })
      }
    }
  ])

  app.controller('goodsRateController', ['$filter', '$scope', '$http', '$cookies', '$location', '$window', 'NgTableParams',
    function($filter, $scope, $http, $cookies, $location, $window, NgTableParams) {
      console.log('goodsRate');
      var self = this;
      self.init = function () {
        self.year = new Date().getFullYear();
        self.month = 0;
        self.pieChart = echarts.init(document.getElementById('e-pie'))
        self.barChart = echarts.init(document.getElementById('e-bar'))
        self.pieChart.setOption({
          title: {
            text: '票型销售统计',
            subtext: '仅显示销量前十位'                     
          },
          series : [
            {
              name: '票型销售统计',
              center: ['55%', '50%'],
              label: {
                normal: {
                  align: 'center',
                  formatter: '{b}\n{c}张，{d}%',
                }                    
              },
              type: 'pie',
              radius: '45%',
              data:[]
            }
          ]
        })
        self.barChart.setOption({
          title: {
            text: '分销商销售统计',
            subtext: '仅显示销量前十位\n'     
          },
          tooltip: {
            trigger: 'axis'
          },
          legend: {
            data:['销售金额','销售数量']
          },
          grid: {
            y: 90,
            y2: 200
          },    
          barMaxWidth: 50,
          xAxis: {
            type : 'category',
            axisLabel: {
              interval: 0,
              formatter: function (val) {
                return val.split("").join("\n"); 
              }
            },
            data : []
          },
          yAxis : [
            {
              name:'销售金额',
              type : 'value'
            },
            {
              name:'销售数量',
              type : 'value'
            }
          ],
          series : [
            {
              name:'销售金额',
              yAxisIndex: 0,
              type:'bar',
              data:[]
            },
            {
              name:'销售数量',
              yAxisIndex: 1,
              type:'bar',
              data:[]
            }
          ]
        })  
        self.search()
      }

      // chartsData
      self.search = function () {
        self.pieChart.showLoading()
        self.barChart.showLoading()
        var c = $scope.root.config;
        var url = c.requestUrl + '/statistics' + c.extension;
        var data = {
          "action": "OrderSalesStatistics",
          "token": $cookies.get('token'),
          "projectName": $cookies.get('projectName'),
          "search": {
            "OrderYear": self.year ? self.year + "" : "",
            "OrderMonth": self.month ? self.month + "" : "0"
          }
        };
        data = JSON.stringify(data);
        $http.post(url, data).then(function successCallback(response) {
          self.pieChart.hideLoading()
          self.barChart.hideLoading()
          var data = response.data;
          if (data.rescode == 200) {
            // 票型无数据
            if (data.OrderSalesStatus.length == 0) {
              self.pieChart.setOption({
                title: {
                  text: '票型统计数据为空',
                  subtext: '',
                  left: 30
                },
                series : [
                  {
                    name: '票型销售统计',
                    data: []
                  }
                ]
              })              
            } else { // 数据处理
              self.typeRatioData = data.OrderSalesStatus
              var legendList = []
              self.typeRatioData.forEach(function (item) {
                legendList.push(item.name)
              })
              self.pieChart.setOption({
                title: {
                  text: '票型销售统计',
                  right: 'center'
                },
                legend: {
                  type: 'scroll',
                  bottom: 50,
                  data: legendList
                },
                series : [
                  {
                    name: '票型销售统计',
                    data: data.OrderSalesStatus
                  }
                ]
              }) 
            }
            // 分销商统计无数据
            if (data.OTASalesStatus.length == 0) {
              self.barChart.setOption({
                title: {
                  text: '分销商统计数据为空',
                  subtext: ''
                },
                legend: {
                  data:[]
                },
                xAxis: {
                  show: false,
                  data : []
                },
                yAxis: [
                  { 
                    name:'销售金额',
                    show: false
                  },
                  {
                    name:'销售数量',
                    show: false
                  }
                ],
                series : [
                  {

                    name: '销售金额',
                    data: []
                  },
                  {
                    name: '销售数量',
                    data: []
                  }
                ]
              })
            } else {
              self.OTAData = data.OTASalesStatus
              var OTANameList = []
              var OTAMoneyData = []
              var OTACountData = []
              self.OTAData.forEach(function (ota) {
                OTANameList.push(ota.OTAName)
                OTAMoneyData.push(Number(ota.SaleMoney))
                OTACountData.push(Number(ota.SaleCount))
              })
              self.barChart.setOption({
                title : {
                  text: '分销商销售统计',
                  subtext: '仅显示销量前十位'
                },
                legend: {
                  data:['销售金额','销售数量']
                },
                xAxis: {
                  show: true,
                  data : OTANameList
                },
                yAxis: [
                  { 
                    name:'销售金额',
                    show: true
                  },
                  {
                    name:'销售数量',
                    show: true
                  }
                ],
                series : [
                  {
                    name:'销售金额',
                    data: OTAMoneyData
                  },
                  {
                    name:'销售数量',
                    data: OTACountData
                  }
                ]
              })  
            }
          } else if (data.rescode == 401) {
            alert('登录超时，请重新登录')
            $location.path('/index')
          } else {
            alert(data.errInfo)
          }
        }, function errorCallback(response) {
          self.pieChart.hideLoading()
          self.barChart.hideLoading();
          alert('加载失败，请重试')
        })
      }
    }
  ]);
    
  app.controller('ageRatioController', ['$filter', '$scope', '$http', '$cookies', '$location', '$window', 'NgTableParams',
    function($filter, $scope, $http, $cookies, $location, $window, NgTableParams) {
      console.log('ageRatio');
      var self = this;
      self.init = function () {
        $('.form_date').datetimepicker({
          language: 'zh-CN',
          weekStart: 1,
          todayBtn: 1,
          autoclose: 1,
          todayHighlight: 1,
          startView: 2,
          minView: 2,
          forceParse: 0,
          showMeridian: 1
        })
        self.activeIndex = 0
        self.initpartnerConfig()
        self.initPartnersList()
        self.myChart = echarts.init(document.getElementById('e-pie'))
        self.myChart.setOption({
          title: {
              text: '年龄段统计',
              left: 'center',             
              top: 20
          },
          series : [
              {
                  name: '年龄段统计',
                  label: {
                    normal: {
                      formatter: '{b}\n{c}人，{d}%\n',
                    }                    
                  },
                  type: 'pie',
                  radius: '45%',
                  data:[]
              }
          ]
        })
        self.search(false)
      }
      self.toggleLink = function (index) {
        self.activeIndex = index
        if (index === 0) {
          self.myChart.setOption({
                title: {
                  text: '年龄段统计',
                  x: 'center'                    
                },
                legend: {
                  type: 'scroll',
                  bottom: 10,
                  data: self.ageLegend
                },
                series : [
                  {
                    name: '年龄段统计',
                    data: self.sortByAge
                  }
                ]
              })      
        } else {
          self.myChart.setOption({
            title: {
              text: '年龄段统计',
              x: 'center'                    
            },
            legend: {
              type: 'scroll',
              bottom: 10,
              data: self.amountLegend
            },
            series : [
              {
                name: '年龄段统计',
                data: self.sortByAmount
              }
            ]
          })
        }
      }
      self.initpartnerConfig = function () {
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
        }
        data = JSON.stringify(data)
        $http.post(url, data).then(function successCallback(response) {
          var data = response.data;
          if (data.rescode === 200) {
            self.goods = data.goods.lists;
          } else if (data.rescode === 401) {
            alert('登录超时，请重新登录');
            $location.path('/index');
          } else {
            alert(data.errInfo);
          }  
        }, function errorCallback (response) {
          alert('读取商品信息失败，请刷新页面重试')
        })
      }

      self.initPartnersList = function () {
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
          } else if (data.rescode === 401) {
            alert('登录超时，请重新登录');
            $location.path('/index');
          } else {
            alert(data.errInfo);
          }  
        }, function errorCallback(response) {
          alert('读取分销商信息失败，请刷新页面重试');
        });
      }

      self.search = function (flag) {
        self.myChart.showLoading();
        var c = $scope.root.config;
        var url = c.requestUrl + '/statistics' + c.extension;
        if (flag) {
          //读取下单日期
          self.orderCreateDateStart = $('#rd_qcaxwa').val() ? self.timeToDate(new Date($('#rd_qcaxwa').val() + ' 00:00:00'),'yyyy-MM-dd HH:mm:ss') : '';
          self.orderCreateDateEnd = $('#rd_khaydt').val() ? self.timeToDate(new Date($('#rd_khaydt').val() + ' 23:59:59'),'yyyy-MM-dd HH:mm:ss') : '';
          self.goodsName = self.myGoods ? self.myGoods.goodsName : ''
          self.OTAName = self.myPartner ? self.myPartner.partnerName : ''   
        } else {
          var n = new Date()
          var d = new Date().getDate()
          $('#rd_khaydt').val(self.timeToDate(n,'yyyy-MM-dd'))
          $('#order-create-date-end').val(self.timeToDate(n,'yyyy-MM-dd'))          
          $('#rd_qcaxwa').val(self.timeToDate(n.setDate(d - 6),'yyyy-MM-dd'))                    
          $('#order-create-date-start').val(self.timeToDate(n,'yyyy-MM-dd'))
          self.orderCreateDateStart = $('#rd_qcaxwa').val() ? self.timeToDate(new Date($('#rd_qcaxwa').val() + ' 00:00:00'),'yyyy-MM-dd HH:mm:ss') : '';
          self.orderCreateDateEnd = $('#rd_khaydt').val() ? self.timeToDate(new Date($('#rd_khaydt').val() + ' 23:59:59'),'yyyy-MM-dd HH:mm:ss') : '';
          self.goodsName = "";
          self.OTAName = "";
        }
        var data = {
          "action": "AgeGroupStatistics",
          "token": $cookies.get('token'),
          "projectName": $cookies.get('projectName'),
          "search": {
            "OrderStartTime": self.orderCreateDateStart ? self.orderCreateDateStart + "" : "", //下单日期开始
            "OrderEndTime": self.orderCreateDateEnd ? self.orderCreateDateEnd + "" : "", //下单日期结束
            "GoodsName": self.goodsName,
            "OTAName": self.OTAName
          }
        }
        data = JSON.stringify(data);
        
        $http.post(url, data).then(function successCallback (response) {
          self.myChart.hideLoading();
          var data = response.data;
          if (data.rescode == 200) {
            if (data.AgeGroupStatus.length == 0) {
              self.showToggle = false
              self.ageRatioData = [];
              self.myChart.setOption({
                title: {
                    text: '无数据',
                    left: 30
                },
                series : [
                  {
                    name: '年龄段统计',
                    data: []
                  }
                ]
              })
            } else {
              self.showToggle = true
              self.sortByAge = data.AgeGroupStatus.concat()
              self.ageLegend = []
              self.sortByAge.forEach(function (item) {
                self.ageLegend.push(item.name)
              })
              self.sortByAmount = data.AgeGroupStatus.concat().sort(function(a,b){
                return (b.value - a.value)
              })
              self.amountLegend = []
              self.sortByAmount.forEach(function (item) {
                self.amountLegend.push(item.name)
              })
              self.toggleLink(self.activeIndex)
            }
          } else if (data.rescode == 401) {
            alert('登录超时，请重新登录');
            $location.path('/index');
          } else {
            alert(data.errInfo);
          }
        }, function errorCallback (response) {
          self.myChart.hideLoading();
          alert('加载失败，请重试');
        });
      }

      self.timeToDate = function (time,format) {
        var t = new Date(time);
        var tf = function(i){return (i < 10 ? '0' : '') + i};
        return format.replace(/yyyy|MM|dd|HH|mm|ss/g, function(a){
          switch (a) {
            case 'yyyy':
              return tf(t.getFullYear());
              break;
            case 'MM':
              return tf(t.getMonth() + 1);
              break;
            case 'mm':
              return tf(t.getMinutes());
              break;
            case 'dd':
              return tf(t.getDate());
              break;
            case 'HH':
              return tf(t.getHours());
              break;
            case 'ss':
              return tf(t.getSeconds());
              break;
          }
        })
      }      
    }
  ])
  
  app.controller('sexRatioController', ['$filter', '$scope', '$http', '$cookies', '$location', '$window', 'NgTableParams',
    function($filter, $scope, $http, $cookies, $location, $window, NgTableParams) {
      console.log('sexRatio');
      var self = this;
      self.init = function () {
        $('.form_date').datetimepicker({
          language: 'zh-CN',
          weekStart: 1,
          todayBtn: 1,
          autoclose: 1,
          todayHighlight: 1,
          startView: 2,
          minView: 2,
          forceParse: 0,
          showMeridian: 1
        })
        self.initpartnerConfig()
        self.initPartnersList()
        self.myChart = echarts.init(document.getElementById('e-pie'))
        self.myChart.setOption({
          title: {
              text: '客户性别统计',
              left: 'center',
              top: 20
          },
          legend: {
            data: []
          },
          series : [
              {
                  name: '客户性别统计',
                  label: {
                    normal: {
                      formatter: '{b}\n{c}人，{d}%\n',
                    }                    
                  },
                  type: 'pie',
                  radius: '55%',
                  data:[]
              }
          ]
        })
        self.search(false)
      }
      self.initpartnerConfig = function () {
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
        }
        data = JSON.stringify(data)
        $http.post(url, data).then(function successCallback(response) {
          var data = response.data;
          if (data.rescode === 200) {
            self.goods = data.goods.lists;
          } else if (data.rescode === 401) {
            alert('登录超时，请重新登录');
            $location.path('/index');
          } else {
            alert(data.errInfo);
          }  
        }, function errorCallback (response) {
          alert('读取商品信息失败，请刷新页面重试')
        })
      }

      self.initPartnersList = function () {
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
          } else if (data.rescode === 401) {
            alert('登录超时，请重新登录');
            $location.path('/index');
          } else {
            alert(data.errInfo);
          }  
        }, function errorCallback(response) {
          alert('读取分销商信息失败，请刷新页面重试');
        });
      }

      self.search = function (flag) {
        self.myChart.showLoading();
        var c = $scope.root.config;
        var url = c.requestUrl + '/statistics' + c.extension;
        if (flag) {
          //读取下单日期
          self.orderCreateDateStart = $('#rd_qcaxwa').val() ? self.timeToDate(new Date($('#rd_qcaxwa').val() + ' 00:00:00'),'yyyy-MM-dd HH:mm:ss') : '';
          self.orderCreateDateEnd = $('#rd_khaydt').val() ? self.timeToDate(new Date($('#rd_khaydt').val() + ' 23:59:59'),'yyyy-MM-dd HH:mm:ss') : '';
          self.goodsName = self.myGoods ? self.myGoods.goodsName : ''
          self.OTAName = self.myPartner ? self.myPartner.partnerName : ''   
        } else {
          var n = new Date()
          var d = new Date().getDate()
          $('#rd_khaydt').val(self.timeToDate(n,'yyyy-MM-dd'))
          $('#order-create-date-end').val(self.timeToDate(n,'yyyy-MM-dd'))          
          $('#rd_qcaxwa').val(self.timeToDate(n.setDate(d - 6),'yyyy-MM-dd'))                    
          $('#order-create-date-start').val(self.timeToDate(n,'yyyy-MM-dd'))
          self.orderCreateDateStart = $('#rd_qcaxwa').val() ? self.timeToDate(new Date($('#rd_qcaxwa').val() + ' 00:00:00'),'yyyy-MM-dd HH:mm:ss') : '';
          self.orderCreateDateEnd = $('#rd_khaydt').val() ? self.timeToDate(new Date($('#rd_khaydt').val() + ' 23:59:59'),'yyyy-MM-dd HH:mm:ss') : '';
          self.goodsName = "";
          self.OTAName = "";
        }
        var data = {
          "action": "CustomerSexStatistics",
          "token": $cookies.get('token'),
          "projectName": $cookies.get('projectName'),
          "search": {
            "OrderStartTime": self.orderCreateDateStart ? self.orderCreateDateStart + "" : "", //下单日期开始
            "OrderEndTime": self.orderCreateDateEnd ? self.orderCreateDateEnd + "" : "", //下单日期结束
            "GoodsName": self.goodsName,
            "OTAName": self.OTAName
          }
        }
        data = JSON.stringify(data);
        
        $http.post(url, data).then(function successCallback (response) {
          self.myChart.hideLoading();
          var data = response.data;
          if (data.rescode == 200) {
            if (data.OrderSexStatus.length == 0) {
              self.sexRatioData = [];
              self.myChart.setOption({
                title: {
                  text: '无数据',
                  left: 30
                },
                series: [
                  {
                    name: '客户性别统计',
                    data: []
                  }
                ]
              })
            } else {
              self.sexRatioData = data.OrderSexStatus
              // var legendList = []
              // self.sexRatioData.forEach(function (item) {
              //   legendList.push(item.name)
              // })
              self.myChart.setOption({
                title: {
                    text: '客户性别统计',
                    left: 'center',
                    top: 20
                },
                // legend: {
                //   data: legendList
                // },
                series : [
                  {
                    name: '客户性别统计',
                    data: self.sexRatioData
                  }
                ]
              })
            }
          } else if (data.rescode == 401) {
            alert('登录超时，请重新登录');
            $location.path('/index');
          } else {
            alert(data.errInfo);
          }
        }, function errorCallback (response) {
          self.myChart.hideLoading();
          alert('加载失败，请重试');
        });
      }

      self.timeToDate = function (time,format) {
        var t = new Date(time);
        var tf = function(i){return (i < 10 ? '0' : '') + i};
        return format.replace(/yyyy|MM|dd|HH|mm|ss/g, function(a){
          switch (a) {
            case 'yyyy':
              return tf(t.getFullYear());
              break;
            case 'MM':
              return tf(t.getMonth() + 1);
              break;
            case 'mm':
              return tf(t.getMinutes());
              break;
            case 'dd':
              return tf(t.getDate());
              break;
            case 'HH':
              return tf(t.getHours());
              break;
            case 'ss':
              return tf(t.getSeconds());
              break;
          }
        })
      }      
    }
  ])
  
  app.controller('provinceRatioController', ['$filter', '$scope', '$http', '$cookies', '$location', '$window', 'NgTableParams',
    function($filter, $scope, $http, $cookies, $location, $window, NgTableParams) {
      console.log('provinceRatio');
      var self = this;
      self.init = function () {
        $('.form_date').datetimepicker({
          language: 'zh-CN',
          weekStart: 1,
          todayBtn: 1,
          autoclose: 1,
          todayHighlight: 1,
          startView: 2,
          minView: 2,
          forceParse: 0,
          showMeridian: 1
        })
        self.initpartnerConfig()
        self.initPartnersList()
        self.myChart = echarts.init(document.getElementById('e-pie'))
        self.myChart.setOption({
          title: {
            text: '各省销售比例',
            left: 'center',
            top: 20
          },
          series : [
            {
              name: '各省销售比例',
              label: {
                normal: {
                  formatter: '{b}\n{c}张，{d}%\n',
                }                    
              },
              type: 'pie',
              radius: '55%',
              data:[]
            }
          ]
        })
        self.search(false)
      }
      self.initpartnerConfig = function () {
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
        }
        data = JSON.stringify(data)
        $http.post(url, data).then(function successCallback(response) {
          var data = response.data;
          if (data.rescode === 200) {
            self.goods = data.goods.lists;
          } else if (data.rescode === 401) {
            alert('登录超时，请重新登录');
            $location.path('/index');
          } else {
            alert(data.errInfo);
          }  
        }, function errorCallback (response) {
          alert('读取商品信息失败，请刷新页面重试')
        })
      }

      self.initPartnersList = function () {
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
          } else if (data.rescode === 401) {
            alert('登录超时，请重新登录');
            $location.path('/index');
          } else {
            alert(data.errInfo);
          }  
        }, function errorCallback(response) {
          alert('读取分销商信息失败，请刷新页面重试');
        });
      }

      self.search = function (flag) {
        self.myChart.showLoading();
        var c = $scope.root.config;
        var url = c.requestUrl + '/statistics' + c.extension;
        if (flag) {
          //读取下单日期
          self.orderCreateDateStart = $('#rd_qcaxwa').val() ? self.timeToDate(new Date($('#rd_qcaxwa').val() + ' 00:00:00'),'yyyy-MM-dd HH:mm:ss') : '';
          self.orderCreateDateEnd = $('#rd_khaydt').val() ? self.timeToDate(new Date($('#rd_khaydt').val() + ' 23:59:59'),'yyyy-MM-dd HH:mm:ss') : '';
          self.goodsName = self.myGoods ? self.myGoods.goodsName : ''
          self.OTAName = self.myPartner ? self.myPartner.partnerName : ''   
        } else {
          var n = new Date()
          var d = new Date().getDate()
          $('#rd_khaydt').val(self.timeToDate(n,'yyyy-MM-dd'))
          $('#order-create-date-end').val(self.timeToDate(n,'yyyy-MM-dd'))          
          $('#rd_qcaxwa').val(self.timeToDate(n.setDate(d - 6),'yyyy-MM-dd'))                    
          $('#order-create-date-start').val(self.timeToDate(n,'yyyy-MM-dd'))
          self.orderCreateDateStart = $('#rd_qcaxwa').val() ? self.timeToDate(new Date($('#rd_qcaxwa').val() + ' 00:00:00'),'yyyy-MM-dd HH:mm:ss') : '';
          self.orderCreateDateEnd = $('#rd_khaydt').val() ? self.timeToDate(new Date($('#rd_khaydt').val() + ' 23:59:59'),'yyyy-MM-dd HH:mm:ss') : '';
          self.goodsName = "";
          self.OTAName = "";
        }
        var data = {
          "action": "ProvinceStatistics",
          "token": $cookies.get('token'),
          "projectName": $cookies.get('projectName'),
          "search": {
            "OrderStartTime": self.orderCreateDateStart ? self.orderCreateDateStart + "" : "", //下单日期开始
            "OrderEndTime": self.orderCreateDateEnd ? self.orderCreateDateEnd + "" : "", //下单日期结束
            "GoodsName": self.goodsName,
            "OTAName": self.OTAName
          }
        }
        data = JSON.stringify(data);
        
        $http.post(url, data).then(function successCallback (response) {
          self.myChart.hideLoading();
          var data = response.data;
          if (data.rescode == 200) {
            if (data.ProvinceStatus.length == 0) {
              self.provinceRatioData = [];
              self.myChart.setOption({
                title: {
                    text: '无数据',
                    left: 30
                },
                series : [
                  {
                    name: '各省销售比例',
                    data: []
                  }
                ]
              })
            } else {
              self.provinceRatioData = data.ProvinceStatus
              self.provinceRatioData.sort((a,b) => {
                return (b.value - a.value)
              })
              var legendList = []
              self.provinceRatioData.forEach(function (item) {
                legendList.push(item.name)
              })
              self.myChart.setOption({
                title: {
                  text: '各省销售比例',
                  left: 'center',
                  top: 20
                },
                legend: {
                  type: 'scroll',
                  bottom: 10,
                  data: legendList
                },
                series : [
                  {
                    name: '各省销售比例',
                    data: self.provinceRatioData
                  }
                ]
              })
            }
          } else if (data.rescode == 401) {
            alert('登录超时，请重新登录');
            $location.path('/index');
          } else {
            alert(data.errInfo);
          }
        }, function errorCallback (response) {
          self.myChart.hideLoading();
          alert('加载失败，请重试');
        });
      }

      self.timeToDate = function (time,format) {
        var t = new Date(time);
        var tf = function(i){return (i < 10 ? '0' : '') + i};
        return format.replace(/yyyy|MM|dd|HH|mm|ss/g, function(a){
          switch (a) {
            case 'yyyy':
              return tf(t.getFullYear());
              break;
            case 'MM':
              return tf(t.getMonth() + 1);
              break;
            case 'mm':
              return tf(t.getMinutes());
              break;
            case 'dd':
              return tf(t.getDate());
              break;
            case 'HH':
              return tf(t.getHours());
              break;
            case 'ss':
              return tf(t.getSeconds());
              break;
          }
        })
      }      
    }
  ])
      
})()
