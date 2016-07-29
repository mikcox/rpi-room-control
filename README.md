# Raspberry Pi-powered home automation controller

This repository contains code I'm running on a Raspberry Pi in my home.  This code allows the pi to interact with devices in my home and is controllable via the Alexa skill documented in [this repository](https://github.com/vssystemluba/alexa-room-control).

The universal IR remote code in this repository was created using [this tutorial](http://alexba.in/blog/2013/01/06/setting-up-lirc-on-the-raspberrypi/).  Specifically, the following example commands were particularly useful:  
```
# IR receiver tests can be run with:

sudo /etc/init.d/lirc stop
mode2 -d /dev/lirc0

To train the pi with different remotes, you can run variations on the following:
# Stop lirc to free up /dev/lirc0
sudo /etc/init.d/lirc stop

# Create a new remote control configuration file (using /dev/lirc0) and save the output to ~/lircd.conf
irrecord -d /dev/lirc0 ~/lircd.conf

# Make a backup of the original lircd.conf file
sudo mv /etc/lirc/lircd.conf /etc/lirc/lircd_original.conf

# Copy over your new configuration file
sudo cp ~/lircd.conf /etc/lirc/lircd.conf

# Start up lirc again
sudo /etc/init.d/lirc start

# To send various IR commands you just created, use commands like the following:
# List all of the commands that LIRC knows for 'yamaha'
irsend LIST yamaha ""

# Send the KEY_POWER command once
irsend SEND_ONCE yamaha KEY_POWER

# Send the KEY_VOLUMEDOWN command once
irsend SEND_ONCE yamaha KEY_VOLUMEDOWN
```

# Running the script on the Pi:
The main NodeJS script is in lifx_control.js.  However, we want this to run automatically when the Pi boots.  Currently, I am doing this using the following line in crontab:

`@reboot sudo /home/pi/Documents/ir_blaster/roomControl.sh > /dev/null &`


