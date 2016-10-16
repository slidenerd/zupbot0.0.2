'use strict';

const
    builder = require('../core/'),
    endpoints = require('../config/endpoints'),
    request = require('request')


const SKYSCANNER_API_KEY = 'prtl6749387986743898559646983194'

const skyscanner = {};

skyscanner.fetchFlightDetails = function(req, res) {
    skyscanner.getFlightDetailsFromSkyScanner(res, req.query.from, req.query.to, req.query.outbounddate, req.query.inbounddate, 
    (error, body) => {
        if (!error) {
            let flightOptions = skyscanner.parse(body);
            res.render('airfare/skyscanner', flightOptions)
        }
    });
}

skyscanner.getFlightDetailsFromSkyScanner = function(res, from, to, outboundDate, inboundDate, callback) {
    var body = new Object();
    body.country = 'IN';
    body.currency = 'INR';
    body.locale = 'en-IN';
    body.locationSchema = 'sky';
    body.apikey = SKYSCANNER_API_KEY;
    body.grouppricing = 'on';
    body.outbounddate = outboundDate;
    body.inbounddate = inboundDate;
    body.adults = 1;
    skyscanner.findLocation(res, body, from, to, 0, callback);
}

skyscanner.findLocation = function(res, params, query, nextQuery, count, callback) {
    var options = {
        url: endpoints.ENDPOINT_SKY_SCANNER_AUTO_SUGGEST + query + '&apiKey=' + SKYSCANNER_API_KEY,
        json: true
    }
    request.get(options, (error, response, body) => {
        if(response.statusCode == 200) {
            if(body.Places.length == 0) {
                //TODO: no results found
                console.log("Found no results for query " + query);
            } else if(body.Places.length > 0) {
                if(count == 0) {
                    params.originplace = body.Places[0].PlaceId;
                    skyscanner.findLocation(res, params, nextQuery, null, 1, callback);
                } else if(count == 1) {
                    params.destinationplace = body.Places[0].PlaceId;
                    skyscanner.getFlightDetails(res, params, callback);
                }
            } else {
                //TODO: multiple results found
                console.log("Found " + body.Places.length + " results for query " + query);
            }
        } else {
            console.log(response.statusCode);
            callback(null, error);
        }
    });
}

skyscanner.getFlightDetails = function(res, body, callback) {
    var headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json' 
    };
    var options = {
        url: endpoints.ENDPOINT_SKY_SCANNER_LIVE_PRICE + '?apiKey=' + SKYSCANNER_API_KEY,
        headers: headers,
        form: body,
        json: false
    };
    request.post(options, (error, response, body) => {
        //TODO:
        skyscanner.sessionStartCallback(res, response, body, error, callback)
    });
}

skyscanner.sessionStartCallback = function(res, response, body, error, callback) {
    if (!error && response.statusCode == 201) {
        var cookie;
        if(response.headers["set-cookie"] && response.headers["set-cookie"].length > 0) {
            cookie = response.headers["set-cookie"][0];
        }
        var location = response.headers.location;
        var headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'Cookie': response.headers["set-cookie"] && response.headers["set-cookie"].length > 0 ? response.headers["set-cookie"][0] : '' 
        };
        
        var options = {
            url: location + "?apikey=" + SKYSCANNER_API_KEY + "&pageindex=0&pagesize=20",
            headers: headers,
            json: true
        };
        setTimeout(function() {
            skyscanner.pollSession(res, options, callback);
        }, 2000);
        return;
    }
    callback(res, body);
}

skyscanner.pollSession = function(res, options, callback) {
    console.log("Polling...");
    console.log("#################")
    console.log(callback);
    console.log("#################")
        request.get(options, (error, response, body) => {
            if(error) {
                callback(error, null);
                return;
            }
            console.log("Response code : " + response.statusCode);
            if (response.statusCode == 200) {
                console.log("Status : " + body.Status);
                if(body.Status == "UpdatesPending") {
                    setTimeout(function() {
                        skyscanner.pollSession(res, options, callback);
                    }, 1000)                
                } else if(body.Status == "UpdatesComplete") {
                    callback(null, body);
                }
                return;
            } else if(response.statusCode == 304) {
                setTimeout(function() {
                    skyscanner.pollSession(res, options, callback);
                }, 2000)                
                return;    
            }
            callback(res, body);
        });
}

// skyscanner.finalCallback = function(res, body) {
//     if (!error) {
//         let flightOptions = skyscanner.parse(body);
//         console.log(flightOptions);
//         resolve(flightOptions);
//     }
//     else {
//         reject(error);
//     }
// }

skyscanner.parse = function(json) {
    let options = [];
    for (let legs of json.Legs) {
        var option = new Object();
        var outbound = new Object();
        outbound.departure = legs.Departure
        outbound.arrival = legs.Arrival
        outbound.stops = legs.Stops.length
        outbound.duration = legs.Duration
        outbound.id = legs.Id
        option.outbound = outbound
        
        var inbound = new Object();
        inbound.departure = legs.Departure
        inbound.arrival = legs.Arrival
        inbound.stops = legs.Stops.length
        inbound.duration = legs.Duration
        inbound.id = legs.Id
        option.inbound = inbound
        option = skyscanner.findCheapestPrice(option, json)
        options.push(option)
    }
    return options;
}

skyscanner.findCheapestPrice = function(option, json) {
    var price = Number.MAX_SAFE_INTEGER;
    var bookingLink;
    for (let priceObj of json.Itineraries[0].PricingOptions) {
        if(priceObj.Price < price) {
            price = priceObj.Price;
            bookingLink = priceObj.DeeplinkUrl;
        }    
    }
    option.price = price;
    option.bookingLink = bookingLink
    return option;
    
}

// skyscanner.getFlightDetailsFromSkyScanner('coimb', 'chennai', '2016-10-21', '2016-11-22', (response, error) => {
//     console.log(error);
// });

module.exports = skyscanner