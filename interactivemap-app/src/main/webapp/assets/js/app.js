
var map, featureList, roomSearch = [];

var gameonID = null;
var gameonSecret = null;

$(window).resize(function() {
  sizeLayerControl();
});

$(document).on("click", ".feature-row", function(e) {
  $(document).off("mouseout", ".feature-row", clearHighlight);
  sidebarClick(parseInt($(this).attr("id"), 10));
});

if ( !("ontouchstart" in window) ) {
  $(document).on("mouseover", ".feature-row", function(e) {
    //highlight.clearLayers().addLayer(L.circleMarker([$(this).attr("lat"), $(this).attr("lng")], highlightStyle));
	  var ll = L.latLng([$(this).attr("lat"), $(this).attr("lng")]);
	  var cgeo = convertGeoJson(ll);
	  highlight.clearLayers().addLayer(L.circleMarker(cgeo.getCenter(), highlightStyle));
  });
}

$(document).on("mouseout", ".feature-row", clearHighlight);

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

$("#newroom-btn").click(function() {
  if(!(gameonID && gameonSecret)) {
	  alert('You must enter your GameOn! ID and shared secret before you can create a room');
	  $("#loginModal").modal("show");
  } else {
	  $("#roomInfoUpdate-btn").hide();
	  $("#roomInfoDelete-btn").hide();
	  $("#roomInfoCreate-btn").show();

	  $("#roomModal").modal("show");
	  $('.nav-tabs a[href="#roomInfoTab-Details"]').tab('show');
	  $(".navbar-collapse.in").collapse("hide");
  }
  return false;
});

//websocket test form
$("#wstest-btn").click(function() {
  $("#wstestModal").modal("show");
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#wstestConnect-btn").click(function() {
	var msgtype = $("input[type='radio'][name='roomMsg_type']:checked");
	if(msgtype.length > 0) {
		alert(msgtype.val());
	} else {
		console.log("Error : unable to determine message type to send to room.")
	}
	return false;
});

//login form

