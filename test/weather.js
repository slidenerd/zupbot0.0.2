const dummy = {
  "coord": {
    "lon": 73.47,
    "lat": 16.07
  },
  "weather": [
    {
      "id": 500,
      "main": "Rain",
      "description": "light rain",
      "icon": "10n"
    }
  ],
  "base": "stations",
  "main": {
    "temp": 297.237,
    "pressure": 1021.41,
    "humidity": 100,
    "temp_min": 297.237,
    "temp_max": 297.237,
    "sea_level": 1021.99,
    "grnd_level": 1021.41
  },
  "wind": {
    "speed": 4.18,
    "deg": 328.003
  },
  "rain": {
    "3h": 2.505
  },
  "clouds": {
    "all": 92
  },
  "dt": 1475255426,
  "sys": {
    "message": 0.1739,
    "country": "IN",
    "sunrise": 1475196965,
    "sunset": 1475240119
  },
  "id": 1264007,
  "name": "Malvan",
  "cod": 200
}

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
    url: endpoints.OPEN_WEATHER_MAP, //URL to hit
    qs: {
      lat: lat,
      lon: lon,
      units: weather.units,
      appid: endpoints.OPEN_WEATHER_MAP_KEY
    }, //Query string data
    headers: { 'Accept': 'application/json' },
    json: true
  }
  return new Promise((resolve, reject) => {
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