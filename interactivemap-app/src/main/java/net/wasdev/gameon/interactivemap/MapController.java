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

import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import javax.enterprise.context.ApplicationScoped;

import com.fasterxml.jackson.databind.ObjectMapper;

import net.wasdev.gameon.map.models.Coordinates;
import net.wasdev.gameon.map.models.Site;

//this is a singleton controller for interacting with the map service
@ApplicationScoped
public class MapController implements Runnable {
    private static final String ENV_URL = "org.gameontext.map.url";                 //env var to look for map URL in
    private static final String DEFAULT_URL = "https://game-on.org/map/v1/sites";   //default URL for talking to the map service
    private static final String TEST_URL = "test";
    
    private final ScheduledExecutorService execsvc = Executors.newScheduledThreadPool(1);
    
    private final String url;
    private int deltaX = 0;
    private int deltaY = 0;
    private volatile MapData mapData = MapData.EMPTY_DATA();        //the current map data
    private CountDownLatch latch = null;
    
    public MapController() {
        String url = System.getenv(ENV_URL);
        if(url == null) {
            url = DEFAULT_URL;
        }
        this.url = url;
        System.out.println("MapController created.");
    }

    public String getUrl() {
        return url;
    }

    public MapData getMapData() {
        return mapData;
    }
    
    /**
     * Force an update of the map, will block until the update
     * is complete.
     */
    public void updateNow() {
        try {
            latch = new CountDownLatch(1);
            latch.await();
        } catch (InterruptedException e) {
            //do nothing, propogate interrupt
            Thread.currentThread().interrupt();
        } 
    }

    @PostConstruct
    public void init() {
        try {
            latch = new CountDownLatch(1);
            execsvc.scheduleAtFixedRate(this, 0, 30, TimeUnit.SECONDS);
            latch.await();
        } catch (InterruptedException e) {
            //do nothing, propogate interrupt
            Thread.currentThread().interrupt();
        } 
    }
    
    @PreDestroy
    public void cleanup() {
        execsvc.shutdown();     //stop making requests
    }

    @Override
    public void run() {
        try {
            InputStream stream = getMapData(url);
            if(stream == null) {
                System.out.println("Could not get map data from " + url);
                return;
            }
            Site[] sites = convert(stream);
            mapData = parseMapData(sites);          
        } catch (Exception e) {
            System.err.println("Error getting map data " + e.getMessage());
            e.printStackTrace();
        } finally {
            latch.countDown();
        }
        
    }
    
    //get the Map data, which may result in a new call to GameOn to refresh the locally cached data
    private InputStream getMapData(String url) throws IOException {
        //temp hard code to use the local test data
        if(url.equalsIgnoreCase(TEST_URL)) {
            System.out.println("Warning : Using test data");
            return getClass().getResourceAsStream("/data/sites.json");
        }
        URL l = new URL(url);
        return l.openConnection().getInputStream();
    }
    
    //convert the stream contents to a JSON
    private Site[] convert(InputStream stream) throws IOException {
        ObjectMapper mapper = new ObjectMapper();
        
        return mapper.readValue(stream, Site[].class);
    }

    private MapData parseMapData(Site[] sites) throws IOException {
        Site[][] data = null;
        int minx = 0;
        int maxx = 0;
        int miny = 0;
        int maxy = 0;
        
        for(Site site : sites) {
            Coordinates coord = site.getCoord();
            int x = coord.getX();
            int y = coord.getY();
            if(x < minx) minx = x;
            if(x > maxx) maxx = x;
            if(y < miny) miny = y;
            if(y > maxy) maxy = y;    
        }
        //System.out.println("\nminX = " + minx + ", maxX = " + maxx);
        //System.out.println("\nminY = " + miny + ", maxY = " + maxy);
        deltaX = (minx * -1);
        deltaY = (miny * -1);
        //System.out.println("[deltaX = " + deltaX + ", deltaY = " + deltaY + "]");
        int diffx = Math.max(maxx + deltaX, Math.abs(minx - deltaX));
        int diffy = Math.max(maxy + deltaY, Math.abs(miny - deltaY));
        //System.out.println("[diffX = " + diffx + ", diffY = " + diffy + "]");
        int size = Math.max(diffx, diffy) + 1; //co-ords are 0 based, so need to account for this when creating array
        //System.out.println("Size = " + size);
        data = new Site[size][size];
        for(Site site : sites) {
            Coordinates coord = site.getCoord();
            int x = coord.getX();
            int y = coord.getY();
            //System.out.println("[x = " + x + ", y = " + y + "]");
            data[deltaY - y][x + deltaX] = site;
        } 
        return new MapData(deltaX, deltaY, data);
    }
}
