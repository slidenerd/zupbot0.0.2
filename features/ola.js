'use strict';
const request = require('request')
const geocoder = require('./geocoder');

const ola = {
    apiToken: '3882a2d3f13248b78bc31186dfeab249',
    endPoint: 'http://sandbox-t.olacabs.com/v1/products'
}


ola.getAvailability = function(category, location, callback) {
    geocoder.geocode(location, function(err, res) {
        if(err) {
            //TODO:
            console.log("Error : " + err);
        } else {
            var args = new Object();
            args.lat = res[0].latitude;
            args.long = res[0].longitude;
            args.category = category
            ola.getAvailabilityByCoordinates(callback, args); 
        }
    });
}

ola.getRideEstimate = function(from, to, callback) {
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
                    ola.getRideEstimateCoordinates(callback, args);
                break;    
            }
        }
    };
    geocoder.geocode(from, geoCallback);
}

ola.getAvailabilityByCoordinates = function(callback, args) {
    var headers = {
        'Accept': 'application/json',
        'X-APP-TOKEN': ola.apiToken 
    };
    var options = {
        url: ola.endPoint + '?pickup_lat=' + args.lat + "&pickup_lng=" + args.long + "&category=" + args.category,
        headers: headers,
        json: true
    }
    request.get(options, (error, response, body) => {
        if(error) {
            console.log(error);
            callback(error, response, body);
            return;
        }
        if(response.statusCode == 200) {
        } else {
            console.log(response.statusCode);
            console.log(body);
        }
        callback(error, response, body);
    })
}


ola.getRideEstimateCoordinates = function(callback, args) {
    var resObj = {};
    var headers = {
        'Accept': 'application/json',
        'X-APP-TOKEN': ola.apiToken 
    };
    var options = {
        url: ola.endPoint + '?pickup_lat=' + args.lat + "&pickup_lng=" + args.long + 
        "&drop_lat=" + args.droplat + "&drop_lng=" + args.droplong,
        headers: headers,
        json: true
    }
    request.get(options, (error, response, body) => {
        if(error) {
            console.log(error);
            return;
        }
        if(response.statusCode == 200) {
            for(var i = 0; i < body.ride_estimate.length; i++) {
                var obj = new Object();
                obj.display_name = body.ride_estimate[i].category;
                obj.distance = body.ride_estimate[i].distance;
                obj.duration = body.ride_estimate[i].travel_time_in_minutes * 60;
                obj.high_price = body.ride_estimate[i].amount_max;
                obj.low_price = body.ride_estimate[i].amount_min;
                resObj[body.ride_estimate[i].category] = obj;
            }

            for(var i = 0; i < body.categories.length; i++) {
                var category = body.categories[i];
                if(resObj.hasOwnProperty(category.id)) {
                    resObj[category.id].eta = category.eta;
                }
            }
            callback(resObj);
        } else {
            console.log(response.statusCode);
            console.log(body);
        }
    })
}
module.exports = ola
