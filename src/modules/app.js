'use strict';

(function() {
  var app = angular.module('xt-ticket', [
    'ui.router',
    'app.controllers'
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
      .state('productsList', {
        url: '/productsList',
        views: {
          '': {
            templateUrl: 'pages/main.html'
          },
          'mainFrame.body@productsList': {
            templateUrl: 'pages/productsList.html'
          }
        }
      })
      .state('productAdd', {
        url: '/productAdd',
        views: {
          '': {
            templateUrl: 'pages/main.html'
          },
          'mainFrame.body@productAdd': {
            templateUrl: 'pages/productAdd.html'
          }
        }
      })
      .state('productEdit', {
        url: '/productEdit/{id:[0-9]{1,4}}',
        views: {
          '': {
            templateUrl: 'pages/main.html'
          },
          'mainFrame.body@productEdit': {
            templateUrl: 'pages/productEdit.html'
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
        url: '/saleEdit',
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
  });

  var config = {
    requestUrl: '/xitang-ticket/src/api',
    extension: '.json'
  };

})();