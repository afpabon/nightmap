import { Meteor } from 'meteor/meteor';

Meteor.startup(() => {
  // Load initial map data
  /*var placesJson = {};
  placesJson = JSON.parse(Assets.getText("places.json"));
  Places.remove({});
  _.each(placesJson, function (place) {
    Places.insert(place);
  });*/
});

Meteor.publish('places', function () {
  return Places.find();
});

Meteor.methods({
  addPlace : function (name, address, lat, lng, phones, notes) {
    var newPlace = {};
    
    if (! lat || ! lng || ! address) {
      return false;
    }

    if (name) {
      newPlace.Name = name;
    }

    if (address) {
      newPlace.Address = address;
    }

    if (lat && lng) {
      newPlace.Gps = {
        type : 'Feature',
        geometry : {
          type : 'Point',
          coordinates : [lat, lng]
        }
      };
    }

    if (phones) {
      newPlace.Phones = phones;
    }

    if (notes) {
      newPlace.Notes = notes;
    }

    Places.insert(newPlace);
    return true;
  }
});
