//script controlling the search bar
var roomSearch = [];

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

function addToSearch(sid, src, room) {
  roomSearch.push({
    name: room.properties.name,
    fullName: room.properties.fullName,
    source: src,
    id: sid,
    lat: room.geometry.coordinates[1],
    lng: room.geometry.coordinates[0]
  });
}

function initSearch() {
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

}

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
