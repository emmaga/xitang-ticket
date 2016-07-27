'use strict';

(function() {
  var app = angular.module('xt-ticket', [
    'ui.router',
    'app.controllers',
    'app.directive',
    'app.filters'
  ]);

  app.config(function($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/index');
    $stateProvider
      .state('index', {
        url: '/index',
        templateUrl: 'pages/login.html'
      })
      .state('main', {
        url: '/main',
        views: {
          '': {
            templateUrl: 'pages/main.html'
          }
        }
      })
      .state('personalInfo', {
        url: '/personalInfo',
        views: {
          '': {
            templateUrl: 'pages/main.html'
          },
          'mainFrame.body@personalInfo': {
            templateUrl: 'pages/personalInfo.html'
          }
        }
      })
      .state('personalPasswordEdit', {
        url: '/personalPasswordEdit',
        views: {
          '': {
            templateUrl: 'pages/main.html'
          },
          'mainFrame.body@personalPasswordEdit': {
            templateUrl: 'pages/personalPasswordEdit.html'
          }
        }
      })
      .state('ordersList', {
        url: '/ordersList',
        views: {
          '': {
            templateUrl: 'pages/main.html'
          },
          'mainFrame.body@ordersList': {
            templateUrl: 'pages/ordersList.html'
          }
        }
      })
      .state('toBeChecked', {
        url: '/toBeChecked',
        views: {
          '': {
            templateUrl: 'pages/main.html'
          },
          'mainFrame.body@toBeChecked': {
            templateUrl: 'pages/toBeChecked.html'
          }
        }
      })
      .state('goodsList', {
        url: '/goodsList',
        views: {
          '': {
            templateUrl: 'pages/main.html'
          },
          'mainFrame.body@goodsList': {
            templateUrl: 'pages/goodsList.html'
          }
        }
      })
      .state('goodsAdd', {
        url: '/goodsAdd',
        views: {
          '': {
            templateUrl: 'pages/main.html'
          },
          'mainFrame.body@goodsAdd': {
            templateUrl: 'pages/goodsAdd.html'
          }
        }
      })
      .state('goodsEdit', {
        url: '/goodsEdit/{id:[0-9]{1,4}}',
        views: {
          '': {
            templateUrl: 'pages/main.html'
          },
          'mainFrame.body@goodsEdit': {
            templateUrl: 'pages/goodsEdit.html'
          }
        }
      })
      .state('saleList', {
        url: '/saleList',
        views: {
          '': {
            templateUrl: 'pages/main.html'
          },
          'mainFrame.body@saleList': {
            templateUrl: 'pages/saleList.html'
          }
        }
      })
      .state('saleAdd', {
        url: '/saleAdd',
        views: {
          '': {
            templateUrl: 'pages/main.html'
          },
          'mainFrame.body@saleAdd': {
            templateUrl: 'pages/saleAdd.html'
          }
        }
      })
      .state('saleEdit', {
        url: '/saleEdit/{id:[0-9]{1,4}}',
        views: {
          '': {
            templateUrl: 'pages/main.html'
          },
          'mainFrame.body@saleEdit': {
            templateUrl: 'pages/saleEdit.html'
          }
        }
      })
      .state('partnerConfig', {
        url: '/partnerConfig',
        views: {
          '': {
            templateUrl: 'pages/main.html'
          },
          'mainFrame.body@partnerConfig': {
            templateUrl: 'pages/partnerConfig.html'
          }
        }
      })
      .state('checkStatement', {
        url: '/checkStatement',
        views: {
          '': {
            templateUrl: 'pages/main.html'
          },
          'mainFrame.body@checkStatement': {
            templateUrl: 'pages/checkStatement.html'
          }
        }
      })
      .state('operatingStatement', {
        url: '/operatingStatement',
        views: {
          '': {
            templateUrl: 'pages/main.html'
          },
          'mainFrame.body@operatingStatement': {
            templateUrl: 'pages/operatingStatement.html'
          }
        }
      })
      .state('checkDetailStatement', {
        url: '/checkDetailStatement',
        views: {
          '': {
            templateUrl: 'pages/main.html'
          },
          'mainFrame.body@checkDetailStatement': {
            templateUrl: 'pages/checkDetailStatement.html'
          }
        }
      })
      .state('exportStatementsList', {
        url: '/exportStatementsList',
        views: {
          '': {
            templateUrl: 'pages/main.html'
          },
          'mainFrame.body@exportStatementsList': {
            templateUrl: 'pages/exportStatementsList.html'
          }
        }
      })
      .state('userList', {
        url: '/userList',
        views: {
          '': {
            templateUrl: 'pages/main.html'
          },
          'mainFrame.body@userList': {
            templateUrl: 'pages/userList.html'
          }
        }
      })
      .state('userAdd', {
        url: '/userAdd',
        views: {
          '': {
            templateUrl: 'pages/main.html'
          },
          'mainFrame.body@userAdd': {
            templateUrl: 'pages/userAdd.html'
          }
        }
      })
      .state('userEdit', {
        url: '/userEdit/{id:[0-9]{1,4}}',
        views: {
          '': {
            templateUrl: 'pages/main.html'
          },
          'mainFrame.body@userEdit': {
            templateUrl: 'pages/userEdit.html'
          }
        }
      })
      .state('userPasswordReset', {
        url: '/userPasswordReset/{id:[0-9]{1,4}}',
        views: {
          '': {
            templateUrl: 'pages/main.html'
          },
          'mainFrame.body@userPasswordReset': {
            templateUrl: 'pages/userPasswordReset.html'
          }
        }
      })
      .state('applyRoles', {
        url: '/applyRoles',
        views: {
          '': {
            templateUrl: 'pages/main.html'
          },
          'mainFrame.body@applyRoles': {
            templateUrl: 'pages/applyRoles.html'
          }
        }
      })
  });

  app.controller('RootController', function() {
    this.config = config;
    this.coverUrl = '';
    this.coverParamId = '';
  });

  var config = {
    requestUrl: '/xitang-ticket/src/api',
    extension: '.json'
  };

})();