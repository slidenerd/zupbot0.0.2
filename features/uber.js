'use strict';
const request = require('request')
const geocoder = require('./geocoder');
const Uber = require('node-uber');

const uber = {
    endPoint: 'https://sandbox-api.uber.com/v1/',
    accessToken: 'dlQLWx7Rz1SBuqYWbRWoDkADNbm7Ka15cHbu1Zq3',
}

const uberObj = new Uber({
    client_id: '2D_Wy-fU_jcAXgP8_DT9Oze_xg3nnpfx',
    client_secret: 'X2_zVVpoigocAk2Cdr44i9XoxQg03Uw3gYwjce8j',
    server_token: uber.accessToken,
    // redirect_uri: 'http://localhost:3000/auth/uber/callback',
    redirect_uri: 'https://zup.chat/auth/uber/callback',
    name: 'zup.chat',
    language: 'en_US', // optional, defaults to en_US
    sandbox: true // optional, defaults to false
});

const headers = {
    'Accept': 'application/json',
    'Authorization': 'Token ' + uber.accessToken 
};

// var resObj = {};
// var done = false;

uber.login = function(req, res) {
    var url = uberObj.getAuthorizeUrl(['history','profile', 'request', 'places']);
    res.redirect(url);
}

uber.authorization = function(authToken, callback) {
    uberObj.authorization(authToken, callback);
}

uber.getRideEstimate = function(from, to, callback) {
    var option = 0;
    var args = new Object();
    var geoCallback = function(err, res) {
        if(err) {
            //TODO:
            console.log("Error : " + err);
        } else {
            switch (option) {
                case 0:
                    args.lat = res[0].latitude;
                    args.long = res[0].longitude;
                    option++;
                    geocoder.geocode(to, geoCallback);
                break;
                case 1:
                    args.droplat = res[0].latitude;
                    args.droplong = res[0].longitude;
                    uber.getRidePriceEstimateCoordinates(callback, args);
                    uber.getRideTimeEstimateCoordinates(callback, args);
                break;    
            }
        }
    };
    geocoder.geocode(from, geoCallback);
}

uber.getRidePriceEstimateCoordinates = function(resObj, callback, args) {
    var options = {
        url: uber.endPoint + 'estimates/price?start_latitude=' + args.lat + "&start_longitude=" + args.long + 
        "&end_latitude=" + args.droplat + "&end_longitude=" + args.droplong,
        headers: headers,
        json: true
    }
    request.get(options, (error, response, body) => {
        if(error) {
            console.log(error);
        }
        // console.log(body);
    	if(body && body.prices) {
    		for(var i = 0; i < body.prices.length; i++) {
    			var price = body.prices[i];
    			var obj;
    			if(resObj.hasOwnProperty(price.display_name)) {
    				obj = resObj[price.display_name];
    			} else {
	    			obj = {}
	    			obj.product_id = price.product_id;	    			
    			}
    			obj.display_name = price.display_name;
    			obj.high_price = price.high_estimate;
    			obj.low_price = price.low_estimate;
    			obj.duration = price.duration;
    			obj.distance = price.distance;
    			resObj[price.display_name] = obj;
    		}
    	} else {
            console.log("Something went wrong in getRidePriceEstimateCoordinates " + JSON.stringify(body));
        }
        if(!resObj.done) {
        	resObj.done = true;
        } else {
        	callback(resObj);
        }
    })
}

uber.getRideTimeEstimateCoordinates = function(resObj, callback, args) {
    var options = {
        url: uber.endPoint + 'estimates/time?start_latitude=' + args.lat + "&start_longitude=" + args.long,
        headers: headers,
        json: true
    }
    request.get(options, (error, response, body) => {
        if(error) {
            console.log(error);
            return;
        }
        // console.log(body);
    	if(body && body.times) {
    		for(var i = 0; i < body.times.length; i++) {
    			var time = body.times[i];
    			var obj;
    			if(resObj.hasOwnProperty(time.display_name)) {
    				obj = resObj[time.display_name];
    			} else {
	    			obj = {}
	    			obj.product_id = time.product_id;
    			}
    			obj.eta = time.estimate;
    			resObj[time.display_name] = obj;
    		}
    	}

        if(!resObj.done) {
        	resObj.done = true;
        } else {
        	callback(resObj);
        }
    })
}

uber.getRideEstimateCoordinates = function(uberCallback, args) {
    var resObj = new Object();
    resObj.done = false;
    uber.getRidePriceEstimateCoordinates(resObj, uberCallback, args);
    uber.getRideTimeEstimateCoordinates(resObj, uberCallback, args);
}


uber.bookRide = function(req, callback, args) {
    var headers = {
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + req.session.uberToken 
    };
    var body = {
    	'start_latitude': args.lat,
    	'start_longitude': args.long,
    	'end_latitude': args.droplat,
    	'end_longitude': args.droplong,
    	'product_id': args.product_id
    }
    var options = {
        url: uber.endPoint + 'requests',
        headers: headers,
        body: body,
        json: true
    }
    request.post(options, (error, response, body) => {
		uber.handleBookResponse(req, body, body.request_id, callback);    	
    });
}

uber.pollRequest = function(req, request_id, callback) {
    var headers = {
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + req.session.uberToken 
    };
    var options = {
        url: uber.endPoint + 'requests/' + request_id,
        headers: headers,
        json: true
    }
    request.get(options, (error, response, body) => {
    	uber.handleBookResponse(req, body, request_id, callback);
        if(uberObj.sandbox) {
        	uber.dummyChangeStatusRequest(req, request_id);
        }
    });
}

//in sandbox we should change status manually
uber.dummyChangeStatusRequest = function(req, request_id) {
    var body = {
    	status: "accepted"
    }
    var headers = {
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + req.session.uberToken 
    };
    var options = {
        url: uber.endPoint + 'sandbox/requests/' + request_id,
        headers: headers,
        body: body,
        json: true
    }
    request.put(options, (error, response, body) => {
    });
}

uber.handleBookResponse = function(req, body, request_id, callback) {
    	if(body.status === "processing") {
    		setTimeout(() => {
    			uber.pollRequest(req, request_id, callback);
	    	}, 1000)
    	} else if(body.status === "no_drivers_available") {
    		var response = {
    			success: false,
    			message: "No driver available"
    		}
    		callback(response);
    	} else if(body.status === "accepted" || body.status === "arriving") {
    		var responseObj = {
    			success: false,
    			message: "Your booking is successful.",
    			'driver_name': body.driver.name,
                'driver_number': body.driver.phone_number,
                'cab_type': body.vehicle.make + ' ' + body.vehicle.model,
                'cab_number': body.vehicle.license_plate,
                'car_model': '',
                'eta': body.pickup.eta,
                'driver_lat': body.location.latitude,
                'driver_lng': body.location.longitude
    		}
            var headers = {
                'Accept': 'application/json',
                'Authorization': 'Bearer ' + req.session.uberToken 
            };
            var options = {
                url: uber.endPoint + 'requests/' + request_id + '/map',
                headers: headers,
                json: true
            }
            request.get(options, (error, response, body) => {
                if(body && body.href) {
                    responseObj.map = body.href;
                }
    			callback(responseObj);
            });
    	}
}
module.exports = uber