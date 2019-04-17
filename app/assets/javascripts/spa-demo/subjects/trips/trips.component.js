(function() {
  "use strict";

  angular
    .module("spa-demo.subjects")
    .component("sdTripEditor", {
      templateUrl: tripEditorTemplateUrl,
      controller: TripEditorController,
      bindings: {
        authz: "<"
      },
      require: {
        tripsAuthz: "^sdTripsAuthz"
      }
    })
    .component("sdTripSelector", {
      templateUrl: tripSelectorTemplateUrl,
      controller: TripSelectorController,
      bindings: {
        authz: "<"
      }
    })
    ;


  tripEditorTemplateUrl.$inject = ["spa-demo.config.APP_CONFIG"];
  function tripEditorTemplateUrl(APP_CONFIG) {
    return APP_CONFIG.trip_editor_html;
  }
  tripSelectorTemplateUrl.$inject = ["spa-demo.config.APP_CONFIG"];
  function tripSelectorTemplateUrl(APP_CONFIG) {
    return APP_CONFIG.trip_selector_html;
  }

  TripEditorController.$inject = ["$scope","$http", "$q",
                                   "$state","$stateParams",
                                   "spa-demo.authz.Authz",
                                   "spa-demo.subjects.Trip",
                                   "spa-demo.subjects.TripImage", "spa-demo.config.APP_CONFIG"];
  function TripEditorController($scope, $http, $q, $state, $stateParams,
                                 Authz, Trip, TripImage, APP_CONFIG) {
    var vm=this;
    vm.create = create;
    vm.clear  = clear;
    vm.update  = update;
    vm.remove  = remove;
    vm.haveDirtyLinks = haveDirtyLinks;
    vm.updateImageLinks = updateImageLinks;
    vm.createImage = createImage;
    vm.APP_CONFIG = APP_CONFIG;

    vm.$onInit = function() {
      //console.log("TripEditorController",$scope);
      $scope.$watch(function(){ return Authz.getAuthorizedUserId(); },
                    function(){
                      if ($stateParams.id) {
                        reload($stateParams.id);
                      } else {
                        newResource();
                      }
                    });
    }

    return;
    //////////////
    function newResource() {
      vm.item = new Trip();
      vm.tripsAuthz.newItem(vm.item);
      return vm.item;
    }

    function reload(tripId) {
      var itemId = tripId ? tripId : vm.item.id;
      //console.log("re/loading trip", itemId);
      vm.images = TripImage.query({trip_id:itemId});
      vm.item = Trip.get({id:itemId});
      vm.tripsAuthz.newItem(vm.item);
      vm.images.$promise.then(
        function(){
          angular.forEach(vm.images, function(ti){
            ti.originalPriority = ti.priority;
          });
        });
      $q.all([vm.item.$promise,vm.images.$promise]).catch(handleError);
    }
    function haveDirtyLinks() {
      for (var i=0; vm.images && i<vm.images.length; i++) {
        var ti=vm.images[i];
        if (ti.toRemove || ti.originalPriority != ti.priority) {
          return true;
        }
      }
      return false;
    }

    function create() {
      vm.item.errors = null;
      vm.item.$save().then(
        function(){
          //console.log("trip created", vm.item);
          $state.go(".",{id:vm.item.id});
        },
        handleError);
    }

    function createImage() {
        console.log("murrell4");
        //alert("gg4");
        var tripId = vm.item.id;
        console.log("murrell3");
        //alert("gg3");

        var reader = new FileReader();
        var dataContent = null;

        reader.onload = function(e) {
            dataContent = reader.result;

            var cc = function getContentFromDataUri(dataUri) {
                if (!dataUri) { return null; }

                //data:image/jpeg;base64,SGVsbG8sIFdvcmxkIQ%3D%3D
                var splitDataUri = dataUri.split(',');
                if (splitDataUri.length < 2 || splitDataUri[0].indexOf(';base64')<0) {
                    return null;
                }

                var re = /^data:(.+);/;
                var image_content={}
                image_content.content_type=re.exec(splitDataUri[0])[1];
                image_content.content=splitDataUri[1];
                return image_content;
            }

            dataContent = cc(dataContent);

            var jason = {"caption": "11", "image_content":dataContent};

            console.log("murrell2");
            //alert("gg2");

            $http.post(vm.APP_CONFIG.server_url + "/api/images/", jason).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available
                console.log("here")
                if(response.status == 201) {
                    var imageId = response.data.id;
                    var jasonpeng = {"image_id":imageId, trip_id:tripId, priority:1, creator_id:1, created_at:Date.now(), updated_at:Date.now()};
                    $http.post(vm.APP_CONFIG.server_url + "/api/images/" + imageId + "/trip_images/", jasonpeng).then(function sucCall(resp) {
                        // this callback will be called asynchronously
                        // when the response is available
                        console.log("succeeded image + trip_image creation");
                        location.reload();
                    }, function errorCallback(resp) {
                        // called asynchronously if an error occurs
                        // or server returns response with an error status.
                        console.log("succeeded image creation but failed at trip_image creation");
                    });
                }
            }, function errorCallback(response) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
            });
            //On success of previous post, make a post to trip_images. then reload page to show all trip related images
        }

        reader.readAsDataURL($('#blah2').prop("files")[0]);

        // var jason = {"caption": "11", "image_content":{"content_type":"image/jpeg","content":$("#blah2").prop("files")}};
        //alert("gg0");
        console.log("murrell");
    }

    function clear() {
      newResource();
      $state.go(".",{id: null});
    }

    function update() {
      vm.item.errors = null;
      var update=vm.item.$update();
      updateImageLinks(update);
    }
    function updateImageLinks(promise) {
      //console.log("updating links to images");
      var promises = [];
      if (promise) { promises.push(promise); }
      angular.forEach(vm.images, function(ti){
        if (ti.toRemove) {
          promises.push(ti.$remove());
        } else if (ti.originalPriority != ti.priority) {
          promises.push(ti.$update());
        }
      });

      //console.log("waiting for promises", promises);
      $q.all(promises).then(
        function(response){
          //console.log("promise.all response", response);
          //update button will be disabled when not $dirty
          $scope.tripform.$setPristine();
          reload();
        },
        handleError);
    }

    function remove() {
      vm.item.$remove().then(
        function(){
          //console.log("trip.removed", vm.item);
          clear();
        },
        handleError);
    }

    function handleError(response) {
      console.log("error", response);
      if (response.data) {
        vm.item["errors"]=response.data.errors;
      }
      if (!vm.item.errors) {
        vm.item["errors"]={}
        vm.item["errors"]["full_messages"]=[response];
      }
      $scope.tripform.$setPristine();
    }
  }

  TripSelectorController.$inject = ["$scope",
                                     "$stateParams",
                                     "spa-demo.authz.Authz",
                                     "spa-demo.subjects.Trip"];
  function TripSelectorController($scope, $stateParams, Authz, Trip) {
    var vm=this;

    vm.$onInit = function() {
      console.log("TripSelectorController",$scope);
      $scope.$watch(function(){ return Authz.getAuthorizedUserId(); },
                    function(){
                      if (!$stateParams.id) {
                        vm.items = Trip.query();
                      }
                    });
    }
    return;
    //////////////
  }

})();
