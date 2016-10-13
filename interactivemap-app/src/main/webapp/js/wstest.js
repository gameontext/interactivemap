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

//script that drives the web socket test connection page


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
