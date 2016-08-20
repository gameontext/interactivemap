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

import javax.inject.Inject;
import javax.servlet.ServletContext;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.ResponseBuilder;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiParam;
import net.wasdev.gameon.interactivemap.MapController;
import net.wasdev.gameon.interactivemap.MapData;
import net.wasdev.gameon.map.models.Coordinates;
import net.wasdev.gameon.map.models.RoomInfo;
import net.wasdev.gameon.map.models.Site;

@Path("geojson")
@Api( tags = {"interactivemap", "geojson"})
public class GeoJSONMapData {
    @Inject
    private MapController mapctrl = null;
    
    private MapData data = null;

    /**
     * GET /interactivemap/v1/geojson
     */
    @GET
    @Path("features")
    @Produces(MediaType.APPLICATION_JSON)
    @io.swagger.annotations.ApiOperation(value = "Generate a list of features for the specified co-ordinates",
        notes = "")
    public Response getData(@Context ServletContext ctx,
            @ApiParam(value = "Depth for the generated map") @QueryParam("depth") String pdepth, @QueryParam("id") String id) {

        if(mapctrl != null) {
            data = mapctrl.getMapData();
        }
        if(data.isEmpty()) {
            return Response.noContent().build();
        }
        
        int depth = ((pdepth == null) || pdepth.isEmpty()) ? 1 : Integer.valueOf(pdepth);
        
        FeatureCollection features = walkSites(depth);
        ResponseBuilder builder = Response.ok().entity(features.toString());
        return builder.build();
    }

    private FeatureCollection walkSites(int depth) {
        FeatureCollection features = new FeatureCollection();

        for(int y = 0; y < data.getSites().length; y++) {
            for(int x = 0; x < data.getSites()[y].length; x++) {
                Site site = data.getSites()[y][x];
                if(site != null) {
                    RoomInfo info = site.getInfo();
                    if(info != null) {    //skip empty rooms i.e. those with no info
                        Feature feature = new Feature();
                        feature.addProperty("id", site.getId());
                        feature.addProperty("name", info.getName());
                        feature.addProperty("fullName", info.getFullName());
                        feature.addProperty("description", info.getDescription());
                        feature.addProperty("owner", site.getOwner());
                        feature.addProperty("d", info.getDoors().getD());
                        feature.addProperty("u", info.getDoors().getU());
                        feature.addProperty("n", info.getDoors().getN());
                        feature.addProperty("e", info.getDoors().getE());
                        feature.addProperty("s", info.getDoors().getS());
                        feature.addProperty("w", info.getDoors().getW());
                        Coordinates coord = site.getCoord();
                        Point p = new Point();
                        p.x = coord.getX();
                        p.y = coord.getY(); 
                        feature.setGeometry(p);
                        features.add(feature);
                    }
                }
            }
        }
        return features;
    }
    
    /**
     * Escape data that is intended to be inserted into JSON
     * @param data the data to be escaped
     * @return escaped data suitable for JSON
     */
    public static String escapeJSON(String data) {
        StringBuilder result = new StringBuilder();
        for(int i = 0; i < data.length(); i++) {
            char c = data.charAt(i);
            switch(c) {
                case '\b':
                    result.append("\\b");
                    break;
                case '\f':
                    result.append("\\f");
                    break;
                case '\n':
                    result.append("\\n");
                    break;
                case '\t':
                    result.append("\\t");
                    break;
                case '"':
                    result.append("\\\"");
                    break;
                case '\\':
                    result.append("\\\\");
                    break;
                default :
                    result.append(c);
                    break;
            }
        }
        return result.toString();
    }
}
