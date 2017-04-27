'use strict';

(function() {
  var app = angular.module('app.services', [ ]);
  
  app.service('auth', function() {
    return function(roleId, authName) {
      
      //roleId 1:超级管理员 2:票务
      //auth orders, goods, statement, admin
      var ret = false;
      
      if(roleId == 1) {
        ret = true;
      }
      else if( roleId == 2 && (authName =="orders"  || authName == "statement" || authName == "personal") ) {
        ret = true;
      }

      return ret;
    };
  });

})();