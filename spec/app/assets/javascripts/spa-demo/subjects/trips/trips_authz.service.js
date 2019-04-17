(function() {
  "use strict";

  angular
    .module("spa-demo.subjects")
    .factory("spa-demo.subjects.TripsAuthz", TripsAuthzFactory);

  TripsAuthzFactory.$inject = ["spa-demo.authz.Authz",
                                "spa-demo.authz.BasePolicy"];
  function TripsAuthzFactory(Authz, BasePolicy) {
    function TripsAuthz() {
      BasePolicy.call(this, "Trip");
    }
      //start with base class prototype definitions
    TripsAuthz.prototype = Object.create(BasePolicy.prototype);
    TripsAuthz.constructor = TripsAuthz;


      //override and add additional methods
    TripsAuthz.prototype.canQuery=function() {
      console.log("TripsAuthz.canQuery" + Authz.isAuthenticated());
      return Authz.isAuthenticated();
    };

      //add custom definitions
    TripsAuthz.prototype.canAddImage=function(trip) {
        return Authz.isMember(trip);
    };
    TripsAuthz.prototype.canUpdateImage=function(trip) {
        return Authz.isOrganizer(trip)
    };
    TripsAuthz.prototype.canRemoveImage=function(trip) {
        return Authz.isOrganizer(trip) || Authz.isAdmin();
    };
    TripsAuthz.prototype.canCreate=function() {
        console.log("L")
      return Authz.isOriginator("Trip")
    };
    
    return new TripsAuthz();
  }
})();