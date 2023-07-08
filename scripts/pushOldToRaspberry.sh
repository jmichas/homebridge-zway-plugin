#!/bin/bash 
scp old/index.js old/package.json pi@homebridge.michas.selfip.com:/tmp
ssh pi@homebridge.michas.selfip.com
sudo mv /tmp/index.js /usr/lib/node_modules/homebridge-zway-plugin
sudo mv /tmp/package.json /usr/lib/node_modules/homebridge-zway-plugin
#sudo mv /tmp/package-lock.json /usr/lib/node_modules/homebridge-zway-plugin
sudo rm -r /usr/lib/node_modules/homebridge-zway-plugin/dist