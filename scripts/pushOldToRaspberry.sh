#!/bin/bash 
scp index.js pi@homebridge.michas.selfip.com:/tmp
ssh pi@homebridge.michas.selfip.com sudo mv /tmp/index.js /usr/lib/node_modules/homebridge-zway-plugin
