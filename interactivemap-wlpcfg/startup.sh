#!/bin/bash
#!/bin/bash

# Configure our link to etcd based on shared volume with secret
if [ ! -z "$ETCD_SECRET" ]; then
  . /data/primordial/setup.etcd.sh /data/primordial $ETCD_SECRET
fi

export CONTAINER_NAME=mediator

SERVER_PATH=/opt/ol/wlp/usr/servers/defaultServer

if [ "$ETCDCTL_ENDPOINT" != "" ]; then
  echo Setting up etcd...
  echo "** Testing etcd is accessible"
  etcdctl --debug ls
  RC=$?

  while [ $RC -ne 0 ]; do
      sleep 15

      # recheck condition
      echo "** Re-testing etcd connection"
      etcdctl --debug ls
      RC=$?
  done
  echo "etcdctl returned sucessfully, continuing"

  mkdir -p /etc/cert
  etcdctl get /proxy/third-party-ssl-cert > /etc/cert/cert.pem
fi

if [ -f /etc/cert/cert.pem ]; then
  echo "Building keystore/truststore from cert.pem"
  echo "-creating dir"
  mkdir -p ${SERVER_PATH}/resources/security
  echo "-cd dir"
  cd ${SERVER_PATH}/resources/
  echo "-converting pem to pkcs12"
  openssl pkcs12 -passin pass:keystore -passout pass:keystore -export -out cert.pkcs12 -in /etc/cert/cert.pem
  echo "-importing pem to truststore.jks"
  keytool -import -v -trustcacerts -alias default -file /etc/cert/cert.pem -storepass truststore -keypass keystore -noprompt -keystore security/truststore.jks
  echo "-creating dummy key.jks"
  keytool -genkey -storepass testOnlyKeystore -keypass wefwef -keyalg RSA -alias endeca -keystore security/key.jks -dname CN=rsssl,OU=unknown,O=unknown,L=unknown,ST=unknown,C=CA
  echo "-emptying key.jks"
  keytool -delete -storepass testOnlyKeystore -alias endeca -keystore security/key.jks
  echo "-importing pkcs12 to key.jks"
  keytool -v -importkeystore -srcalias 1 -alias 1 -destalias default -noprompt -srcstorepass keystore -deststorepass testOnlyKeystore -srckeypass keystore -destkeypass testOnlyKeystore -srckeystore cert.pkcs12 -srcstoretype PKCS12 -destkeystore security/key.jks -deststoretype JKS
  echo "done"
  cd ${SERVER_PATH}
fi

exec /opt/ol/wlp/bin/server run defaultServer
