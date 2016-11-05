'use strict';

const
    endpoints = require('../config/endpoints'),
    request = require('request'),
    zomato = {
        errors: {
            categories: 'Zomato Find Categories ',
            cities: 'Zomato Find Cities ',
            collections: 'Zomato Find Collections ',
            cuisines: 'Zomato Find Cuisines ',
            establishments: 'Zomato Find Establishments ',
            geocode: 'Zomato Geocode ',
            locationDetails: 'Zomato Find Location Details',
            locations: 'Zomato Find Locations ',
            restaurant: 'Zomato Find Restaurant ',
            reviews: 'Zomato Find Reviews '
        }
    };

zomato.getCategories = function () {
    const options = {
        url: endpoints.ZOMATO_ENDPOINT_CATEGORIES, //URL to hit
        headers: {
            'Accept': 'application/json',
            'user-key': endpoints.ZOMATO_KEY
        },
        json: true
    }
    return new Promise((resolve, reject) => {
        request(options, (error, response, body) => {
            if (!error) {
                if (response.statusCode === 200 && body) {
                    let categories = []
                    if (body.categories) {
                        for (let item of body.categories) {
                            if (item.categories) {
                                categories.push(item.categories)
                            }
                        }
                    }
                    resolve(categories)
                }
                else {
                    reject(zomato.errors.categories + response.statusCode + ' ' + response.statusMessage)
                }
            }
            else {
                reject(error)
            }
        });
    })
}

zomato.getCities = function (options) {
    return new Promise((resolve, reject) => {
        request(options, (error, response, body) => {
            if (!error) {
                if (response.statusCode === 200 && body && body.status === 'success') {
                    let locationSuggestions = []
                    if (body.location_suggestions) {
                        for (let item of body.location_suggestions) {
                            locationSuggestions.push(item)
                        }
                    }
                    resolve(locationSuggestions)
                }
                else {
                    reject(zomato.errors.cities + response.statusCode + ' ' + response.statusMessage)
                }
            }
            else {
                reject(error)
            }
        });
    })
}

zomato.getCitiesByName = function (name) {
    const options = {
        url: endpoints.ZOMATO_ENDPOINT_CITIES, //URL to hit
        qs: {
            q: name
        },
        headers: {
            'Accept': 'application/json',
            'user-key': endpoints.ZOMATO_KEY
        },
        json: true
    }
    return zomato.getCities(options)
}

zomato.getCitiesByGeolocation = function (lat, lon) {
    const options = {
        url: endpoints.ZOMATO_ENDPOINT_CITIES, //URL to hit
        qs: {
            lat: lat,
            lon: lon
        },
        headers: {
            'Accept': 'application/json',
            'user-key': endpoints.ZOMATO_KEY
        },
        json: true
    }
    return zomato.getCities(options)
}

zomato.getCollections = function (options) {
    return new Promise((resolve, reject) => {
        request(options, (error, response, body) => {
            if (!error) {
                if (response.statusCode === 200 && body) {
                    let collections = []
                    if (body.collections) {
                        for (let item of body.collections) {
                            if (item.collection) {
                                collections.push(item.collection)
                            }
                        }
                    }
                    resolve(collections)
                }
                else {
                    reject(zomato.errors.collections + response.statusCode + ' ' + response.statusMessage)
                }
            }
            else {
                reject(error)
            }
        });
    })
}

zomato.getCollectionsByCityId = function (cityId) {
    const options = {
        url: endpoints.ZOMATO_ENDPOINT_COLLECTIONS, //URL to hit
        qs: {
            city_id: cityId
        },
        headers: {
            'Accept': 'application/json',
            'user-key': endpoints.ZOMATO_KEY
        },
        json: true
    }
    return zomato.getCollections(options)
}

zomato.getCollectionsByGeolocation = function (lat, lon) {
    const options = {
        url: endpoints.ZOMATO_ENDPOINT_COLLECTIONS, //URL to hit
        qs: {
            lat: lat,
            lon: lon
        },
        headers: {
            'Accept': 'application/json',
            'user-key': endpoints.ZOMATO_KEY
        },
        json: true
    }
    return zomato.getCollections(options)
}

zomato.getCuisines = function (options) {
    return new Promise((resolve, reject) => {
        request(options, (error, response, body) => {
            if (!error) {
                if (response.statusCode === 200 && body) {
                    let cuisines = []
                    if (body.cuisines) {
                        for (let item of body.cuisines) {
                            if (item.cuisine) {
                                cuisines.push(item.cuisine)
                            }
                        }
                    }
                    resolve(cuisines)
                }
                else {
                    reject(zomato.errors.cuisines + response.statusCode + ' ' + response.statusMessage)
                }
            }
            else {
                reject(error)
            }
        });
    })
}

zomato.getCuisinesByCityId = function (cityId) {
    const options = {
        url: endpoints.ZOMATO_ENDPOINT_CUISINES, //URL to hit
        qs: {
            city_id: cityId
        },
        headers: {
            'Accept': 'application/json',
            'user-key': endpoints.ZOMATO_KEY
        },
        json: true
    }
    return zomato.getCuisines(options)
}

zomato.getCuisinesByGeolocation = function (lat, lon) {
    const options = {
        url: endpoints.ZOMATO_ENDPOINT_CUISINES, //URL to hit
        qs: {
            lat: lat,
            lon: lon
        },
        headers: {
            'Accept': 'application/json',
            'user-key': endpoints.ZOMATO_KEY
        },
        json: true
    }
    return zomato.getCuisines(options)
}

