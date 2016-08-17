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

//manage the player and developer details such as their ID and secret

var STORAGE_KEY_ID = "org.gameontext.interactivemap.id";
var STORAGE_KEY_SECRET = "org.gameontext.interactivemap.secret";

var player = {
	getDevConfig : function () {
		//default blank configuration
		var config = {
				id : undefined,
				secret : undefined
		}
		
		if (typeof(Storage) !== "undefined") {
			var id = localStorage.getItem(STORAGE_KEY_ID);
			var secret = localStorage.getItem(STORAGE_KEY_SECRET);
			if(id) config.id = id;
			if(secret) config.secret = secret;
		}	
		return config;
	},
	setDevConfig : function(id, secret) {
		if (typeof(Storage) !== "undefined") {
			id ? localStorage.setItem(STORAGE_KEY_ID, id) : localStorage.removeItem(STORAGE_KEY_ID);
			secret ? localStorage.setItem(STORAGE_KEY_SECRET, secret) : localStorage.removeItem(STORAGE_KEY_SECRET);
		} else {
			alert("Sorry, could not save your developer details as browser local storage is not available.");
		}
	}
}
