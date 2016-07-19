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

/*
 * GeoJSON rect representation
 */
public class Rect implements Geometry {
	public int x = 0;
	public int y = 0;
	public int width = 0;
	public int height = 0;
	
	//return the centre of this rectangle
	public Point getCentre() {
	    Point p = new Point();
	    p.x = x + (width / 2);
	    p.y = y + (height / 2);
	    return p;
	}
	
	public String toString() {
		StringBuilder builder = new StringBuilder("\"geometry\": {\n\"type\":\"Polygon\",\n\"coordinates\": [\n");
		builder.append("[" + x + "," + y + "],");
		builder.append("[" + (x + width) + "," + y + "],");
		builder.append("[" + (x + width) + "," + (y + height) + "],");
		builder.append("[" + x + "," + (y + height) + "]");
		builder.append("]\n}\n");
		return builder.toString();
	}
}
