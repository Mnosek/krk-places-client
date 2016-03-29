function PlacesViewModel() {
    var self = this;

    self.apiURI                 = 'http://api.krk-places.local/places';
    self.places                 = ko.observableArray([]);
    self.currentLocationChecked = ko.observable();
    self.searchName             = ko.observable();
    self.markers                = [];
    self.placeDetails           = ko.observable({});
    self.reviews                = ko.observableArray([]);

    initMap = function() {
       self.mapDiv = document.getElementById('map');
       self.map = new google.maps.Map(self.mapDiv, {
         center: {lat: 50.0616969, lng: 19.9368018},
         zoom: 15
       });
     }

     if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position){
                self.currentLocation = position.coords.latitude + ','
                                     + position.coords.longitude;
                $( "#currentLocationCheckbox" ).css( "display", "block" );
            });
     } else {
            alert("Geolocation is not supported by your browser.");
     }

     //avoid map resizing problems
     $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
         google.maps.event.trigger(self.map, "resize");
     });

     $('#inputSearch').keyup(function (e) {
         if (e.which == 13) {
             self.search();
         }
     });


    self.ajax = function(uri, method, data) {
        var request = {
            url:         uri,
            type:        method,
            contentType: "application/json",
            accepts:     "application/json",
            contentType: false,
            processData: true,
            data:        data,
            error: function(jqXHR) {
                alert(self.getErrorMsg(jqXHR.status));
            }
        };

        return $.ajax(request);
    }


    self.search = function() {
        var params = {}

        if (self.currentLocationChecked()) {
            params.location = self.currentLocation;
        }

        if (self.searchName()) {
            params.keyword = self.searchName();
        }

        self.deleteMarkers();
        $('#mapTabBtn').tab('show');


        self.ajax(self.apiURI, 'GET', params).done(function(data) {
            for (var i = 0; i < data.length; i++) {
                self.addMarker(data[i]);
            }
            self.places(data);
            self.setMapOnAll(self.map);

        }).fail(function(jqXHR) {
            // noop
        });
    }


    self.addMarker = function(place) {
        var location = { lat: place.lat, lng: place.lng}
        var marker   = new google.maps.Marker({
            position: location,
            title:    place.name,
            map:      self.map
        });
        self.markers.push(marker);
        marker.addListener('click', function() {
            self.getDetails(place.place_id);
        });
    }


    self.setMapOnAll = function(map) {
        var bounds = new google.maps.LatLngBounds();
        for (var i = 0; i < self.markers.length; i++) {
            self.markers[i].setMap(map);
            bounds.extend(self.markers[i].getPosition());
        }

        if (map) {
            map.fitBounds(bounds);
            map.setCenter(bounds.getCenter());
        }
    }


    self.clearMarkers = function() {
      self.setMapOnAll(null);
    }


    self.showMarkers = function() {
      self.setMapOnAll(self.map);
    }


    self.deleteMarkers = function() {
      self.clearMarkers();
      self.markers = [];
    }


    self.getDetails = function(place_id) {
        var uri = self.apiURI + '/s/' + place_id;

        self.ajax(uri, 'GET').done(function(data) {
            $('#detailsTabBtn').tab('show');
            self.placeDetails(data);
            self.reviews(data.reviews);
        }).fail(function(jqXHR) {
            // noop
        });
    }


    self.getErrorMsg = function(code) {
        if (code == 204) {
            return 'Sorry, no results. Try again with different params';
        } else {
            return 'Oups! Api error occured: ' + code;
        }
    };
}

var placesViewModel = new PlacesViewModel();
ko.applyBindings(placesViewModel, $('#main')[0]);
