import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './main.html';

this.mapsHelpers = {
  clusterer : null,
  infowindow : null,
  icons : [],
  days : ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'],
  searchMarkers : [],

  initialize : function () {
    var self = this;

    var pinColor = "73a9fa";
    var pinImage = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + pinColor,
      new google.maps.Size(21, 34),
      new google.maps.Point(0,0),
      new google.maps.Point(10, 34));
    
    self.icons.push(pinImage);

    var pinColor = "98ff3d";
    var pinImage = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + pinColor,
      new google.maps.Size(21, 34),
      new google.maps.Point(0,0),
      new google.maps.Point(10, 34));
    
    self.icons.push(pinImage);

    var pinColor = "ff854d";
    var pinImage = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + pinColor,
      new google.maps.Size(21, 34),
      new google.maps.Point(0,0),
      new google.maps.Point(10, 34));
    
    self.icons.push(pinImage);

    self.clusterer = new MarkerClusterer(GoogleMaps.maps.placesMap.instance, [], {
      maxZoom : 18
    });
  },

  addSearchBox : function (map) {
    var self = this;

    var container = document.getElementById('add-address');
    var input = document.getElementById('pac-input');
    var searchBox = new google.maps.places.SearchBox(input);
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(container);

    google.maps.event.addListener(map, 'bounds_changed', function() {
      var bounds = map.getBounds();
      searchBox.setBounds(bounds);
    });

    // Listen for the event fired when the user selects a prediction and retrieve
    // more details for that place.
    searchBox.addListener('places_changed', function() {
      var places = searchBox.getPlaces();

      if (places.length == 0) {
        return;
      }

      self.removeSearchMarkers();

      // For each place, get the icon, name and location.
      var bounds = new google.maps.LatLngBounds();
      places.forEach(function(place) {
        var icon = {
          url: place.icon,
          size: new google.maps.Size(71, 71),
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(17, 34),
          scaledSize: new google.maps.Size(25, 25)
        };

        // Create a marker for each place.
        self.searchMarkers.push(new google.maps.Marker({
          map: map,
          icon: icon,
          title: place.name,
          position: place.geometry.location,
          draggable : true
        }));

        if (place.geometry.viewport) {
          // Only geocodes have viewport.
          bounds.union(place.geometry.viewport);
        } else {
          bounds.extend(place.geometry.location);
        }
      });

      if (self.searchMarkers.length > 0) {
        $('.btn-add-place').prop('disabled', false);
        $('.btn-cancel-place').prop('disabled', false);
      }
      map.fitBounds(bounds);
    });
  },

  removeSearchMarkers : function () {
    var self = this;
    // Clear out the old markers.
    self.searchMarkers.forEach(function(marker) {
      marker.setMap(null);
    });
    self.searchMarkers = [];
  },

  setCurrentZone : function () {
    if (navigator && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(location) {
        if (location && location.coords) {
          GoogleMaps.maps.placesMap.instance.setCenter({
            lat: location.coords.latitude, 
            lng: location.coords.longitude
          });
          GoogleMaps.maps.placesMap.instance.setZoom(16);
        }
      });
    }
  },

  updateInfoWindow : function (data) {
    var self = this;

    var workingHours = '';
    if (data.WorkingHours) {
      var jointDays = _.map(data.WorkingHours, function (wd) {
        return _.map(wd.Days, function (d) {
          return self.days[d]
        }).join(', ') + ' ' + wd.StartHour + ' - ' + wd.EndHour
      });
      workingHours = jointDays.join(' / ');
    }

    var prices = '';
    if (data.Prices) {
      var jointTrs = _.map(data.Prices, function (p) {
        return '<tr><td>' + p.Minutes + ' minutes</td>' +
          '<td>$' + p.Price + '</td>' +
          (p.NotIncluded ? '<td>' + p.NotIncluded.join(', ') + ' not included</td>' : '') +
          (p.Additional ? '<td>Additional : ' + p.Additional.join(', ') + '</td>' : '') +
          '</tr>';
      });
      if (jointTrs.length > 0) {
        prices = '<table>' + jointTrs.join('') + '</table>';
      }
    }

    var contentString = '<div id="content">'+
      '<h3 id="firstHeading" class="firstHeading">' + data.Name + '</h3>'+
      '<div id="bodyContent">'+
      '<table class="table table-bordered">' +
      (data.Address ? '<tr><td>Address</td><td>'+ data.Address + '</td></tr>' : '') +
      (data.Phones && data.Phones.length > 0 ? '<tr><td>Phones</td><td>'+ data.Phones.join(' / ') + '</td></tr>' : '') +
      (data.Notes ? '<tr><td>Notes</td><td>'+ data.Notes + '</td></tr>' : '') +
      (workingHours != '' ? '<tr><td>Working Hours</td><td>'+ workingHours + '</td></tr>' : '') +
      (prices != '' ? '<tr><td>Prices</td><td>'+ prices + '</td></tr>' : '') +
      '</table>' +
      '</div>';

    self.infowindow.setContent(contentString);
  },

  createMarker : function (bounds, map, item) {
    var self = this;
    var coords = item.Gps.geometry.coordinates;
    var latLng = new google.maps.LatLng(coords[0],coords[1]);
    var marker = new google.maps.Marker({
      position: latLng,
      map: map.instance,
      title: item.Name,
      icon : self.icons[self.getPinIndex(item)]
    });
    bounds.extend(latLng);
    map.instance.fitBounds(bounds);
    marker.addListener('click', function() {
      self.updateInfoWindow(item);
      self.infowindow.open(map, marker);
    });

    self.clusterer.addMarker(marker);
  },

  getPinIndex : function (item) {
    if (item.WorkingHours) {
      var open = false;
      var now = new Date();
      var day = now.getDay() - 1;
      var hour = now.getHours();
      var minute = now.getMinutes();
      for (var i = 0; i < item.WorkingHours.length; i++) {
        var workingHour = item.WorkingHours[i];
        if (workingHour.Days.indexOf(day)) {
          if (workingHour.StartHour && workingHour.EndHour) {
            var startHour = parseInt(workingHour.StartHour.split(':')[0]);
            var startMinute = parseInt(workingHour.StartHour.split(':')[1]);
            var endHour = parseInt(workingHour.EndHour.split(':')[0]);
            var endMinute = parseInt(workingHour.EndHour.split(':')[1]);
            if ((hour > startHour) || (hour == startHour && minute >= startMinute)) {
              if ((endHour < startHour) || (endHour > startHour && hour < endHour) || (endHour > startHour && hour == endHour && minute <= endMinute)) {
                open = true;
              }
            }
          }
        }
      }
      return (open ? 1 : 2);
    }
    else {
      return 0;
    }
  }
}

