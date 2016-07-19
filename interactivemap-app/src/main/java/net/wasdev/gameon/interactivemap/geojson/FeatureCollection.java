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
package net.wasdev.gameon.interactivemap.geojson;

import java.util.ArrayList;
import java.util.List;

//container class to generate features list
public class FeatureCollection {
    private final List<Feature> features = new ArrayList<>();

    public void add(Feature feature) {
        features.add(feature);
    }
    
	@Override
	public String toString() {
		StringBuilder builder = new StringBuilder("{\n\"type\": \"FeatureCollection\",\n\"features\": [");
		if(!features.isEmpty()) {
		    for(Feature feature : features ) {
		        builder.append("\n" + feature + ",");
		    }
		    builder.delete(builder.lastIndexOf(","), builder.length());
		}
		builder.append("]\n}\n");
		return builder.toString();
	}

	
	
}
