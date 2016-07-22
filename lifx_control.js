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
	}
}

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

	if ( payload.lights ) {
		// Deal with changes to the lights
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
	if ( payload.soundbar && payload.soundbar.on ) {
		// If the power of the soundbar isn't what we asked for, hit the soundbar's remote button
		if ( payload.soundbar.on !== roomState.soundbar.on ) {
			sendIRCommand( 'VIZIO_SOUNDBAR', 'KEY_POWER' );
			roomState.soundbar.on = payload.soundbar.on;
		}
	}

	// Deal with changes to the TV
	if ( payload.tv && payload.tv.on ) {
		// If the power of the TV isn't what we asked for, hit the TV's remote button
		if ( payload.tv.on !== roomState.tv.on ) {
			sendIRCommand( 'TV', 'KEY_POWER' );
			roomState.tv.on = payload.tv.on;
		}
	}
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
  /*light.getState(function(err, data) {
  	if ( err ) {
  		console.log( err );
  	} else {
  		console.log( 'Successfully got light state: ' + JSON.stringify(data) );
  	}
  });*/ 
});

client.init();

/*setInterval(function() {
	for ( var i = 0; i < lights.length; i++ ) {
		var rand = Math.random();
		if ( rand < 0.333333 ) {
			lights[i].color( 120, 100, 80 );
		} else if ( rand < 0.66666667 ) {
			lights[i].color( 0, 100, 80 );
		} else {
			lights[i].color( 240, 100, 80 );
		}
	}
}, 2000);*/

function allLightsWhite() {
	for ( var i = 0; i < lights.length; i++ ) {
		lights[i].color( 0, 0, 100 );
	}
}

function sendIRCommand( remote, key ) {
	var cmd = exec('irsend SEND_ONCE ' + remote + ' ' + key, function(error, stdout, stderr) {
		if ( error ) {
			console.log( 'Error ' + error + ' sending command line command: ' + stderr );
			return;
		}
		console.log( 'Successfully sent IR key press: ' + remote + ', ' + key );
	});
}

// var light1 = client.light('Ceiling Fan Bulb 1');
// console.log(light1);
// var light2 = client.light('Ceiling Fan Bulb 2');
// var light3 = client.light('Ceiling Fan Bulb 3');

// light1.color(50, 50, 80);
// light2.color(0, 50, 80);
// light3.color(160, 50, 80);