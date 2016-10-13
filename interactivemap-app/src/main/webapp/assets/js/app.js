console.log("Map version 1.1.4");

var map = [];
var centre = L.point(0, 0);

$(window).resize(function() {
  sizeLayerControl();
});

$("#about-btn").click(function() {
  $("#aboutModal").modal("show");
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#full-extent-btn").click(function() {
  map.fitBounds(boroughs.getBounds());
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#legend-btn").click(function() {
  $("#legendModal").modal("show");
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#nav-btn").click(function() {
  $(".navbar-collapse").collapse("toggle");
  return false;
});

function sizeLayerControl() {
  $(".leaflet-control-layers").css("max-height", $("#map").height() - 50);
}

var mapquestOSM = L.tileLayer('v1/svg?depth={z}&x={x}&y={y}&style=1', {
  continuousWorld: true,
  maxZoom: 3,
  minZoom: 1,
  zoomReverse : true,
  tileSize: 255
});

var sweepLayer = L.tileLayer('v1/svg?depth={z}&x={x}&y={y}&style=2', {
	continuousWorld: true,
	maxZoom: 3,
	minZoom: 1,
	zoomReverse : true,
	tileSize: 255
});

/* Overlay Layers */
var highlight = L.geoJson(null);
var highlightStyle = {
  stroke: false,
  fillColor: "#00FFFF",
  fillOpacity: 0.7,
  radius: 10
};

/* Empty layer placeholder to add to layer control for listening when to add/remove rooms to markerClusters layer */
var roomLayer = L.geoJson(null);
var simpleLayer = L.geoJson(null);
var myroomLayer = L.geoJson(null);

var rooms = L.geoJson(null, {
  pointToLayer: function (feature, latlng) {
    return L.marker(latlng, {
      icon: L.icon({
        iconUrl: "img/rooms-healthy.png",
        iconSize: [24, 28],
        iconAnchor: [12, 28],
        popupAnchor: [0, -25]
      }),
      title: feature.properties.name,
      riseOnHover: true
    });
  },
  onEachFeature: function (feature, layer) {
    if (feature.properties) {
      var content = "<table class='table table-striped table-bordered table-condensed'>" + "<tr><th>Name</th><td>" + feature.properties.name + "</td></tr>" + "<tr><th>Full Name</th><td>" + feature.properties.fullName + "</td></tr>" + "<tr><th>Description</th><td>" + feature.properties.description + "</td></tr></table>";
      layer.on({
        click: function (e) {
          $("#feature-title").html(feature.properties.name);
          $("#feature-info").html(content);
          $("#featureModal").modal("show");
          var latlng = L.latLng(feature.geometry.coordinates[1], feature.geometry.coordinates[0]);
          var cgeo = convertGeoJson(latlng).getCenter();
          highlight.clearLayers().addLayer(L.circleMarker(cgeo, highlightStyle));
        }
      });
      //$("#feature-list tbody").append('<tr class="feature-row" id="' + L.stamp(layer) + '" lat="' + layer.getLatLng().lat + '" lng="' + layer.getLatLng().lng + '"><td style="vertical-align: middle;"><img width="16" height="18" src="img/room-healthy.png"></td><td class="feature-name">' + layer.feature.properties.name + '</td><td style="vertical-align: middle;"><i class="fa fa-chevron-right pull-right"></i></td></tr>');
      addToSearch(L.stamp(layer), "Rooms", layer.feature);
    }
  }
});
$.getJSON("v1/geojson/features?depth=0", function (data) {
  rooms.addData(data);
  map.addLayer(roomLayer);
  myrooms.addData(data);
});


