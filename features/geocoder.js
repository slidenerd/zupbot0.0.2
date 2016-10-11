var NodeGeocoder = require('node-geocoder');
var options = {
    provider: 'google',
    httpAdapter: 'https', // Default
    apiKey: 'AIzaSyCMHTinSFNvPoRoXr8K_rQav8CM4mFzF1I', // for Mapquest, OpenCage, Google Premier
    formatter: null         // 'gpx', 'string', ...
};

var geocoder = NodeGeocoder(options);
function geocode(address, callback) {
    NodeGeocoder(options).geocode(address, callback);
}


module.exports = geocoder

