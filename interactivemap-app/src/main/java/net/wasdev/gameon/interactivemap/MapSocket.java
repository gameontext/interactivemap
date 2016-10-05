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

import javax.websocket.CloseReason;
import javax.websocket.EndpointConfig;
import javax.websocket.OnClose;
import javax.websocket.OnError;
import javax.websocket.OnMessage;
import javax.websocket.OnOpen;
import javax.websocket.Session;
import javax.websocket.server.ServerEndpoint;

/**
 * Socket to allow clients to be notified 
 * of map updates as opposed to continually polling
 *
 */
@ServerEndpoint("/notify")
public class MapSocket {
    
    @OnOpen
    public void onOpen(Session session, EndpointConfig ec) {

    }

    @OnClose
    public void onClose(Session session, CloseReason r) {

    }

    @OnError
    public void onError(Session session, Throwable t) {

    }

    @OnMessage
    public void receiveMessage(String message, Session session) throws IOException {
        
    }
}