//feature control for my rooms
var myrooms = L.geoJson(null, {
  pointToLayer: function (feature, latlng) {
    return L.marker(latlng, {
      icon: L.icon({
        iconUrl: "img/rooms-healthy.png",
        iconSize: [24, 28],
        iconAnchor: [12, 28],
        popupAnchor: [0, -25]
      }),
      title: feature.properties.name,
      riseOnHover: true
    });
  },
  onEachFeature: function (feature, layer) {
    if (feature.properties) {
      layer.on({
        click: function (e) {
          var props = layer.feature.properties;
          for (prop in props) {
        	  $("#roomInfo_" + prop).val(props[prop]);
          }
          $("#roomInfoUpdate-btn").show();
    	    $("#roomInfoDelete-btn").show();
    	    $("#roomInfoCreate-btn").hide();
          $("#roomModal").modal("show");
          //for some reason the modal / tabs combo does not work first time until a tab is clicked, so simulate that.
          $('.nav-tabs a[href="#roomInfoTab-Overview"]').tab('show');
          var latlng = L.latLng(feature.geometry.coordinates[1], feature.geometry.coordinates[0]);
          var cgeo = convertGeoJson(latlng).getCenter();
          highlight.clearLayers().addLayer(L.circleMarker(cgeo, highlightStyle));
        }
      });
      //$("#feature-list tbody").append('<tr class="feature-row" id="' + L.stamp(layer) + '" lat="' + layer.getLatLng().lat + '" lng="' + layer.getLatLng().lng + '"><td style="vertical-align: middle;"><img width="16" height="18" src="img/room-healthy.png"></td><td class="feature-name">' + layer.feature.properties.name + '</td><td style="vertical-align: middle;"><i class="fa fa-chevron-right pull-right"></i></td></tr>');
      addToSearch(L.stamp(layer), "MyRooms", layer.feature);
    }
  }
});


//run when the dom is constructed
$(document).ready(function(){
    configureDevOptions();
});

var map = L.map('map', {
	layers: [mapquestOSM, sweepLayer, highlight],
	zoomControl: false,
    attributionControl: false,
    crs: L.CRS.Simple,
    center: [0,0]
});

/* Attribution control */
function updateAttribution(e) {
  $.each(map._layers, function(index, layer) {
    if (layer.getAttribution) {
      $("#attribution").html((layer.getAttribution()));
    }
  });
}


var attributionControl = L.control({
  position: "bottomright"
});
attributionControl.onAdd = function (map) {
  var div = L.DomUtil.create("div", "leaflet-control-attribution");
  div.innerHTML = "<a href='#' onclick='$(\"#attributionModal\").modal(\"show\"); return false;'>Attribution</a>";
  return div;
};
map.addControl(attributionControl);

var zoomControl = L.control.zoom({
  position: "bottomright"
}).addTo(map);

/* GPS enabled geolocation control set to follow the user's location */
var locateControl = L.control.locate({
  position: "bottomright",
  drawCircle: true,
  follow: true,
  setView: true,
  keepCurrentZoomLevel: true,
  markerStyle: {
    weight: 1,
    opacity: 0.8,
    fillOpacity: 0.8
  },
  circleStyle: {
    weight: 1,
    clickable: false
  },
  icon: "fa fa-location-arrow",
  metric: false,
  strings: {
    title: "My location",
    popup: "You are within {distance} {unit} from this point",
    outsideMapBoundsMsg: "You seem located outside the boundaries of the map"
  },
  locateOptions: {
    maxZoom: 18,
    watch: true,
    enableHighAccuracy: true,
    maximumAge: 10000,
    timeout: 10000
  }
}).addTo(map);

/* Larger screens get expanded layer control and visible sidebar */
if (document.body.clientWidth <= 767) {
  var isCollapsed = true;
} else {
  var isCollapsed = false;
}

var baseLayers = {
  "Game On! Map": mapquestOSM,
  "Sweep Map" : sweepLayer
};

var groupedOverlays = {
  "Points of Interest": {
    "<img src='img/room-healthy.png' width='24' height='28'>&nbsp;Rooms": roomLayer,
    "<img src='img/room-healthy.png' width='24' height='28'>&nbsp;My Rooms": myroomLayer,
    "<img src='img/room-healthy.png' width='24' height='28'>&nbsp;Simple Rooms": simpleLayer
  }
};

var layerControl = L.control.groupedLayers(baseLayers, groupedOverlays, {
  collapsed: isCollapsed
}).addTo(map);

/* Typeahead search functionality */
$(document).one("ajaxStop", function () {
  $("#loading").hide();
  sizeLayerControl();

  //make it so that the map display is centred on the screen
  map.setView([-32,32], 2);	//remember that we have zoom inverted when calling back to tile service

  initPOI();
  initSearch();

});

// Leaflet patch to make layer control scrollable on touch browsers
var container = $(".leaflet-control-layers")[0];
if (!L.Browser.touch) {
  L.DomEvent
  .disableClickPropagation(container)
  .disableScrollPropagation(container);
} else {
  L.DomEvent.disableClickPropagation(container);
}
