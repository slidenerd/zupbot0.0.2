'use strict';
const ola = require('./ola')
const uber = require('./uber')
const geocoder = require('./geocoder');

var ride = {
    'uber': uber
};

ride.ride = function(req, res) {
  var pickup;
  console.log(req.query.lat == undefined);
  if(req.query.lat == undefined) {
    pickup = req.query.pickup;
  } else {
    pickup = req.query.lat + ', ' + req.query.long; 
  }
  const data = {
    pickup: pickup,
    drop: req.query.drop 
  }
  res.render('map/location', data);    
}

ride.price = function(req, res) {
    var pickup = req.query.pickup;
    var address = pickup.split(',');
    if(address.length == 2) {
        var lat = parseFloat(address[0]);
        var long = parseFloat(address[1]);
        if(isNaN(lat) || isNaN(long)) { 
            var callback = function(data) {
                res.render('map/index', data);
            }
            ride.getRideEstimateSourceDestination(lat, long, req.query.drop, res);
            return;
        }
    }
    ride.getRideEstimate(pickup, req.query.drop, res);
}

ride.getRideEstimate = function(from, to, res) {
    var callback = function(data) {
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

ride.getRideEstimateSourceDestination = function(fromlat, fromlng, to, res) {
    var callback = function(data) {
        res.render('map/index', data);
    }
    var option = 0;
    var args = new Object();
    args.lat = fromlat;
    args.long = fromlng;


    var geoCallback = function(err, res) {
        if(err) {
            //TODO:
            console.log("Error : " + err);
        } else {
            args.droplat = res[0].latitude;
            args.droplong = res[0].longitude;
            ride.getRideEstimateCoordinates(callback, args);
        }
    };
    geocoder.geocode(to, geoCallback);
}


ride.getRideEstimateCoordinates = function(callback, args) {
    var data = {
        location : args 
    };
    var uberCallback = (resObj) => {
        delete resObj.done;
            data.uber = resObj;
            if(data.hasOwnProperty("ola")) {
                console.log("Calling from uber callback");
                callback(data);
            }
        }        

    uber.getRideEstimateCoordinates(uberCallback, args);
    ola.getRideEstimateCoordinates( 
        (resObj) => {
            data.ola = resObj;
            if(data.hasOwnProperty("uber")) {
                console.log("Calling from Ola callback");
                callback(data);
            }
        }
    , args);
}

ride.bookRide = function(req, res) {
    var query;
    if(req.query.provider == undefined) {
        query = req.session.uber;
    } else {
        query = req.query;
    }
    if(query.provider == 'uber') {
        if(req.session.uberToken === undefined) {
            req.session.uber = req.query;
            uber.login(req, res);            
        } else {
            console.log("Found access code, booking ride");
            uber.bookRide(req, (body) => {
                res.redirect(body.map);
                // res.end(JSON.stringify(body));
            }, query);            
        }
    } else {
        ola.bookRide((body) => {
            res.end(JSON.stringify(body));
        }, req.query);            
    }
}

module.exports = ride

