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

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.URL;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;
import java.util.logging.Level;
import java.util.stream.Collectors;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import javax.enterprise.context.ApplicationScoped;

import com.fasterxml.jackson.databind.ObjectMapper;

import net.wasdev.gameon.map.models.Coordinates;
import net.wasdev.gameon.map.models.Site;

//this is a singleton controller for interacting with the map service
@ApplicationScoped
public class MapController {
    private static final String ENV_URL = "mapurl";                 //env var to look for map URL in
    private static final String DEFAULT_URL = "https://game-on.org/map/v1/sites";   //default URL for talking to the map service
    private static final String TEST_URL = "test";
    
    private final ScheduledExecutorService execsvc = Executors.newScheduledThreadPool(2);
    
    private final String url;
    private int deltaX = 0;
    private int deltaY = 0;
    private volatile MapData mapData = MapData.EMPTY_DATA();        //the current map data
    private final Semaphore flag = new Semaphore(0);     //trigger the updates
    private volatile boolean exit = false;
    private MessageDigest digest = null;
    private String hash = null;
    
    public MapController() {
        String url = System.getenv(ENV_URL);
        if(url == null) {
            url = DEFAULT_URL;
        }
        this.url = url;
    }

    public String getUrl() {
        return url;
    }

    public MapData getMapData() {
        return mapData;
    }
    
    public String getHash() {
        return hash;
    }
    
    /**
     * Force an update of the map, will block until the update
     * is complete.
     */
    public void updateNow() {
        System.out.println("Ad-hoc update trigger fired");
        flag.release();
    }

    @PostConstruct
    public void init() {
        System.out.println("Initialising map controller");
        try {
            digest = MessageDigest.getInstance("SHA256");
        } catch (NoSuchAlgorithmException e) {
            Log.log(Level.WARNING, this, "Unable to initialse hash algorithm, E-Tag support is disabled.", e);
        }
        execsvc.schedule(new updateThread(), 0, TimeUnit.SECONDS);
        execsvc.scheduleAtFixedRate(new Runnable() {
            
            @Override
            public void run() {
                System.out.println("Scheduled update trigger fired");
                flag.release();
            }
        }, 0, 30, TimeUnit.SECONDS); 
    }
    
    @PreDestroy
    public void cleanup() {
        exit = true;
        flag.release();
        execsvc.shutdown();     //stop making requests
    }

    //thread to do query the map for updates, can be triggered by schedule or on demand
    private class updateThread implements Runnable {
        {
            System.out.println("Update thread created.");
        }
        
        @Override
        public void run() {
            System.out.println("Starting update thread");
            while(!exit) {
                try {
                    
                    flag.acquire();
                    if(exit) {
                        System.out.println("Shutting down map controller.");
                        break;
                    }
                    System.out.println("Getting data from " + url);
                    InputStream stream = getMapData(url);
                    if(stream == null) {
                        System.out.println("Could not get map data from " + url);
                        return;
                    }
                    Site[] sites = convert(stream);
                    mapData = parseMapData(sites); 
                    flag.drainPermits();    //get rid of any additional permits acquire during fetch
                  
                } catch (Exception e) {
                    System.err.println("Error getting map data " + e.getMessage());
                    e.printStackTrace();
                } 
            }
            System.out.println("Exiting update thread");
            
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
            
            //read the JSON data from the map service
            String sites = null;
            try (BufferedReader buffer = new BufferedReader(new InputStreamReader(stream))) {
                sites = buffer.lines().collect(Collectors.joining());
            }

            String digest = calcualteHash(sites);
            if(!digest.isEmpty()) {
                hash = digest;
            }
            return mapper.readValue(sites, Site[].class);
        }
        
        private String calcualteHash(String json) {
            StringBuilder hex = new StringBuilder();
            if(digest != null) {
                digest.reset();
                byte[] result = digest.digest(json.getBytes());
                for(byte b : result) {
                    hex.append(Long.toHexString(0xff & b).toLowerCase());
                }
            }
            return hex.toString();
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

}
