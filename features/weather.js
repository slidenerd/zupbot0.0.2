const request = require('request');
const endpoints = require('../config/endpoints')
/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */

const weather = {
    units: 'metric'
}

function isValid(json) {
    return json.coord && json.weather && json.weather.length && json.weather[0] && json.main && json.wind && json.clouds && json.sys
}

function parse(json) {
    return {
        lat: json.coord.lat,
        lon: json.coord.lon,
        id: json.weather[0].id,
        main: json.weather[0].main,
        description: json.weather[0].description,
        icon: json.weather[0].icon,
        temperature: (json.main.temp || 0).toFixed(0),
        pressure: json.main.pressure,
        humidity: json.main.humidity,
        windSpeed: json.wind.speed,
        windDegree: json.wind.deg,
        clouds: json.clouds.all,
        countryCode: json.sys.country,
        sunrise: json.sys.sunrise,
        sunset: json.sys.sunset
    }
}

weather.execute = function (lat, lon) {
    const options = {
        url: endpoints.OPEN_WEATHER_MAP_ENDPOINT, //URL to hit
        qs: {
            lat: lat,
            lon: lon,
            units: weather.units,
            appid: endpoints.OPEN_WEATHER_MAP_KEY
        }, //Query string data
        headers: { 'Accept': 'application/json' },
        json: true
    }
    return new Promise((resolve, reject)=>{
        request(options, (error, response, body) => {
            if (!error && response.statusCode == 200 && isValid(body)) {
                var report = parse(body);
                //TODO build a string from the weather report
                resolve(report)
            } else {
                reject(error)
            }
        });
    })
    
}

module.exports = weather