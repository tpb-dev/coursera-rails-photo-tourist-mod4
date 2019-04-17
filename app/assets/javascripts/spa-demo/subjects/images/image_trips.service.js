(function() {
  "use strict";

  angular
    .module("spa-demo.subjects")
    .factory("spa-demo.subjects.ImageTrip", ImageTrip);

  ImageTrip.$inject = ["$resource", "spa-demo.config.APP_CONFIG"];
  function ImageTrip($resource, APP_CONFIG) {
    return $resource(APP_CONFIG.server_url + "/api/images/:image_id/trip_images");
  }

})();