FROM gameontext/docker-liberty-custom

ENV SERVERDIRNAME player

COPY ./startup.sh /opt/startup.sh
ADD ./servers/interactivemap /opt/ol/wlp/usr/servers/defaultServer/

CMD ["/opt/startup.sh"]

HEALTHCHECK \
  --timeout=10s \
  --start-period=40s \
  CMD wget -q -O /dev/null http://localhost:9080/
