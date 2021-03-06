'use strict';
const request = require('request')
const geocoder = require('./geocoder');

/**
 * https://sandbox-t1.olacabs.com/oauth2/authorize?response_type=token&client_id=NjNmZGNmNjAtOTVkYy00YzAyLTg1MjktZTNjYzBkYzMyZTQ3&redirect_uri=https://zup.chat/api/ride/ola/callback&scope=profile%20booking&state=state123
 */
const ola = {
    endPoint: 'http://sandbox-t1.olacabs.com/v1/',
    // apiToken: '0c31668dfb814df79c3c43c4d5b337df',
    // client_id: 'NjNmZGNmNjAtOTVkYy00YzAyLTg1MjktZTNjYzBkYzMyZTQ3',
    // redirect_uri: 'https://zup.chat/api/ride/ola/callback',
    apiToken: '3882a2d3f13248b78bc31186dfeab249',
    client_id: 'ODYxMDgyNDktNGU4Yy00ZWU3LTlhNTctODRhYmE5NWY3YWFj',
    redirect_uri: 'http://localhost:3000/auth/ola/callback',
    auth_url: 'https://sandbox-t1.olacabs.com/oauth2/authorize'
}

const headers = {
    'Accept': 'application/json',
    'X-APP-TOKEN': ola.apiToken
};

ola.webhook = function (req, res) {
    res.send({
        "success": "true",
        "name": 'zup'
    })
}

ola.getAvailability = function (category, location, callback) {
    geocoder.geocode(location, function (err, res) {
        if (err) {
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

ola.getRideEstimate = function (from, to, callback) {
    var option = 0;
    var args = new Object();
    var geoCallback = function (err, res) {
        if (err) {
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

ola.getAvailabilityByCoordinates = function (callback, args) {
    var options = {
        url: ola.endPoint + 'products?pickup_lat=' + args.lat + "&pickup_lng=" + args.long + "&category=" + args.category,
        headers: headers,
        json: true
    }
    request.get(options, (error, response, body) => {
        if (error) {
            console.log(error);
            callback(error, response, body);
            return;
        }
        if (response.statusCode == 200) {
        } else {
            console.log(response.statusCode);
            console.log(body);
        }
        callback(error, response, body);
    })
}


ola.getRideEstimateCoordinates = function (callback, args) {
    var resObj = {};
    var options = {
        url: ola.endPoint + 'products?pickup_lat=' + args.lat + "&pickup_lng=" + args.long +
        "&drop_lat=" + args.droplat + "&drop_lng=" + args.droplong,
        headers: headers,
        json: true
    }
    request.get(options, (error, response, body) => {
        if (error) {
            console.log("ERROR:" + error);
            resObj.success = false;
            resObj.message = JSON.stringify(error);
            return;
        }
        if (response.statusCode == 200 && body.ride_estimate) {
            resObj.data = {}
            resObj.success = true;
            for (var i = 0; i < body.ride_estimate.length; i++) {
                var obj = new Object();
                obj.display_name = body.ride_estimate[i].category;
                obj.distance = body.ride_estimate[i].distance;
                obj.duration = body.ride_estimate[i].travel_time_in_minutes * 60;
                obj.high_price = body.ride_estimate[i].amount_max;
                obj.low_price = body.ride_estimate[i].amount_min;
                resObj.data[body.ride_estimate[i].category] = obj;
                resObj.currency_code = body.currency;
            }

            for (var i = 0; i < body.categories.length; i++) {
                var category = body.categories[i];
                if (resObj.data.hasOwnProperty(category.id)) {
                    resObj.data[category.id].eta = category.eta;
                }
            }
            callback(resObj);
        } else {
            resObj.success = false;
            resObj.message = JSON.stringify(response);
            console.log(response.statusCode);
            console.log(body);
        }
    })
}

/**
 * https://sandbox-t1.olacabs.com/oauth2/authorize?response_type=token&client_id=NjNmZGNmNjAtOTVkYy00YzAyLTg1MjktZTNjYzBkYzMyZTQ3&redirect_uri=https://zup.chat/api/ride/ola/callback&scope=profile%20booking&state=state123
 */
// ola.authenticate = function () {
//     var url = 'http://sandbox-t.olacabs.com/oauth2/authorize?response_type=token&client_id=ODYxMDgyNDktNGU4Yy00ZWU3LTlhNTctODRhYmE5NWY3YWFj
//&redirect_uri=http://localhost/api/ride/ola/callback&scope=profile%20booking&state=state123'
// }

ola.authorization = function (req, res) {

}

ola.login = function (req, res) {
    var url = ola.auth_url + '?response_type=token&client_id=' + ola.client_id + '&redirect_uri=' +
        ola.redirect_uri + '&scope=profile%20booking&state=state123'
    res.redirect(url);
}


ola.bookRide = function (req, res, callback, args) {
    var body = {
        'pickup_lat': args.lat,
        'pickup_lng': args.long,
        'drop_lat': args.droplat,
        'drop_lng': args.droplong,
        'pickup_mode': 'NOW',
        'product_id': args.product_id
    }
    var options = {
        url: ola.endPoint + 'bookings/create',
        headers: headers,
        body: body,
        json: true
    }
    request.post(options, (error, response, body) => {
        callback(body);
    });
}
module.exports = ola