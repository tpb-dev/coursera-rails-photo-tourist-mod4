(function() {
  "use strict";

  angular
    .module("spa-demo.subjects")
    .component("sdCurrentTrips", {
      templateUrl: tripsTemplateUrl,
      controller: CurrentTripsController,
    })
    .component("sdCurrentTripInfo", {
      templateUrl: tripInfoTemplateUrl,
      controller: CurrentTripInfoController,
    })
    ;

  tripsTemplateUrl.$inject = ["spa-demo.config.APP_CONFIG"];
  function tripsTemplateUrl(APP_CONFIG) {
    return APP_CONFIG.current_trips_html;
  }    
  tripInfoTemplateUrl.$inject = ["spa-demo.config.APP_CONFIG"];
  function tripInfoTemplateUrl(APP_CONFIG) {
    return APP_CONFIG.current_trip_info_html;
  }    

  CurrentTripsController.$inject = ["$scope",
                                     "spa-demo.subjects.currentSubjects"];
  function CurrentTripsController($scope,currentSubjects) {
    var vm=this;
    vm.tripClicked = tripClicked;
    vm.isCurrentTrip = currentSubjects.isCurrentTripIndex;

    vm.$onInit = function() {
      console.log("CurrentTripsController",$scope);
    }
    vm.$postLink = function() {
      $scope.$watch(
        function() { return currentSubjects.getTrips(); }, 
        function(trips) { vm.trips = trips; }
      );
    }    
    return;
    //////////////
    function tripClicked(index) {
      currentSubjects.setCurrentTrip(index);
    }    
  }

  CurrentTripInfoController.$inject = ["$scope",
                                        "spa-demo.subjects.currentSubjects",
                                        "spa-demo.subjects.Trip",
                                        "spa-demo.authz.Authz"];
  function CurrentTripInfoController($scope,currentSubjects, Trip, Authz) {
    var vm=this;
    vm.nextTrip = currentSubjects.nextTrip;
    vm.previousTrip = currentSubjects.previousTrip;

    vm.$onInit = function() {
      console.log("CurrentTripInfoController",$scope);
    }
    vm.$postLink = function() {
      $scope.$watch(
        function() { return currentSubjects.getCurrentTrip(); }, 
        newTrip 
      );
      $scope.$watch(
        function() { return Authz.getAuthorizedUserId(); },
        function() { newTrip(currentSubjects.getCurrentTrip()); }
      );        
    }    
    return;
    //////////////
    function newTrip(link) {
      vm.link = link; 
      vm.trip = null;
      if (link && link.trip_id) {
        vm.trip=Trip.get({id:link.trip_id});
      }
    }







  }
})();
