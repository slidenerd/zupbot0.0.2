'use strict';
const ola = require('./ola')
const uber = require('./uber')
const geocoder = require('./geocoder');

var ride = {};
ride.getRideEstimate = function(from, to, res) {
    var callback = function(data) {
        console.log(data);
        res.render('map/index', data);
    }
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
                    ride.getRideEstimateCoordinates(callback, args);
                break;    
            }
        }
    };
    geocoder.geocode(from, geoCallback);
}

ride.getRideEstimateCoordinates = function(callback, args) {
    console.log("getRideEstimateCoordinates");
    var data = {
        location : args 
    };
    var uberCallback = (resObj) => {
            data.uber = resObj;
            if(data.hasOwnProperty("ola")) {
                callback(data);
            }
        }        
    uber.getRidePriceEstimateCoordinates(uberCallback, args);
    uber.getRideTimeEstimateCoordinates(uberCallback, args);
    ola.getRideEstimateCoordinates( 
        (resObj) => {
            data.ola = resObj;
            if(data.hasOwnProperty("uber")) {
                callback(data);
            }
        }
    , args);
}

ride.bookRide = function(req, res) {
    console.log("bookRide");
    uber.bookRide((body) => {
        res.end(JSON.stringify(body));
    }, req.query);    
}

module.exports = ride

