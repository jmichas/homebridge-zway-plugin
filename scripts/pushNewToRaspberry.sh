#!/bin/bash
. ./local-config.sh
#echo 'sudo password for pi'
#read pwd
scp -r dist $SERVER:/tmp/hbzp/dist
scp package.json config.schema.json $SERVER:/tmp/hbzp
ssh $SERVER
sudo mv -r /tmp/hbzp/dist /usr/lib/node_modules/homebridge-zway-plugin/dist
sudo mv /tmp/hbzp/package.json /usr/lib/node_modules/homebridge-zway-plugin
sudo mv /tmp/hbzp/config.schema.json /usr/lib/node_modules/homebridge-zway-plugin
