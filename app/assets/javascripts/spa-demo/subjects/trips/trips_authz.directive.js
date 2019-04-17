(function() {
  "use strict";

  angular
    .module("spa-demo.subjects")
    .directive("sdTripsAuthz", TripsAuthzDirective);

  TripsAuthzDirective.$inject = [];

  function TripsAuthzDirective() {
    var directive = {
        bindToController: true,
        controller: TripAuthzController,
        controllerAs: "vm",
        restrict: "A",
        link: link
    };
    return directive;

    function link(scope, element, attrs) {
      //console.log("TripsAuthzDirective", scope);
    }
  }

  TripAuthzController.$inject = ["$scope", 
                                  "spa-demo.subjects.TripsAuthz"];
  function TripAuthzController($scope, TripsAuthz) {
    var vm = this;
    vm.authz={};
    vm.authz.canUpdateItem = canUpdateItem;
    vm.newItem=newItem;

    activate();
    return;
    ////////////
    function activate() {
      vm.newItem(null);
    }

    function newItem(item) {
      TripsAuthz.getAuthorizedUser().then(
        function(user){ authzUserItem(item, user); },
        function(user){ authzUserItem(item, user); });
    }

    function authzUserItem(item, user) {
      //console.log("new Item/Authz", item, user);

      vm.authz.authenticated = TripsAuthz.isAuthenticated();
      vm.authz.canQuery      = TripsAuthz.canQuery();
      vm.authz.canCreate     = TripsAuthz.canCreate();
      vm.authz.canAddImage   = TripsAuthz.canAddImage();
      if (item && item.$promise) {
        vm.authz.canUpdate      = false;
        vm.authz.canDelete      = false;
        vm.authz.canGetDetails  = false;
        vm.authz.canUpdateImage = false;
        vm.authz.canRemoveImage = false;      
        item.$promise.then(function(){ checkAccess(item); });
      } else {
        checkAccess(item);
      }      
    }

    function checkAccess(item) {
      vm.authz.canUpdate     = TripsAuthz.canUpdate(item);
      vm.authz.canDelete     = TripsAuthz.canDelete(item);
      vm.authz.canGetDetails = TripsAuthz.canGetDetails(item);
      vm.authz.canUpdateImage = TripsAuthz.canUpdateImage(item);
      vm.authz.canRemoveImage = TripsAuthz.canRemoveImage(item);      
      //console.log("checkAccess", item, vm.authz);
      vm.authz.canAddImage   = TripsAuthz.canAddImage(item);
    }

    function canUpdateItem(item) {
      return TripsAuthz.canUpdate(item);
    }    
  }
})();
