'use strict';
const request = require('request')
const geocoder = require('./geocoder');

const uber = {
    accessToken: 'oRm1pDPIUtEtRyy3Ri2kjjTQZ5DgVM',
    endPoint: 'https://sandbox-api.uber.com/v1/'
}

var resObj = {};
var done = false;

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

uber.getRidePriceEstimateCoordinates = function(callback, args) {
	// console.log("fetching price");
    var headers = {
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + uber.accessToken 
    };
    var options = {
        url: uber.endPoint + 'estimates/price?start_latitude=' + args.lat + "&start_longitude=" + args.long + 
        "&end_latitude=" + args.droplat + "&end_longitude=" + args.droplong,
        headers: headers,
        json: true
    }
    request.get(options, (error, response, body) => {
    	// console.log("fetched price");	
    	done = true;
        if(error) {
            console.log(error);
        }
    	if(body) {
    		for(var i = 0; i < body.prices.length; i++) {
    			var price = body.prices[i];
    			var obj;
    			if(resObj.hasOwnProperty(price.display_name)) {
    				obj = resObj[price.display_name];
    			} else {
	    			obj = {}
    			}
    			obj.display_name = price.display_name;
    			obj.high_price = price.high_estimate;
    			obj.low_price = price.low_estimate;
    			obj.duration = price.duration;
    			obj.distance = price.distance;
    			resObj[price.display_name] = obj;
    		}
    	}

        if(!done) {
        	done = true;
        } else {
        	callback(resObj);
        }
    })
}

uber.getRideTimeEstimateCoordinates = function(callback, args) {
	// console.log("fetching time");	
    var headers = {
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + uber.accessToken 
    };
    var options = {
        url: uber.endPoint + 'estimates/time?start_latitude=' + args.lat + "&start_longitude=" + args.long,
        headers: headers,
        json: true
    }
    request.get(options, (error, response, body) => {
        // console.log("fetched price");
        if(error) {
            console.log(error);
            return;
        }
    	if(body) {
    		for(var i = 0; i < body.times.length; i++) {
    			var time = body.times[i];
    			var obj;
    			if(resObj.hasOwnProperty(time.display_name)) {
    				obj = resObj[time.display_name];
    			} else {
	    			obj = {}
    			}
    			obj.eta = time.estimate;
    			resObj[time.display_name] = obj;
    		}
    	}

        if(!done) {
        	done = true;
        } else {
        	callback(resObj);
        }
    })
}


module.exports = uber
