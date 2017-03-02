import { Meteor } from 'meteor/meteor';

Meteor.startup(() => {
  // Load initial map data
  var placesJson = {};
  placesJson = JSON.parse(Assets.getText("places.json"));
  Places.remove({});
  _.each(placesJson, function (place) {
    Places.insert(place);
  });
});