Meteor.startup(function() {
  GoogleMaps.load({
    v : '3',
    key : 'AIzaSyCD75m_UjRrRBpFbDNcW6N3lLx6P316O1U',
    libraries : 'places'
  });
  GoogleMaps.loadUtilityLibrary('/scripts/markerclusterer.js');
});

Template.body.rendered = function () {
  $('.phone-tags').select2({
    tags : true,
    tokenSeparators: [',', ' '],
    width : '100%',
    placeholder : 'Teléfonos'
  });
}

Template.body.helpers({
  placesMapOptions: function() {
    // Make sure the maps API has loaded
    if (GoogleMaps.loaded()) {
      // We can use the `ready` callback to interact with the map API once the map is ready.
      GoogleMaps.ready('placesMap', function(map) {
        // Add a marker to the map once it's ready
        mapsHelpers.infowindow = new google.maps.InfoWindow({
          content: ''
        });
        mapsHelpers.initialize();
        mapsHelpers.addSearchBox(map.instance);
        Meteor.subscribe('places', function () {
          var ts = Places.find().fetch();
          var bounds = new google.maps.LatLngBounds();
          for(var i in ts){
            mapsHelpers.createMarker(bounds, map, ts[i]);
          }
          mapsHelpers.setCurrentZone();
        });
      });
      return {
        zoom: 12,
        center: new google.maps.LatLng(4.656397497516567, -74.06990909576417),
      };
    }
  }
});

Template.body.events({
  'click .btn-cancel-place' : function () {
    mapsHelpers.removeSearchMarkers();
    $('.btn-add-place').prop('disabled', true);
    $('.btn-cancel-place').prop('disabled', true);    
  },

  'click .btn-save-place' : function (e, t) {
    if (mapsHelpers.searchMarkers.length > 0) {
      var lat = mapsHelpers.searchMarkers[0].position.lat();
      var lng = mapsHelpers.searchMarkers[0].position.lng();

      var address = $('#pac-input').val();
      if (address.length > 0) {
        var name = $('#placeName').val();
        var phones = $('#placePhones').val();
        var notes = $('#placeNotes').val();

        if (name.trim() == '') {
          name = null;
        }
        if (phones.length == 0) {
          phones = null;
        }
        if (notes.trim() == '') {
          notes = null;
        }

        Meteor.call('addPlace', name, address, lat, lng, phones, notes);
      }
    }
  }
})