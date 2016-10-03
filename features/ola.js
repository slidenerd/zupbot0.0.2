'use strict';
const request = require('request')
var all = require("./all.js");


const ola = {
    apiToken: '3882a2d3f13248b78bc31186dfeab249',
    endPoint: 'http://sandbox-t.olacabs.com/v1/products'
}

test();

function test() {
    var args = new Object();
    args.lat = "12.9491416";
    args.long = "77.64298";

    args.droplat = "12.970016";
    args.droplong = "77.641411";


    args.category = "sedan"
    getAvailability('124, 4th cross, viswapriya layout, begur, bangalore 58');
    // getRideEstimateCoordinates(args);
}

function getAvailability(category, location, callback) {
    all.geocoder.geocode(location, function(err, res) {
        if(err) {
            //TODO:
            console.log("Error : " + err);
        } else {
            var args = new Object();
            args.lat = res[0].latitude;
            args.long = res[0].longitude;
            args.category = category
            getAvailabilityByCoordinates(callback, args); 
        }
    });
}


function getRideEstimate(category, from, to, callback) {
    var option = 0;
    var args = new Object();
    args.category = category;
    all.geocoder.geocode(from, function(err, res) {
        if(err) {
            //TODO:
            console.log("Error : " + err);
        } else {
            switch (option) {
                case 0:
                    args.lat = res[0].latitude;
                    args.long = res[0].longitude;
                    option++;
                    all.geocoder.geocode(t0, this);
                break;
                case 1:
                    args.droplat = res[0].latitude;
                    args.droplong = res[0].longitude;
                    getRideEstimateCoordinates(callback, args);
                break;    
            }
            if(option == 0) {
            }
        }
    });
}

function getAvailabilityByCoordinates(callback, args) {
    var headers = {
        'Accept': 'application/json',
        'X-APP-TOKEN': ola.apiToken 
    };
    var options = {
        url: ola.endPoint + '?pickup_lat=' + args.lat + "&pickup_lng=" + args.long + "&category=" + args.category,
        headers: headers,
        json: true
    }
    console.log("Fetching...");
    request.get(options, (error, response, body) => {
        if(error) {
            console.log(error);
            return;
        }
        if(response.statusCode == 200) {
            console.log(body);
        } else {
            console.log(response.statusCode);
            console.log(body);
        }
    })
}


function getRideEstimateCoordinates(callback, args) {
    var headers = {
        'Accept': 'application/json',
        'X-APP-TOKEN': ola.apiToken 
    };
    var options = {
        url: ola.endPoint + '?pickup_lat=' + args.lat + "&pickup_lng=" + args.long + 
        "&drop_lat=" + args.droplat + "&drop_lng=" + args.droplong + "&category=" + args.category,
        headers: headers,
        json: true
    }
    console.log("Fetching...");
    request.get(options, (error, response, body) => {
        if(error) {
            console.log(error);
            return;
        }
        if(response.statusCode == 200) {
            console.log(body);
        } else {
            console.log(response.statusCode);
            console.log(body);
        }
    })
}
module.exports = ola