(function() {
  "use strict";

  angular
    .module("spa-demo.subjects")
    .factory("spa-demo.subjects.TripImage", TripImage);

  TripImage.$inject = ["$resource", "spa-demo.config.APP_CONFIG"];
  function TripImage($resource, APP_CONFIG) {
    return $resource(APP_CONFIG.server_url + "/api/trips/:trip_id/trip_images/:id",
      { trip_id: '@trip_id',
        id: '@id'},
      { update: {method:"PUT"} 
      });
  }

})();