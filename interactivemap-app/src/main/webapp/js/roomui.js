/*******************************************************************************
 * Copyright (c) 2016 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *******************************************************************************/

//Controls UI interactions with the map service or data

var gameonID = null;
var gameonSecret = null;

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

//allows browsers that fire change events when auto-filling to have this updated when the page loads
$("#GameOnSecret").change(function() {
	var gameonSecret = this.value;
	configureDevOptions();
});

$("#GameOnID").change(function() {
	var gameonID = this.value;
	configureDevOptions();
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

$("#login-btn").click(function() {
  $("#loginModal").modal("show");
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

//create a new room
$("#roomInfoCreate-btn").click(function() {
	var info = inputToJSON("roomInfo_", "missing");
	var json = adaptToRoom(info);
	console.log('Creating room : ' + JSON.stringify(json));
	register(gameonID, gameonSecret, json);
	map.invalidateSize();
	return true;
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
