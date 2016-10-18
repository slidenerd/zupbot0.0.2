'use strict';
const ola = require('./ola')
const uber = require('./uber')
const geocoder = require('./geocoder');
const url = require('url');


var ride = {
    'uber': uber,
    'ola': ola
};

ride.status = function(req, res) {
    uber.status(req, res, (error, response, body) => {
        if(response.statusCode == 404) {
            var response = {
                status: false
            }
            res.end(JSON.stringify(response));
        } else {
            res.end(JSON.stringify(body));
        }
    });
}

ride.receipt = function(req, res) {
    uber.receipt(req, res, (error, response, body) => {
        res.render('ride/receipt', body);
    });
};

ride.ride = function(req, res) {
  var pickup;
  if(req.query.lat == undefined) {
    pickup = req.query.pickup;
  } else {
    pickup = req.query.lat + ', ' + req.query.long; 
  }
  const data = {
    pickup: pickup,
    drop: req.query.drop,
    provider: req.query.provider
  }
  if(req.query.provider == 'uber') {
      uber.getCurrentRide(req, res, data, (responseObj) => {
          if(responseObj) {
            res.render('ride/map', responseObj);
          } else {
            ride.price(req, res, data, (price) => {
                if(price) {
                    data.location = price.location;
                    data.uber = price.uber;
                }
                res.render('ride/location', data);
            });
          }
      });
  } else {
      ride.price(req, res, (price) => {
          data.price = price;
          res.render('ride/location', data);
      });
  }
}



ride.price = function(req, res, data, callback) {
    var pickup = data.pickup;
    var address = pickup.split(',');
    if(address.length == 2) {
        var lat = parseFloat(address[0]);
        var long = parseFloat(address[1]);
        if(isNaN(lat) || isNaN(long)) {
            console.log("#########getRideEstimateSourceDestination")
            ride.getRideEstimateSourceDestination(lat, long, req.query.drop, res, callback);
            return;
        } else {
            ride.getRideEstimate(pickup, req.query.drop, req.query.provider, res, callback);
        }
        return
    }
    ride.getRideEstimate(pickup, req.query.drop, req.query.provider, res, callback);
}


ride.getRideEstimate = function(from, to, provider, res, callback) {
    var option = 0;
    var args = new Object();
    args.provider = provider;
    var geoCallback = function(err, res) {
        if(err) {
            //TODO:
            console.log("Error : " + err);
        } else {
            switch (option) {
                case 0:
                if(res && res.length > 0) {
                    args.lat = res[0].latitude;
                    args.long = res[0].longitude;
                    option++;
                    geocoder.geocode(to, geoCallback);
                } else {
                    callback();
                }
                break;
                case 1:
                if(res && res.length > 0) {
                    args.droplat = res[0].latitude;
                    args.droplong = res[0].longitude;
                    ride.getRideEstimateCoordinates(callback, args);
                } else {
                    callback();
                }
                break;    
            }
        }
    };
    geocoder.geocode(from, geoCallback);
}

ride.getRideEstimateSourceDestination = function(fromlat, fromlng, to, res, callback) {
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

    var uberEnabled = args.provider != 'ola'
    var olaEnabled = args.provider != 'uber'

    if(uberEnabled) {
        var uberCallback = (resObj) => {
            delete resObj.done;
                data.uber = resObj;
                if(olaEnabled == false || (olaEnabled && data.hasOwnProperty("ola"))) {
                    console.log("Calling from uber callback");
                    callback(data);
                }
            }        
        uber.getRideEstimateCoordinates(uberCallback, args);
    }
    if(olaEnabled) {
        ola.getRideEstimateCoordinates( 
            (resObj) => {
                data.ola = resObj;
                if(!uberEnabled || (uberEnabled && data.hasOwnProperty("uber"))) {
                    console.log("Calling from Ola callback");
                    console.log(JSON.stringify(data));
                    callback(data);
                }
            }
        , args);
    }
}

ride.getToken = function(req, key) {
    var sessionKey = key == 'uber' ? 'uberToken' : '';
    if(!req.session[sessionKey] && req.user) {
        return req.user.tokens.find(token => token.kind === key);
    }
    return req.session[sessionKey]; 
}

ride.bookRide = function(req, res) {
    var query;
    if(req.query.provider == undefined) {
        query = req.session.ride;
    } else {
        query = req.query;
    }
    if(query.provider == 'uber') {
        if(ride.getToken(req, 'uber') === undefined) {
            console.log("############" + ride.getToken(req, 'uber'));
            req.session.ride = req.query;
            uber.login(req, res);            
        } else {
            console.log("Found access code, booking Uber ride");
            uber.bookRide(req, res, (responseCode, body) => {
                if(responseCode == 401) {
                    delete req.session.uberToken;
                    uber.login(req, res);                    
                    return;
                }
                res.render('ride/map', body);
                // res.redirect(body.map);
            }, query);            
        }
    } else {
        if(req.session.olaToken === undefined) {
            req.session.ride = req.query;
            ola.login(req, res);            
        } else {
            console.log("Found access code, booking Ola ride");
            ola.bookRide(req, res, (body) => {
                // res.redirect(body.map);
                res.end(JSON.stringify(body));
            }, query);            
        }
        // ola.bookRide((body) => {
        //     res.end(JSON.stringify(body));
        // }, req.query);            
    }
}

ride.authorize = function(modulename, req, res) {
    if(modulename == 'uber') {
        console.log("Got Uber Auth token");
        ride.uber.authorization({
            authorization_code: req.query.code
        }, function (err, access_token, refresh_token) {
            if (err) {
                console.error(err);
            } else {
            // store the user id and associated access token
            // redirect the user back to your actual app
                req.session.uberToken = access_token;
                if(req.user) {
                    req.user.tokens.push({ kind: 'uber', access_token });                
                }
                console.log("Got Uber access token");
                ride.bookRide(req, res);
            }
        });    
    } else {
        //Ola
        console.log(req.url);
        console.log(req.query);
        var access_token = req.query.access_token
        req.session.olaToken = access_token;
        if(req.user) {
            req.user.tokens.push({ kind: 'ola', access_token });
        }
        console.log("Got OLA access token");
        // ride.bookRide(req, res);
    }
}

module.exports = ride
