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

import java.util.HashMap;
import java.util.Map;
import java.util.Map.Entry;

public class Feature {
    private final Map<String, String> properties = new HashMap<>();
    private Geometry geometry = null;

    public void addProperty(String name, String value) {
        value = (value == null) ? "missing" : value;
        properties.put(name, value);
    }

    public Geometry getGeometry() {
        return geometry;
    }

    public void setGeometry(Geometry geometry) {
        this.geometry = geometry;
    }

    @Override
    public String toString() {
        StringBuilder builder = new StringBuilder("{ \"type\": \"Feature\",\n\"properties\": {");
        if(!properties.isEmpty()) {
            for(Entry<String, String> property : properties.entrySet()) {
                builder.append("\n\"" + GeoJSONMapData.escapeJSON(property.getKey()) + "\":\"" + GeoJSONMapData.escapeJSON(property.getValue()) + "\",");
            }
            builder.delete(builder.lastIndexOf(","), builder.length());
        }
        builder.append("\n}\n");        //end of properties
        if(geometry != null) {
            builder.append(", " + geometry.toString());
        }
        builder.append("}\n");        //end of feature
        return builder.toString();
    }

}
