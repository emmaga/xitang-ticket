'use strict';

(function() {
  var app = angular.module('xt-ticket', [
    'ui.router',
    'app.controllers',
    'app.directive',
    'app.filters',
    'app.services',
    'ng-fusioncharts'
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
      .state('partnerAdd', {
        url: '/partnerAdd',
        views: {
          '': {
            templateUrl: 'pages/main.html'
          },
          'mainFrame.body@partnerAdd': {
            templateUrl: 'pages/partnerAdd.html'
          }
        }
      })
      .state('partnerEdit', {
        url: '/partnerEdit/{id}',
        views: {
          '': {
            templateUrl: 'pages/main.html'
          },
          'mainFrame.body@partnerEdit': {
            templateUrl: 'pages/partnerEdit.html'
          }
        }
      })
      .state('partnerBalanceEdit', {
        url: '/partnerBalanceEdit/{id}',
        views: {
          '': {
            templateUrl: 'pages/main.html'
          },
          'mainFrame.body@partnerBalanceEdit': {
            templateUrl: 'pages/partnerBalanceEdit.html'
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
      .state('checkTourist', {
          url: '/checkTourist',
          views: {
              '': {
                  templateUrl: 'pages/main.html'
              },
              'mainFrame.body@checkTourist': {
                  templateUrl: 'pages/checkTourist.html'
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
      .state('updateVisitStatement', {
        url: '/updateVisitStatement',
        views: {
          '': {
            templateUrl: 'pages/main.html'
          },
          'mainFrame.body@updateVisitStatement': {
            templateUrl: 'pages/updateVisitStatement.html'
          }
        }
      })
      .state('exportBookerDetailStatement', {
        url: '/exportBookerDetailStatement',
        views: {
          '': {
            templateUrl: 'pages/main.html'
          },
          'mainFrame.body@exportBookerDetailStatement': {
            templateUrl: 'pages/exportBookerDetailStatement.html'
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
      .state('ordersCharts',{
        url:'/ordersCharts',
        views:{
          '':{
            templateUrl:'pages/main.html'
          },
          'mainFrame.body@ordersCharts':{
            templateUrl:'pages/ordersCharts.html'
          }
        }
      })
      .state('monthlySales', {
          url: '/monthlySales',
          views: {
              '': {
                  templateUrl: 'pages/main.html'
              },
              'mainFrame.body@monthlySales': {
                  templateUrl: 'pages/monthlySales.html'
              }
          }
      })
      .state('goodsRate', {
          url: '/goodsRate',
          views: {
              '': {
                  templateUrl: 'pages/main.html'
              },
              'mainFrame.body@goodsRate': {
                  templateUrl: 'pages/goodsRate.html'
              }
          }
      })
      .state('yearlySales', {
          url: '/yearlySales',
          views: {
              '': {
                  templateUrl: 'pages/main.html'
              },
              'mainFrame.body@yearlySales': {
                  templateUrl: 'pages/yearlySales.html'
              }
          }
      })
      .state('ageRatio', {
          url: '/ageRatio',
          views: {
              '': {
                  templateUrl: 'pages/main.html'
              },
              'mainFrame.body@ageRatio': {
                  templateUrl: 'pages/ageRatio.html'
              }
          }
      })
      .state('provinceRatio', {
          url: '/provinceRatio',
          views: {
              '': {
                  templateUrl: 'pages/main.html'
              },
              'mainFrame.body@provinceRatio': {
                  templateUrl: 'pages/provinceRatio.html'
              }
          }
      })
      .state('sexRatio', {
          url: '/sexRatio',
          views: {
              '': {
                  templateUrl: 'pages/main.html'
              },
              'mainFrame.body@sexRatio': {
                  templateUrl: 'pages/sexRatio.html'
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
    // requestUrl: '/xitang-ticket/src/api',
    // extension: '.json'

    // requestUrl: 'http://ota.cleartv.cn/ota_backend/v1/',
    // requestUrl: 'http://192.168.30.80/ota_backend/v1/',
    requestUrl: 'http://otatest.cleartv.cn/ota_backend/v1/',
    extension: ''
  };

})();