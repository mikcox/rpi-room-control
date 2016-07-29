var LifxClient = require('node-lifx').Client;
var exec = require('child_process').exec;
var awsIot = require('aws-iot-device-sdk');

// 
var device = awsIot.device({
  "host": "a1hpdzughvb7b0.iot.us-west-2.amazonaws.com",
  "port": 8883,
  "clientId": "my-room-activator",
  "thingName": "My_Room",
  "caCert": "aws_certs/root-CA.crt",
  "clientCert": "aws_certs/0a5ea7d8f3-certificate.pem.crt",
  "privateKey": "aws_certs/0a5ea7d8f3-private.pem.key"
});

// Keep track of the room's state as last seen by the pi.  This will help decide which buttons
// need to be pressed to achieve the desired state that was published by Alexa.
var roomState = {
	soundbar: {
		on: false
	},
	tv: {
		on: false
	},
	ac: {
		on: false,
		mode: 'energy_saver'
	}
}

var ac_modes = ['energy_saver', 'cool', 'fan', 'dry'];

// Subscribe to the AWS IoT MQTT topic corresponding to the room
//
// Device is an instance returned by mqtt.Client(), see mqtt.js for full
// documentation.
//
device.on('connect', function() {
	console.log('Connecting to AWS IoT...');
	device.subscribe('$aws/things/My_Room/shadow/update/accepted', 0, function(err, result) {
		if(err) {
			console.log(err)
		} else {
			console.log('Subscribed to /update/accepted: ' + JSON.stringify(result));
		}
		});
		device.subscribe('$aws/things/My_Room/shadow/update/rejected', 0, function(err, result) {
		if(err) {
			console.log(err)
		} else {
			console.log('Subscribed to /update/rejected: ' + JSON.stringify(result));
		}
	});
});

device.on('message', function(topic, payload) {
	console.log( 'Received message on topic ' + topic + ': ' + JSON.stringify(JSON.parse(payload).state.desired) );

	payload = JSON.parse( payload ).state.desired;


	// Deal with changes to the lights
	if ( payload.lights ) {
		var hue = payload.lights.hue ? parseInt( payload.lights.hue ) : 0;
		var sat = payload.lights.sat ? parseInt( payload.lights.sat ) : 0;
		var bri = payload.lights.bri ? parseInt( payload.lights.bri ) : 100;

		// Change the lights based on what was just received on the topic
		for ( var i = 0; i < lights.length; i++ ) {
			if ( payload.lights.on === false ) {
				lights[i].off();
			} else {
				lights[i].on();
				lights[i].color( hue, sat, bri );
			}
		}

		console.log( 'Successfully sent color change command to lights.' );
	}

	// Deal with changes to the soundbar
	if ( payload.soundbar ) {
		// If the power of the soundbar isn't what we asked for, hit the soundbar's remote button
		if ( payload.soundbar.on !== roomState.soundbar.on ) {
			sendIRCommand( 'VIZIO_SOUNDBAR', 'KEY_POWER' );
			roomState.soundbar.on = payload.soundbar.on;
		}
	}

	// Deal with changes to the TV
	if ( payload.tv ) {
		// If the power of the TV isn't what we asked for, hit the TV's remote button
		if ( payload.tv.on !== roomState.tv.on ) {
			sendIRCommand( 'TV', 'KEY_POWER' );
			roomState.tv.on = payload.tv.on;
		}
	}

	// Deal with changes to the AC
	if ( payload.ac ) {
		// If the power of the AC isn't what we asked for, hit the AC's remote button
		if ( payload.ac.on !== roomState.ac.on ) {
			sendIRCommand( 'AIR_CONDITIONER', 'KEY_POWER' );
			roomState.ac.on = payload.ac.on;
		}

		if ( payload.ac.mode ) {
			changeACmode( payload.ac.mode );
		}
	}

	console.log('New room state: ' + JSON.stringify( roomState, null, 2 ));
})

// Create a new client we can use in the future to talk to the lights
var client = new LifxClient();

var lightCounter = 0;

var lights = [];

var color = '';

client.on('light-new', function(light) {
  //console.log(light);
  lights.push( light );

  if ( lights.length === 3 ) {
  	allLightsWhite();
  }
});

client.init();

function allLightsWhite() {
	for ( var i = 0; i < lights.length; i++ ) {
		lights[i].color( 0, 0, 100 );
	}
}

var outstandingIRCommands = 0;

function sendIRCommand( remote, key ) {
	// If we have one or more outstanding IR commands, wait until the other have finished before sending a new one
	if ( outstandingIRCommands > 0 ) {
		setTimeout(function() {
			sendIRCommand( remote, key );
		}, 10);
	} else {
		outstandingIRCommands ++ ;
		var cmd = exec('irsend SEND_ONCE ' + remote + ' ' + key, function(error, stdout, stderr) {
			if ( error ) {
				console.log( 'Error ' + error + ' sending command line command: ' + stderr );
				return;
			}
			console.log( 'Successfully sent IR key press: ' + remote + ', ' + key );
			outstandingIRCommands -- ;
		});
	}
}

function changeACmode( mode ) {
	var numModeChanges = 0;
	if ( mode !== roomState.ac.mode ) {
		switch( roomState.ac.mode ) {
			case 'energy_saver':
				switch( mode ) {
					case 'cool':
						numModeChanges = 1;
						break;
					case 'fan':
						numModeChanges = 2;
						break;
					case 'dry':
						numModeChanges = 3;
						break;
				}
				break;
			case 'cool':
				switch( mode ) {
					case 'fan':
						numModeChanges = 1;
						break;
					case 'dry':
						numModeChanges = 2;
						break;
					case 'energy_saver':
						numModeChanges = 3;
						break;
				}
				break;
			case 'fan':
				switch( mode ) {
					case 'dry':
						numModeChanges = 1;
						break;
					case 'energy_saver':
						numModeChanges = 2;
						break;
					case 'cool':
						numModeChanges = 3;
						break;
				}
				break;
			case 'dry':
				switch( mode ) {
					case 'energy_saver':
						numModeChanges = 1;
						break;
					case 'cool':
						numModeChanges = 2;
						break;
					case 'fan':
						numModeChanges = 3;
						break;
				}
				break;
		}

		for ( var i = 0; i < numModeChanges; i++ ) {
			sendIRCommand( 'AIR_CONDITIONER', 'KEY_MODE');
		}

		roomState.ac.mode = mode;
	}
};