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

import java.util.ArrayList;
import java.util.List;

public class SVG {
	private final List<SVGElement> elements = new ArrayList<>();
	public int width = 400;
	public int height = 400;
	
	public void addElement(SVGElement element) {
		elements.add(element);
	}
	
	public void addElements(List<SVGElement> elements) {
		for(SVGElement e : elements) {
			this.elements.add(e);
		}
	}
	
	public String toString() {
		StringBuilder builder = new StringBuilder();
		builder.append("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n");
		builder.append("<svg xmlns:svg=\"http://www.w3.org/2000/svg\" xmlns=\"http://www.w3.org/2000/svg\" ");
		builder.append("width=\"" + width + "\" height=\"" + height + "\">\n");
		for(SVGElement element : elements) {
			builder.append(element);
		}
		builder.append("</svg>\n");
		return builder.toString();
	}
}
