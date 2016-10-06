//controlling script for the points of interest (POI) sidebar
var featureList = [];

/* Single marker cluster layer to hold all clusters */
var markerClusters = new L.MarkerClusterGroup({
  spiderfyOnMaxZoom: true,
  showCoverageOnHover: false,
  zoomToBoundsOnClick: false,
  disableClusteringAtZoom: 3
});

$("#sidebar-toggle-btn").click(function() {
  animateSidebar();
  return false;
});

$("#sidebar-hide-btn").click(function() {
  animateSidebar();
  return false;
});

$("#list-btn").click(function() {
  animateSidebar();
  return false;
});

function animateSidebar() {
  $("#sidebar").animate({
    width: "toggle"
  }, 350, function() {
    map.invalidateSize();
  });
}

function clearHighlight() {
  highlight.clearLayers();
}

function initPOI() {
  featureList = new List("features", {valueNames: ["feature-name"]});
  featureList.sort("feature-name", {order:"asc"});
}

$(document).on("click", ".feature-row", function(e) {
  $(document).off("mouseout", ".feature-row", clearHighlight);
  sidebarClick(parseInt($(this).attr("id"), 10));
});

//$(document).on("mouseover", ".feature-row", locateOnMap(parseInt($(this).attr("id"), 10)));
$(document).on("mouseout", ".feature-row", clearHighlight);

//the .feature-row class are entries in the POI

$("#featureModal").on("hidden.bs.modal", function (e) {
  $(document).on("mouseout", ".feature-row", clearHighlight);
});

if ( !("ontouchstart" in window) ) {
  $(document).on("mouseover", ".feature-row", function(e) {
    //highlight.clearLayers().addLayer(L.circleMarker([$(this).attr("lat"), $(this).attr("lng")], highlightStyle));
	  var ll = L.latLng([$(this).attr("lat"), $(this).attr("lng")]);
	  var cgeo = convertGeoJson(ll);
	  highlight.clearLayers().addLayer(L.circleMarker(cgeo.getCenter(), highlightStyle));
    if (!map.getBounds().contains(cgeo.getNorthWest())) {
      //move the map if the POI isn't currently in the view
      locateOnMap(parseInt($(this).attr("id"), 10));
    }
  });
}

function locateOnMap(id) {
  var layer = markerClusters.getLayer(id);
  if(!layer) {
    console.log("Error : unable to get layer for ID " + id);
    return;
  }
  var bounds = convertGeoJson(layer.getLatLng());
  map.setView(bounds.getCenter());
  return layer;
}

function sidebarClick(id) {
  locateOnMap(id).fire("click");
  /* Hide sidebar and go to the map on small screens */
  if (document.body.clientWidth <= 767) {
    $("#sidebar").hide();
    map.invalidateSize();
  }
}

function syncSidebar() {
  /* Empty sidebar features */
  $("#feature-list tbody").empty();
  var pois = {}; // this is the map of items to show in the POI

  //my rooms have priority as they display full room information rather than a summary
  myrooms.eachLayer(function (layer) {
    var room = layer.feature.properties;
    if (map.hasLayer(myroomLayer) && (room.owner == gameonID)) {
      var id = room.owner + room.name;
      if(!pois[id]) {
        pois[id] = {
          icon : "img/room-healthy.png",
          id : L.stamp(layer),
          latlng : layer.getLatLng(),
          name : room.name
        }
      }
	   }
  });

  //add remaining rooms
  rooms.eachLayer(function (layer) {
    var room = layer.feature.properties;
    var include = map.hasLayer(roomLayer) && room.owner && (room.name != "AnotherSimpleRoom");
    include |= map.hasLayer(simpleLayer) && room.owner && (room.name == "AnotherSimpleRoom");
    if(include) {
      var id = room.owner + room.name;
      if(!pois[id]) {
        pois[id] = {
          icon : "img/room-healthy.png",
          id : L.stamp(layer),
          latlng : layer.getLatLng(),
          name : room.name
        }
      }
    }

  });



  for(poi in pois) {
    $("#feature-list tbody").append('<tr class="feature-row" id="' + pois[poi].id +
      '" lat="' + pois[poi].latlng.lat + '" lng="' + pois[poi].latlng.lng +
      '"><td style="vertical-align: middle;"><img width="16" height="18" src="' + pois[poi].icon +
      '"></td><td class="feature-name">' + pois[poi].name +
      '</td><td style="vertical-align: middle;"><i class="fa fa-chevron-right pull-right"></i></td></tr>');
  }

  /* Update list.js featureList */
  featureList = new List("features", {
    valueNames: ["feature-name"]
  });
  featureList.sort("feature-name", {
    order: "asc"
  });
}
