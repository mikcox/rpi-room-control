# IR receiver tests can be run with:

sudo /etc/init.d/lirc stop
mode2 -d /dev/lirc0

# To train the pi with different remotes, you can run variations on the following:
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

