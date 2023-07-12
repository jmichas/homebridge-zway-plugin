#!/bin/bash 
. ./local-config.sh
scp old/index.js old/package.json $SERVER:/tmp
ssh $SERVER
sudo mv /tmp/index.js /usr/lib/node_modules/homebridge-zway-plugin
sudo mv /tmp/package.json /usr/lib/node_modules/homebridge-zway-plugin
#sudo mv /tmp/package-lock.json /usr/lib/node_modules/homebridge-zway-plugin
sudo rm -r /usr/lib/node_modules/homebridge-zway-plugin/dist