'use strict';

(function() {
  var app = angular.module('app.saleCodeList', ['ngTable', 'ngResource']);

  app.controller('saleCodeListController', ['$scope', 'NgTableParams', '$resource',  
    function($scope, NgTableParams, $resource) {
      // console.log($scope.root.config.requestUrl);

      var self = this;
      
      // checkbox
      self.checkboxes = { 'checked': false, items: {} };
      
      // watch for check all checkbox
      $scope.$watch('saleCodeList.checkboxes.checked', function(value) {
          angular.forEach(self.tableData, function(item) {
              if (angular.isDefined(item.id)) {
                self.checkboxes.items[item.id] = value;
              }
          });
      });

      // ngtable
      self.search = function() {
        self.loading = true;
        self.initTable();
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
              if (self.searchName) {
                paramsUrl.searchName = self.searchName;
              }
              return $resource('api/saleCodeList.php').query(paramsUrl).$promise.then(function(result){
                self.loading = false;
                params.total(30);
                self.tableData = result;
                return result;
              });
            }
          }
        );
      }

      // initTable
      self.initTable = function() {

        // checkbox
        self.checkboxes = { 'checked': false, items: {} };
      }

    }
  ]);
})();