$("#login-btn").click(function() {
  $("#loginModal").modal("show");
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

//allows browsers that fire change events when auto-filling to have this updated when the page loads
$("#GameOnSecret").change(function() {
	var gameonSecret = this.value;
	configureDevOptions();
});

$("#GameOnID").change(function() {
	var gameonID = this.value;
	configureDevOptions();
});


$("#list-btn").click(function() {
  animateSidebar();
  return false;
});

$("#nav-btn").click(function() {
  $(".navbar-collapse").collapse("toggle");
  return false;
});

$("#sidebar-toggle-btn").click(function() {
  animateSidebar();
  return false;
});

$("#sidebar-hide-btn").click(function() {
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

function sizeLayerControl() {
  $(".leaflet-control-layers").css("max-height", $("#map").height() - 50);
}

function clearHighlight() {
  highlight.clearLayers();
}

function sidebarClick(id) {
  var layer = markerClusters.getLayer(id);
  var bounds = convertGeoJson(layer.getLatLng());
  map.setView(bounds.getCenter());
  layer.fire("click");
  /* Hide sidebar and go to the map on small screens */
  if (document.body.clientWidth <= 767) {
    $("#sidebar").hide();
    map.invalidateSize();
  }
}

function syncSidebar() {
  /* Empty sidebar features */
  $("#feature-list tbody").empty();
  /* Loop through healthy room layer and add only features which are in the map bounds */
  rooms.eachLayer(function (layer) {
    if (map.hasLayer(roomLayer) &&
    		!(map.hasLayer(myroomLayer) && (layer.feature.properties.owner == gameonID))) {
      var conv = convertGeoJson(layer.getLatLng());
      //labels start at NW of bounds, so include if the label is visible
      if (map.getBounds().contains(conv.getNorthWest())) {
    	  var icon = "img/room-healthy.png";
    	  if((layer.getLatLng().lat == 0) && (layer.getLatLng().lng == 0)) {
    		  icon = "img/room-start.png";	//mark first room differently
    	  }
        console.log("Rooms Adding : " + layer.feature.properties.name);
        $("#feature-list tbody").append('<tr class="feature-row" id="' + L.stamp(layer) + '" lat="' + layer.getLatLng().lat + '" lng="' + layer.getLatLng().lng + '"><td style="vertical-align: middle;"><img width="16" height="18" src="' + icon + '"></td><td class="feature-name">' + layer.feature.properties.name + '</td><td style="vertical-align: middle;"><i class="fa fa-chevron-right pull-right"></i></td></tr>');
      }
    }
  });

  myrooms.eachLayer(function (layer) {
    //only show my rooms if the main room show isn't visible, otherwise we're going to get duplicates
    if (map.hasLayer(myroomLayer) && (layer.feature.properties.owner == gameonID)) {
	  var conv = convertGeoJson(layer.getLatLng());
	  //labels start at NW of bounds, so include if the label is visible
	  if (map.getBounds().contains(conv.getNorthWest())) {
	  	var icon = "img/room-healthy.png";
      console.log("MY rooms Adding : " + layer.feature.properties.name);
	    $("#feature-list tbody").append('<tr class="feature-row" id="' + L.stamp(layer) + '" lat="' + layer.getLatLng().lat + '" lng="' + layer.getLatLng().lng + '"><td style="vertical-align: middle;"><img width="16" height="18" src="' + icon + '"></td><td class="feature-name">' + layer.feature.properties.name + '</td><td style="vertical-align: middle;"><i class="fa fa-chevron-right pull-right"></i></td></tr>');
	  }
	}
  });

  /* Update list.js featureList */
  featureList = new List("features", {
    valueNames: ["feature-name"]
  });
  featureList.sort("feature-name", {
    order: "asc"
  });
}

/*
 * Get the current zoom level, taking into account that we have reversed the zoom level
 */
function getZoom() {
	return map.getMaxZoom() - map.getZoom();
}

//sizes and offsets are determined by the zoom level
var sizes = [255, 85, 51];
var offsets = [0, 85, 102];

/*
 * Converts the GEO JSON generated by the map service into screen co-ordinates.
 * The map service GEO JSON lat lng are actually the grid co-ordinates from the
 * GameOn! world. These need to be converted into a pixel point and then into the
 * layer lat lng.
 */
function convertGeoJson(latlng, log) {
	var zoom = getZoom();							//zoom level sets rooms per tile
	var size = sizes[zoom];		//default room size per tile
	var offset = offsets[zoom];
	var x = (latlng.lng * size) + offset;
	var y = (latlng.lat * size * -1) + offset;
	var sw = L.point(x, y + size);	//new point, SW of the bounds
	var ne = L.point(x + size, y);	//new point, NE of the bounds
	var latsw = map.unproject(sw);
	var latne = map.unproject(ne);
	var bounds = L.latLngBounds(latsw, latne);
	if(log) {
		console.log("GEO JSON conversion : original = " + latlng + ", tile size = " + size + ", offset = " + offset);
		console.log("SW point = " + sw + ", NE point = " + ne);
		console.log("SW latlng = " + latsw + ", NE latlng = " + latne);
	}
	return bounds;
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

/* Single marker cluster layer to hold all clusters */
var markerClusters = new L.MarkerClusterGroup({
  spiderfyOnMaxZoom: true,
  showCoverageOnHover: false,
  zoomToBoundsOnClick: false,
  disableClusteringAtZoom: 3
});

/* Empty layer placeholder to add to layer control for listening when to add/remove rooms to markerClusters layer */
var roomLayer = L.geoJson(null);
var roomGeoJSON = {
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
      roomSearch.push({
        name: layer.feature.properties.name,
        fullName: layer.feature.properties.fullName,
        source: "Rooms",
        id: L.stamp(layer),
        lat: layer.feature.geometry.coordinates[1],
        lng: layer.feature.geometry.coordinates[0]
      });
    }
  }
}

var rooms = L.geoJson(null, roomGeoJSON);

$.getJSON("v1/geojson/features?depth=0", function (data, status, xhr) {
  rooms.addData(data);
  map.addLayer(roomLayer);
});

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

//if the map data has changed, this endpoint will give back a new etag
var checkForUpdates = function() {
  $.ajax({
    dataType: "xml",
    url: "v1/svg?depth=1&x=0&y=0&style=1",
    complete: function (xhr, status) {
      var headers = xhr.getAllResponseHeaders().split('\n');
      for(var i = 0; i < headers.length; i++) {
        if(headers[i] && headers[i].indexOf(':') != -1) {
          var values = headers[i].split(':');
          if(values[0] == 'ETag') {
            var newtag = values[1].trim();
            if(newtag != etag) {
              etag = newtag;
              console.log("ALERT - etag changed");
              refreshMap();
            }
            return;   //stop processing after checking etag
          }
        }
      }
    }
  });
}

$.ajax({
  dataType: "xml",
  url: "v1/svg?depth=1&x=0&y=0&style=1",
  complete: function (xhr, status) {
    var headers = xhr.getAllResponseHeaders().split('\n');
    for(var i = 0; headers.length; i++) {
      if(headers[i] && headers[i].indexOf(':') != -1) {
        var values = headers[i].split(':');
        if(values[0] == 'ETag') {
          console.log("Initial ETag = " + values[1]);
          etag = values[1].trim();
          setInterval(checkForUpdates, 3000);
          return;   //finish processing
        }
      }
    }
  }
});

//feature control for my rooms
var myroomLayer = L.geoJson(null);
var myroomsGeoJSON = {
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
          //if the user has supplied a GameOn! ID and secret then we can also get the connection details
          if(gameonID && gameonSecret) {
        	  console.log("GameOn! ID and secret found, retrieving connection details");
        	  getConnectionDetails(gameonID, gameonSecret, props);
          } else {
        	  console.log("Unable to get connection details due to missing ID and/or secret");
          }
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
      roomSearch.push({
        name: layer.feature.properties.name,
        fullName: layer.feature.properties.fullName,
        source: "MyRooms",
        id: L.stamp(layer),
        lat: layer.feature.geometry.coordinates[1],
        lng: layer.feature.geometry.coordinates[0]
      });
    }
  }
}

var myrooms = L.geoJson(null, myroomsGeoJSON);

$.getJSON("v1/geojson/features?depth=0", function (data) {
  myrooms.addData(data);
});

//convert all the values for inputs that startswith into a JSON object, with an optional default value if missing
function inputToJSON(startswith, defvalue) {
	var json = {};
	if(!defvalue) {
		defvalue = '';
	}
	$('input[id^="' + startswith + '"]').each(function(){
		var name = this.id.substring(9);
		json[name] = this.value || defvalue;
	});
	return json;
}

//convert flat data from a set of form inputs into a room structure that can be sent to GameOn
/*
 * {
"name":"JSReg",
"fullName":"A room registered by JSReg tm.",
"description":"Command line registration tool for room developers.",
"doors":{
	"s":"A winding path leading off to the south",
	"d":"A tunnel, leading down into the earth",
	"e":"An overgrown road, covered in brambles",
	"u":"A spiral set of stairs, leading upward into the ceiling",
	"w":"A shiny metal door, with a bright red handle",
	"n":"A Large doorway to the north"
},
"connectionDetails":{
	"type":"websocket",
	"target":"ws://172.17.0.11:9080/rooms/pictureRoom"
}
}
 */
function adaptToRoom(data) {
	var room = {
		"name" : data.name,
		"fullName" : data.fullName,
		"description" : data.description,
		"doors" : {
			"u" : data.u,
			"d" : data.d,
			"n" : data.n,
			"e" : data.e,
			"s" : data.s,
			"w" : data.w
 		},
 		"connectionDetails" : {
 			"type" : "websocket",
 			"target" : data.target
 		}
	};
	return room;
}

//create a new room
$("#roomInfoCreate-btn").click(function() {
	var info = inputToJSON("roomInfo_", "missing");
	var json = adaptToRoom(info);
	console.log('Creating room : ' + JSON.stringify(json));
	register(gameonID, gameonSecret, json);
	map.invalidateSize();
	return true;
});

//fires when room registration details are updated
$("#roomInfoUpdate-btn").click(function() {
	var info = inputToJSON("roomInfo_", "missing");
	var json = adaptToRoom(info);
	console.log('Updating room : ' + JSON.stringify(json));
	register(gameonID, gameonSecret, json, info.id);
	return false;
});

//fires when room registration details are removed from the map
$("#roomInfoDelete-btn").click(function() {
	var info = inputToJSON("roomInfo_", "missing");
	console.log('Deleting room : ' + info.id);
	unregister(gameonID, gameonSecret, info.id);
	return true;
});

//fires when asked to save developer information
$("#rememberDetails_All").click(function() {
	console.log("Saving all details");
	player.setDevConfig(document.getElementById('GameOnID').value, document.getElementById('GameOnSecret').value)
	return true;
});

$("#rememberDetails_ID").click(function() {
	console.log("Saving ID only");
	player.setDevConfig(document.getElementById('GameOnID').value);
	return true;
});

$("#rememberDetails_never").click(function() {
	console.log("Not saving details");
	player.setDevConfig();		//passing no config results in it being deleted
	return true;
});


//configure options that are available for developers if they enter their ID/secret
function configureDevOptions() {
	//see if an ID has been populated, either by the user or the browser auto-fill
	var id = document.getElementById('GameOnID').value;
	var secret = document.getElementById('GameOnSecret').value;

	//now determine the state of the remember you buttons based on what is available in the browser local storage
	var config = player.getDevConfig();
	if(config.id) {
		if(config.secret) {
			document.getElementById("rememberDetails_All").checked = true;
			document.getElementById("rememberDetails_ID").checked = false;
			document.getElementById("rememberDetails_never").checked = false;
		} else {
			document.getElementById("rememberDetails_ID").checked = true;
			document.getElementById("rememberDetails_All").checked = false;
			document.getElementById("rememberDetails_never").checked = false;
		}
	} else {
		document.getElementById("rememberDetails_never").checked = true;
		document.getElementById("rememberDetails_All").checked = false;
		document.getElementById("rememberDetails_ID").checked = false;
	}

	//existing data in the form always wins over data from storage in case the save event hasn't happened yet
	if(!id) id = config.id;
	if(!secret) secret = config.secret;

	if(id) {
		//validate that the ID looks correct
		var pos = id.indexOf(":");
		if(pos == -1) {
			console.log('Please check that the supplied id is valid');
			return false;
		}
		//have entered an ID so can do some other things
		gameonID = id;		//set the GameOn ID, needs to happen before adding the layer
		document.getElementById('GameOnID').value = id;
		map.addLayer(myroomLayer);
	} else {
		//remove any developer specific things we've added
		map.removeLayer(myroomLayer);
		document.getElementById('GameOnID').value = "";
	}

	//now look for the secret

	if(secret) {
		gameonSecret = secret;
		document.getElementById('GameOnSecret').value = secret;
	} else {
		gameonSecret = null;
		document.getElementById('GameOnSecret').value = "";
	}
}

//run when the dom is constructed
$(document).ready(function(){
    configureDevOptions();
});

//developer options only become available when you supply developer info
$('#loginModal').on('hidden.bs.modal', function () {
	configureDevOptions();
});

//when the room modal closes, clear any form entries
$('#roomModal').on('hidden.bs.modal', function () {
	console.log("Clearing form data");
  //inputs are not wrapped by a form as that won't display properly in a modal with tabs, so select like this
  $('input[id^="roomInfo_"]').each(function(){
	this.value = '';
  });
});

var map = L.map('map', {
	layers: [mapquestOSM, sweepLayer, highlight],
	zoomControl: false,
    attributionControl: false,
    crs: L.CRS.Simple,
    center: [0,0]
});

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

var centre = L.point(0, 0);

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

/* Attribution control */
function updateAttribution(e) {
  $.each(map._layers, function(index, layer) {
    if (layer.getAttribution) {
      $("#attribution").html((layer.getAttribution()));
    }
  });
}
map.on("layeradd", updateAttribution);
map.on("layerremove", updateAttribution);

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
    "<img src='img/room-healthy.png' width='24' height='28'>&nbsp;Healthy Rooms": roomLayer,
    "<img src='img/room-healthy.png' width='24' height='28'>&nbsp;My Rooms": myroomLayer
  }
};

