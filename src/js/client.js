function initMap() {
  var map = new google.maps.Map(document.getElementById('map'), {
    zoom: 15,
    styles: [{"featureType":"landscape.natural","elementType":"geometry.fill","stylers":[{"visibility":"on"},{"color":"#e0efef"}]},{"featureType":"poi","elementType":"geometry.fill","stylers":[{"visibility":"on"},{"hue":"#1900ff"},{"color":"#c0e8e8"}]},{"featureType":"road","elementType":"geometry","stylers":[{"lightness":100},{"visibility":"simplified"}]},{"featureType":"road","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"transit.line","elementType":"geometry","stylers":[{"visibility":"on"},{"lightness":700}]},{"featureType":"water","elementType":"all","stylers":[{"color":"#7dcdcd"}]}]

  });

  let currentPosition;

  navigator.geolocation.getCurrentPosition(function(position) {
    // remove loading message
    document.querySelector('#loading').remove();

    // set current position so we can calculate distance to the stations
    const coords = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
    currentPosition = coords;

    // get all bikes
    getBikes();

    // center the map on the user
    map.setCenter(coords);

    // create 1km circle
    new google.maps.Circle({
      strokeColor: '#FF0000',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#FF0000',
      fillOpacity: 0.35,
      map: map,
      center: coords,
      radius: 1000
    });

    // creater smaller 25m circle
    new google.maps.Circle({
      strokeColor: 'green',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: 'green',
      fillOpacity: 0.35,
      map: map,
      center: coords,
      radius: 25
    });
  });

  function getBikes() {
    // get tfl bike data
    fetch('https://api.tfl.gov.uk/bikepoint').then(res => res.json()).then((data) => {
      // keep track of the active info window so we can close it
      let activeInfoWindow;

      // keep track of the closest objects so we can open the closest marker later
      let closestMarker;
      let closestInfoWindow;
      let closestDistance;

      for (const location of data) {
        const bikeCoords = new google.maps.LatLng(location.lat, location.lon);

        // create the marker
        let marker = new google.maps.Marker({
          position: bikeCoords,
          map: map
        });

        // find available bikes
        let availableBikes = parseInt(location.additionalProperties.find(function(obj) {
          return obj.key === 'NbBikes';
        }).value);

        // find empty docks
        let emptyDocks = parseInt(location.additionalProperties.find(function(obj) {
          return obj.key === 'NbEmptyDocks';
        }).value);

        // get the distance between the user and the station
        let distance = Math.round(google.maps.geometry.spherical.computeDistanceBetween(currentPosition, bikeCoords));

        // create info window
        let infoWindow = new google.maps.InfoWindow({
          content: '<div id="content">' +
            '<h1 id="firstHeading" class="firstHeading">' + location.commonName + '</h1>' +
            '<p>Available bikes: ' + availableBikes + '</p>' +
            '<p>Empty docks: ' + emptyDocks + '</p>' +
            '<p>Distance from you: ' + distance + ' metres</p>' +
          '</div>'
        });

        // when closing an info window, unset it so it's not active
        infoWindow.addListener('closeclick', function() {
          activeInfoWindow = null;
        });

        // if we have any available bikes
        if (availableBikes > 0) {
          // if we're the first window we've found, or if our distance is smaller than the previously closest, then set this as the closest one
          if (!closestInfoWindow || distance < closestDistance) {
            closestInfoWindow = infoWindow;
            closestDistance = distance;
            closestMarker = marker;
          }
        }

        // open the window on marker click and make it active
        marker.addListener('click', function() {
          if (activeInfoWindow) {
            activeInfoWindow.close();
          }
          activeInfoWindow = infoWindow;
          infoWindow.open(map, marker);
        });
      }

      // open the closest info window and make it active
      activeInfoWindow = closestInfoWindow;
      closestInfoWindow.open(map, closestMarker);
    });
  }
}
