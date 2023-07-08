#!/bin/bash
#echo 'sudo password for pi'
#read pwd
scp -r dist pi@homebridge.michas.selfip.com:/tmp/hbzp/dist
scp package.json config.schema.json pi@homebridge.michas.selfip.com:/tmp/hbzp
ssh pi@homebridge.michas.selfip.com
sudo mv -r /tmp/hbzp/dist /usr/lib/node_modules/homebridge-zway-plugin/dist
sudo mv /tmp/hbzp/package.json /usr/lib/node_modules/homebridge-zway-plugin
sudo mv /tmp/hbzp/config.schema.json /usr/lib/node_modules/homebridge-zway-plugin
