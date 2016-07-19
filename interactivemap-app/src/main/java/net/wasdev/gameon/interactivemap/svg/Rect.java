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
package net.wasdev.gameon.interactivemap.svg;

/*
 * SVG rect representation
 */
public class Rect implements SVGElement {
	public static final String STYLE_ROOM_HEALTHY = "fill:rgb(185, 243, 97);stroke:black;stroke-width:1;opacity:0.5";
	public static final String STYLE_FIRST_ROOM = "fill:rgb(199, 223, 245);stroke:black;stroke-width:1;opacity:0.5";
	public static final String STYLE_EMPTY = "fill:black;stroke:black;stroke-width:1;opacity:0.5";
	
	public int x = 0;
	public int y = 0;
	public int rx = 0;
	public int ry = 0;
	public int width = 0;
	public int height = 0;
	public String style = STYLE_ROOM_HEALTHY;		//default
	
	public String toString() {
		StringBuilder builder = new StringBuilder();
		builder.append("<rect x=\"" + x + "\" ");
		builder.append("y=\"" + y + "\" ");
		builder.append("rx=\"" + rx + "\" ");
		builder.append("ry=\"" + ry + "\" ");
		builder.append("width=\"" + width + "\" ");
		builder.append("height=\"" + height + "\" ");
		builder.append("style=\"" + style + "\"" );
		builder.append(" />\n");
		return builder.toString();
	}
}
