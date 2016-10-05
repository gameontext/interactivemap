//functions specific to the map object

var etag = undefined;

function refreshMap() {
  mapquestOSM.redraw();  //request a redraw of the tiles layer
  $.ajax({
    dataType: "xml",
    url: "v1/svg?depth=1&x=0&y=0&style=2",
    complete: function (xhr, status) {
      sweepLayer.redraw();
    }
  });
  //trigger an update of the geo JSON features
  $.getJSON("v1/geojson/features?depth=0", function (data, status, xhr) {
    map.removeLayer(roomLayer); //remove existing layer from the map
    var showMyRooms = map.hasLayer(myroomLayer);
    if(showMyRooms) {
      map.removeLayer(myroomLayer);
    }
    //refresh the list of all rooms
    roomLayer = L.geoJson(null);
    rooms = L.geoJson(null, roomGeoJSON);
    rooms.addData(data);
    map.addLayer(roomLayer);
    markerClusters.addLayer(rooms);

    //update my rooms
    myrooms = L.geoJson(null, myroomsGeoJSON);
    myroomLayer = L.geoJson(null);
    myrooms.addData(data);
    if(showMyRooms) {
      map.addLayer(myroomLayer);
      markerClusters.addLayer(myrooms);
    }
    syncSidebar();
  });
}

/* Layer control listeners that allow for a single markerClusters layer */
map.on("overlayadd", function(e) {
  if (e.layer === roomLayer) {
    markerClusters.addLayer(rooms);
    syncSidebar();
  }
  if (e.layer === myroomLayer) {
	  if(gameonID) {
		  markerClusters.addLayer(myrooms);
		  syncSidebar();
	  } else {
		  alert("No ID set : ");
	  }
  }
});

map.on("overlayremove", function(e) {
  if (e.layer === roomLayer) {
    markerClusters.removeLayer(rooms);
    syncSidebar();
  }
  if (e.layer === myroomLayer) {
	markerClusters.removeLayer(myrooms);
	syncSidebar();
  }
});

/* Filter sidebar feature list to only show features in current map bounds */
map.on("moveend", function (e) {
  syncSidebar();
});

/* Clear feature highlight when map is clicked */
map.on("click", function(e) {
  highlight.clearLayers();
});

//used to dump debug into the console
map.on("contextmenu", function(e) {
  var coords, latLong;
  latLong = new L.LatLng(e.latlng.lat, e.latlng.lng);
  coords = map.project(latLong);
  var crs = L.CRS.Simple;
  var lat = map.unproject(coords);
  console.log("You clicked at Point [x="+coords.x+", y="+coords.y + "], LatLng=[" + latLong + "]");
  console.log("Map bounds : " + map.getBounds().toBBoxString());
  console.log("CRS simple results : " + crs.projection.unproject(coords) + " : " + crs.projection.project(latLong));
  console.log("Center latlng : " + crs.projection.unproject(centre));
  crs.projection.unproject(coords);
  var transform = new L.Transformation(1, 0, -1, 0);
  console.log("Transform : " + transform.transform(coords));
  console.log("Zoom level : " + map.getZoom());
});

map.on("layeradd", updateAttribution);
map.on("layerremove", updateAttribution);
