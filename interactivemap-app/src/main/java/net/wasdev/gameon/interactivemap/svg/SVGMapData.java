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
import java.util.Collections;
import java.util.List;

import javax.inject.Inject;
import javax.servlet.ServletContext;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.EntityTag;
import javax.ws.rs.core.Request;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.ResponseBuilder;
import javax.ws.rs.core.Response.Status;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiParam;
import net.wasdev.gameon.interactivemap.MapController;
import net.wasdev.gameon.interactivemap.MapData;
import net.wasdev.gameon.map.models.RoomInfo;
import net.wasdev.gameon.map.models.Site;

@Path("svg")
@Api( tags = {"interactivemap", "svg"})
public class SVGMapData {
    @Inject
    private MapController mapctrl = null;
    
    private MapData data = null;

    /**
     * GET /interactivemap/v1/svg
     */
    @GET
    @io.swagger.annotations.ApiOperation(value = "Generate SVG for the specified co-ordinates",
        notes = "")
    public Response getData(@Context Request req,
            @ApiParam(value = "Depth for the generated map") @QueryParam("depth") String pdepth,
            @ApiParam(value = "x co-ordinate for the map centre") @QueryParam("x") String px,
            @ApiParam(value = "y co-ordinate for the map centre") @QueryParam("y") String py,
            @ApiParam(value = "Style for the tiles") @QueryParam("style") int style) {
        
        ResponseBuilder builder = null;     //the response builder to use
        
        if(mapctrl != null) {
            EntityTag tag = new EntityTag(mapctrl.getHash() + "-" + style);
            if((builder = req.evaluatePreconditions(tag)) != null) {
                System.out.println("ETag match - return not modified");
                return builder.build();
            } else {
                builder = Response.ok();
                builder.tag(tag);
            }
            data = mapctrl.getMapData();
        }
        if(data.isEmpty()) {
            return Response.noContent().build();
        }
        
        int depth = ((pdepth == null) || pdepth.isEmpty()) ? 1 : Integer.valueOf(pdepth);
        depth++;    //depth is 1 indexed
        int x = ((px == null) || px.isEmpty()) ? 0 : Integer.valueOf(px);
        int y = ((py == null) || py.isEmpty()) ? 0 : Integer.valueOf(py);
        
        //alter to provide a step mapping at the specified depth
        x *= ((depth * 2) - 1);
        y *= ((depth * 2) - 1);
        
        //walk the map and send back 
        String svg = walkSites(depth, x + data.getDeltaX(), y + data.getDeltaY(), style).toString();
        builder.status(Status.OK).entity(svg.toString());
        builder.type("image/svg+xml");
        return builder.build();
    }

    private SVG walkSites(int depth, int originX, int originY, int style) {
        int tileSize = 255;
        int size = (depth * 2) - 1;
        int rsize = tileSize / size;
                
        int startX = originX - (size / 2);
        int startY = originY - (size / 2);
        
        int endX = startX + size;
        int endY = startY + size;

        SVG svg = new SVG();
        svg.height = tileSize;
        svg.width = tileSize;
        
        for(int y = startY; y < endY; y++) {
            for(int x = startX; x < endX; x++) {
                Rect r = new Rect();
                r.height = rsize;
                r.width = rsize;
                r.x = (x - startX) * rsize;
                r.y = (y - startY) * rsize;
                r.styleTyle = style;
                List<SVGElement> texts = null;
                Site site = null;

                if((x >= 0) && (x < data.getSites()[0].length)) {
                    if((y >= 0) && (y < data.getSites().length)) {
                        site = data.getSites()[y][x];
                    }
                }
                if(site != null) {
                    RoomInfo info = site.getInfo();
                    if(info != null) {
                        String roomId = info.getName();
                        r.mapX = site.getCoord().getX();
                        r.mapY = site.getCoord().getY();
                        switch(depth) {
                            case 1 :
                                String name = info.getFullName();
                                //String desc = info.getDescription();
                                //TODO : get description formatting correctly
                                texts = getText(depth, name, r.x + 10, r.y + 20);
                                svg.addElements(texts);
                                break;
                            case 2 :
                                texts = getText(depth, info.getName(), r.x + 10, r.y + 20);
                                svg.addElements(texts);
                                break;
                            default :
                                texts = Collections.emptyList();
                                svg.addElements(texts);
                                break;
                        }
                        /*
                        if((roomId != null) && roomId.equalsIgnoreCase("First Room")) {
                            r.style = Rect.STYLE_FIRST_ROOM;
                        }
                        */
                    }
                }
                if(texts == null) {
                    texts = getText(depth, "[EMPTY]", r.x + 10, r.y + 20);
                    //r.style = Rect.STYLE_EMPTY;
                    r.empty = true;
                    svg.addElements(texts);
                }
                svg.addElement(r);
            }
        }
        return svg;
    }

    
    
    //trims text to the appropriate level for the depth
    private List<SVGElement> getText(int depth, String text, int offsetX, int offsetY) {
        if(text == null) {
            text = "(missing)";
        }
        List<SVGElement> texts = new ArrayList<>();
        int len = 0;
        int lines = 0;
        if(depth < 3) {
            len = (depth == 1) ? 25 : 8;
            lines = (depth == 1) ? 5 : 1;
        }
        StringBuilder builder = new StringBuilder();
        for(int i = 0; (lines > 0) && (i < text.length()); i++) {
            char c = text.charAt(i);
            switch(c) {
                case '\n':  //skip new lines in original text
                case '\r':
                    break;
                default:
                    builder.append(c);
                    if(((i % len) == 0) && (i > 0)) {
                        lines--;
                        Text t = new Text();
                        t.x = offsetX;
                        t.y = offsetY;
                        t.value = builder.toString();
                        texts.add(t);
                        builder = new StringBuilder();
                        offsetY += 10;
                    }
                    break;
            }
        }
        if(builder.length() > 0) {
            Text t = new Text();
            t.x = offsetX;
            t.y = offsetY;
            t.value = builder.toString();
            texts.add(t);   
        }
        return texts;
    }    
}