var layerControl = L.control.groupedLayers(baseLayers, groupedOverlays, {
  collapsed: isCollapsed
}).addTo(map);

/* Highlight search box text on click */
$("#searchbox").click(function () {
  $(this).select();
});

/* Prevent hitting enter from refreshing the page */
$("#searchbox").keypress(function (e) {
  if (e.which == 13) {
    e.preventDefault();
  }
});

$("#featureModal").on("hidden.bs.modal", function (e) {
  $(document).on("mouseout", ".feature-row", clearHighlight);
});

/* Typeahead search functionality */
$(document).one("ajaxStop", function () {
  $("#loading").hide();
  sizeLayerControl();

  //make it so that the map display is centred on the screen
  map.setView([-32,32], 2);	//remember that we have zoom inverted when calling back to tile service

  featureList = new List("features", {valueNames: ["feature-name"]});
  featureList.sort("feature-name", {order:"asc"});

  var roomsBH = new Bloodhound({
    name: "Rooms",
    datumTokenizer: function (d) {
      return Bloodhound.tokenizers.whitespace(d.name);
    },
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    local: roomSearch,
    limit: 10
  });

  roomsBH.initialize();


  /* instantiate the typeahead UI */
  $("#searchbox").typeahead({
    minLength: 3,
    highlight: true,
    hint: false
  }, {
    name: "Rooms",
    displayKey: "name",
    source: roomsBH.ttAdapter(),
    templates: {
      header: "<h4 class='typeahead-header'><img src='img/room-healthy.png' width='24' height='28'>&nbsp;Rooms</h4>",
      suggestion: Handlebars.compile(["{{name}}<br>&nbsp;<small>{{fullName}}</small>"].join(""))
    }
  }).on("typeahead:selected", function (obj, datum) {
    if (datum.source === "Rooms") {
      if (!map.hasLayer(roomLayer)) {
        map.addLayer(roomLayer);
      }
      map.setView([datum.lat, datum.lng], 2);
      if (map._layers[datum.id]) {
        map._layers[datum.id].fire("click");
      }
    }
    if ($(".navbar-collapse").height() > 50) {
      $(".navbar-collapse").collapse("hide");
    }
  }).on("typeahead:opened", function () {
    $(".navbar-collapse.in").css("max-height", $(document).height() - $(".navbar-header").height());
    $(".navbar-collapse.in").css("height", $(document).height() - $(".navbar-header").height());
  }).on("typeahead:closed", function () {
    $(".navbar-collapse.in").css("max-height", "");
    $(".navbar-collapse.in").css("height", "");
  });
  $(".twitter-typeahead").css("position", "static");
  $(".twitter-typeahead").css("display", "block");
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
