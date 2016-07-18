'use strict';

(function() {
  var app = angular.module('xt-ticket', [
    'ui.router',
    'app.login',
    'app.saleCodeList',
    'app.saleCodeAdd',
    'app.saleCodeUpdate'
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
          },
          'mainFrame.body@main': {
            templateUrl: 'pages/ordersList.html'
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
  });

  app.controller('RootController', function() {
    this.config = config;
  });

  var config = {
    requestUrl: 'http://xxx.xxx.xxx.xx'
  };

})();