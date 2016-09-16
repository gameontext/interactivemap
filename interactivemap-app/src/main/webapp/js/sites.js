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

//Interactions with the sites API on /map/v?/sites

var mapurl = 'https://game-on.org/map/v1/sites';
//line below is useful for local testing
//var mapurl = 'https://' + window.location.hostname + '/map/v1/sites';

//pads a numeric value with additional zeros
function pad(value) {
  return value < 10 ? '0' + value : value;
}

//return the current time as a UTC date/time stamp
function now() {
  var d = new Date();
  //UTC = 2015-03-25T12:00:00
  var utcd = d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
  utcd += 'T' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds());
  utcd += '.000Z';
  return utcd;
}

//create a valid hmac to send to the GameOn servers
function hmac(id, secret, date, bodyHash) {
  var mac = new KJUR.crypto.Mac({"alg": "HmacSHA256", "pass": toUTF8(secret)});
  var headers = "";  //this would be the hash of any game on headers
  var params = "";  //this would be the hash of any query string parameters

  //send in old style
  //mac.updateString(toUTF8("POST"));
  //mac.updateString(toUTF8("/map/v1/sites"));
  mac.updateString(toUTF8(id));
  mac.updateString(toUTF8(date));
  mac.updateString(toUTF8(headers));
  mac.updateString(toUTF8(params));
  var hmac = mac.doFinalString(toUTF8(bodyHash));
  console.log('HMAC : ' + hmac);
  hmac = btoa(hexToString(hmac));
  console.log('Base64 : ' + hmac);
  return hmac;
}

function toUTF8(str) {
	return unescape(encodeURIComponent(str)); //convert from UTF16 -> UTF8
}

//construct a SHA256 hash of the supplied value
function hash(value) {
  var md = new KJUR.crypto.MessageDigest({"alg": "sha256", "prov": "cryptojs"});
  var utf8 = unescape(encodeURIComponent(value)); //convert from UTF16 -> UTF8
  md.updateString(utf8);
  var hash = md.digest();
  console.log('Hash : ' + hash);
  hash = btoa(hexToString(hash));
  console.log('Base64 : ' + hash);
  return hash;
}

//convert a hex string into characters
function hexToString(hex) {
    var result = '';
    for (var i = 0; i < hex.length; i += 2) {
        var val = hex.substr(i, 2);
        result += String.fromCharCode(parseInt(val, 16));
    }
    return result;
}

//regsiter / update a room with GameOn
function register(gid, secret, json, roomid) {
  var date = now();
  var body = JSON.stringify(json).trim();
  var bodyHash = hash(body);
  var sig = hmac(gid, secret, date, bodyHash);
  var verb = roomid ? 'PUT' : 'POST';
  var endpoint = roomid ? mapurl + '/' + roomid : mapurl;

  $.ajax({
      url: endpoint,
      method: verb,
      headers: {  'gameon-id': gid,
                  'gameon-date': date,
                  'gameon-sig-body': bodyHash,
                  'gameon-signature': sig},
      contentType: 'application/json', //what is being sent to the server
      dataType: 'json',  //what comes back from the server
      data: body,
      success: function (data, status) {
                  alert('regsiter/update successful : response from server : ' + status);
                  updateMap();
              },
      error: function (xhr, data, txt) {
                  alert('Unable to register/update room : response from server : ' + data + ':' + txt);
              }
  });
}

function getConnectionDetails(gid, secret, roomInfo) {
	  var date = now();
	  var body = "";
	  var bodyHash = hash(body);
	  var sig = hmac(gid, secret, date, bodyHash);
	  var endpoint = mapurl + '/' + roomInfo.id;

	  $.ajax({
	      url: endpoint,
	      method: 'GET',
	      headers: {  'gameon-id': gid,
	                  'gameon-date': date,
	                  'gameon-sig-body': bodyHash,
	                  'gameon-signature': sig},
	      contentType: 'application/json', //what is being sent to the server
	      dataType: 'json',  //what comes back from the server
	      data: body,
	      success: function (data, status) {
	                  $("#roomInfo_target").val(data.info.connectionDetails.target);
	              },
	      error: function (xhr, data, txt) {
	                  alert('Unable to get connection details for room : response from server : ' + data + ':' + txt);
	              }
	  });
}

function updateMap() {
  $.ajax({
      url: 'update',
      method: 'GET',
      success: function (data, status) {
                  console.log('Map update successful : response from server : ' + status);
              },
      error: function (xhr, data, txt) {
                  alert('Unable to update map : response from server : ' + data + ':' + txt);
              }
  });
}

//remove a previously registered room
function unregister(gid, secret, roomid) {
  var date = now();
  var sig = hmac(gid, secret, date, '');
  $.ajax({
    url: mapurl + '/' + roomid,
    method: 'DELETE',
    headers: {  'gameon-id': gid,
                'gameon-date': date,
                'gameon-sig-body': '',
                'gameon-signature': sig},
    contentType: 'application/json', //what is being sent to the server
    success: function (data, status) {
                alert('Room successfully deleted : response from server : ' + status);
                updateMap();
            },
    error: function (xhr, data, txt) {
                alert('Unable to delete room : response from server : ' + data + ':' + txt);
            }
  });
}
