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
	public int mapX = 0;   //co-ordinates in the Game On map world
	public int mapY = 0;
	public int rx = 0;
	public int ry = 0;
	public int width = 0;
	public int height = 0;
	public boolean empty = false;
	public int styleTyle = 1;
	
	public String toString() {
		StringBuilder builder = new StringBuilder();
		builder.append("<rect x=\"" + x + "\" ");
		builder.append("y=\"" + y + "\" ");
		builder.append("rx=\"" + rx + "\" ");
		builder.append("ry=\"" + ry + "\" ");
		builder.append("width=\"" + width + "\" ");
		builder.append("height=\"" + height + "\" ");
		if(empty) {
		    builder.append("style=\"" + STYLE_EMPTY + "\"" );
		} else {
		    builder.append("style=\"" + getStyle() + "\"" );
		}
		builder.append(" />\n");
		return builder.toString();
	}
	
	private String getStyle() {
	    StringBuilder style = new StringBuilder();
	    style.append("fill:");
	    switch(styleTyle) {
	        case 2 :
	            style.append(getSweepColour());
	            break;
	        default :
	            style.append(getDefaultColour());
	            break;
	    }
	    
	    style.append(";stroke:black;stroke-width:1;opacity:0.5");
	    return style.toString();
	}
	
	private RGB getDefaultColour() {
	    if((mapX == 0) && (mapY ==0)) {
	        //first room
	        return new RGB(199, 223, 245);
	    } else {
	        //healthy room colour - TODO make this work for sick rooms
	        return new RGB(185, 243, 97);
	    }
	}
	
	//determine the colour of the rectangle based on it's proximity to the centre, like an archery target.
	private RGB getSweepColour() {
	    int distance = Math.max(Math.abs(mapX), Math.abs(mapY)); //how far from the centre is the room
	    switch(distance) {
	        case 0 : //this is first room
	            return new RGB(199, 223, 245);
	        case 1 : //this is the gold ring
	            return new RGB(255, 255, 179);
	        case 2 : //this is the red ring
	            return new RGB(255, 173, 153);
	        case 3 : //this is the blue ring
	            return new RGB(179, 204, 255);
	        case 4 : //this is the black ring
	            return new RGB(224, 224, 235);
	        default : //the room is not placed
	            return new RGB(255, 255, 255);
	    }
	}
	
	private class RGB {
	    int r;
	    int g;
	    int b;
	    
	    RGB(int r, int g, int b) {
	        this.r = r;
	        this.g= g;
	        this.b = b;
	    }
	    
	    public String toString() {
	        return "rgb(" + r + "," + g + "," + b + ")";
	    }
	}
}
