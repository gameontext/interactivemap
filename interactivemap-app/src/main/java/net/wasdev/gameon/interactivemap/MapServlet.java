package net.wasdev.gameon.interactivemap;

import java.io.IOException;

import javax.inject.Inject;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * General end point for controlling the map.
 * Some of these functions should be moved so that they are fired by message events
 */
@WebServlet("/update")
public class MapServlet extends HttpServlet {
	private static final long serialVersionUID = -3613121369882052754L;
	
	@Inject
    private MapController mapctrl = null;

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        if(mapctrl == null) {
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            return;
        }
        mapctrl.updateNow();
        resp.setStatus(HttpServletResponse.SC_OK);
    }

	
}
