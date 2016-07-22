'use strict';

(function() {
  var app = angular.module('app.filters', [ ]);
  app.filter('isExpired', function() {
    return function(input) {
      var ret = "";
      switch (input){
        case 'yes':
          ret = '已过期';
          break;
        case 'no':
          ret = '未过期';
          break;
      }
      return ret;
    }
  });

})();