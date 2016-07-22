#!/bin/sh

# Check for a valid internet connection before kicking off the node script
while ! ping -q -c 1 -W 1 8.8.8.8
	do sleep 1
done

cd /home/pi/Documents/ir_blaster
/usr/bin/node lifx_control.js