zomato.getEstablishments = function (options) {
    return new Promise((resolve, reject) => {
        request(options, (error, response, body) => {
            if (!error) {
                if (response.statusCode === 200 && body) {
                    let establishments = []
                    if (body.establishments) {
                        for (let item of body.establishments) {
                            if (item.establishment) {
                                establishments.push(item.establishment)
                            }
                        }
                    }

                    resolve(establishments)
                }
                else {
                    reject(zomato.errors.establishments + response.statusCode + ' ' + response.statusMessage)
                }
            }
            else {
                reject(error)
            }
        });
    })
}

zomato.getEstablishmentsByCityId = function (cityId) {
    const options = {
        url: endpoints.ZOMATO_ENDPOINT_ESTABLISHMENTS, //URL to hit
        qs: {
            city_id: cityId
        },
        headers: {
            'Accept': 'application/json',
            'user-key': endpoints.ZOMATO_KEY
        },
        json: true
    }
    return zomato.getEstablishments(options);
}

zomato.getEstablishmentsByGeolocation = function (lat, lon) {
    const options = {
        url: endpoints.ZOMATO_ENDPOINT_ESTABLISHMENTS, //URL to hit
        qs: {
            lat: lat,
            lon: lon
        },
        headers: {
            'Accept': 'application/json',
            'user-key': endpoints.ZOMATO_KEY
        },
        json: true
    }
    return zomato.getEstablishments(options);
}


zomato.getNearbyRestaurants = function (lat, lon) {
    const options = {
        url: endpoints.ZOMATO_ENDPOINT_GEOCODE, //URL to hit
        qs: {
            lat: lat,
            lon: lon
        },
        headers: {
            'Accept': 'application/json',
            'user-key': endpoints.ZOMATO_KEY
        },
        json: true
    }
    return new Promise((resolve, reject) => {
        request(options, (error, response, body) => {
            if (!error) {
                if (response.statusCode === 200 && body) {
                    resolve(body)
                }
                else {
                    reject(zomato.errors.geocode + response.statusCode + ' ' + response.statusMessage)
                }
            }
            else {
                reject(error)
            }
        });
    })
}

zomato.getBestRatedRestaurants = function (entityId, entityType) {
    const options = {
        url: endpoints.ZOMATO_ENDPOINT_LOCATION_DETAILS, //URL to hit
        qs: {
            entity_id: entityId,
            entity_type: entityType
        },
        headers: {
            'Accept': 'application/json',
            'user-key': endpoints.ZOMATO_KEY
        },
        json: true
    }
    return new Promise((resolve, reject) => {
        request(options, (error, response, body) => {
            if (!error) {
                if (response.statusCode === 200 && body) {
                    resolve(body)
                }
                else {
                    reject(zomato.errors.locationDetails + response.statusCode + ' ' + response.statusMessage)
                }
            }
            else {
                reject(error)
            }
        });
    })
}

zomato.getLocations = function (name, lat, lon) {
    const options = {
        url: endpoints.ZOMATO_ENDPOINT_LOCATIONS, //URL to hit
        qs: {
            query: name,
            lat: lat,
            lon: lon
        },
        headers: {
            'Accept': 'application/json',
            'user-key': endpoints.ZOMATO_KEY
        },
        json: true
    }
    return new Promise((resolve, reject) => {
        request(options, (error, response, body) => {
            if (!error) {
                if (response.statusCode === 200 && body && body.status === 'success') {
                    let locations = []
                    if (body.location_suggestions) {
                        for (let item of body.location_suggestions) {
                            locations.push(item)
                        }
                    }
                    resolve(locations)
                }
                else {
                    reject(zomato.errors.locations + response.statusCode + ' ' + response.statusMessage)
                }
            }
            else {
                reject(error)
            }
        });
    })
}

zomato.getDailyMenu = function () {

}

zomato.getRestaurants = function (restaurantId) {
    const options = {
        url: endpoints.ZOMATO_ENDPOINT_RESTAURANT, //URL to hit
        qs: {
            res_id: restaurantId
        },
        headers: {
            'Accept': 'application/json',
            'user-key': endpoints.ZOMATO_KEY
        },
        json: true
    }
    return new Promise((resolve, reject) => {
        request(options, (error, response, body) => {
            if (!error) {
                if (response.statusCode === 200 && body) {
                    resolve(body)
                }
                else {
                    reject(zomato.errors.restaurant + response.statusCode + ' ' + response.statusMessage)
                }
            }
            else {
                reject(error)
            }
        });
    })
}

zomato.getReviews = function (restaurantId, start, count) {
    const options = {
        url: endpoints.ZOMATO_ENDPOINT_REVIEWS, //URL to hit
        qs: {
            res_id: restaurantId,
            start: start,
            count: count
        },
        headers: {
            'Accept': 'application/json',
            'user-key': endpoints.ZOMATO_KEY
        },
        json: true
    }
    return new Promise((resolve, reject) => {
        request(options, (error, response, body) => {
            if (!error) {
                if (response.statusCode === 200 && body) {
                    let reviews = []
                    if (body.user_reviews) {
                        for (let item of body.user_reviews) {
                            if (item.review) {
                                reviews.push(item.review);
                            }
                        }
                    }
                    resolve(reviews)
                }
                else {
                    reject(zomato.errors.restaurant + response.statusCode + ' ' + response.statusMessage)
                }
            }
            else {
                reject(error)
            }
        });
    })
}

zomato.getSearch = function () {

}

zomato.getReviews(34157, 0 , 10)
    .then((response) => {
        console.log(JSON.stringify(response))
    })
    .catch((error) => {
        console.log(error)
    })
module.exports = zomato;