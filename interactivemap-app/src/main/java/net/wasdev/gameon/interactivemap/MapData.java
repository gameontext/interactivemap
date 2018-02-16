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
package net.wasdev.gameon.interactivemap;

import javax.json.JsonObject;

import net.wasdev.gameon.map.models.Site;

//Data received from GameOn map service
public class MapData {
    private final int deltaX;
    private final int deltaY;
    private final JsonObject[][] data;
    private final Site[][] sites;

    public static MapData EMPTY_DATA() {
        return new MapData(0, 0, (JsonObject[][])null);
    }

    public MapData(int deltaX, int deltaY, JsonObject[][] data) {
        super();
        this.deltaX = deltaX;
        this.deltaY = deltaY;
        this.data = data;
        sites = null;
    }

    public MapData(int deltaX, int deltaY, Site[][] sites) {
        super();
        this.deltaX = deltaX;
        this.deltaY = deltaY;
        this.sites = sites;
        data = null;
    }

    public int getDeltaX() {
        return deltaX;
    }

    public int getDeltaY() {
        return deltaY;
    }

    public JsonObject[][] getData() {
        return data;
    }

    public Site[][] getSites() {
        return sites;
    }

    public boolean isEmpty() {
        return (sites == null) && (data == null);
    }
}
