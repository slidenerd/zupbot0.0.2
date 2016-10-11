'use strict';

const amazon = require('./amazon')
const flipkart = require('./flipkart')
const ola = require('./ola')
const uber = require('./uber')
const weather = require('./weather')
const cache = require('memory-cache')
const geocoder = require('./geocoder');

//Cache the results for 30 mins
const CACHE_VALIDITY_PERIOD = 1000 * 60 * 30

//key used to determine if flipkart results are fresh or came from the cache
const KEY_FRESH_DATA = 'fresh'

//Key used to store the offers retrieved from Flipkart
const KEY_OFFERS = 'offers'

const all = {
    flipkart: {},
    ola: {},
    uber: {},
    skyscanner: {},
    weather: {},
    location: {}
}

all.flipkart.name = 'flipkart';

/**
 * Custom objects cannot be resolved using rs.Promise since it resolves only strings and converts custom objects into [object Object]
 * The best way to resolve custom objects is to reject them and handle them separately inside the catch clause
 * Note that we are rejecting offers regardless of whether they have data inside them or they are empty.
 */
all.flipkart.subroutine = function (rs, args) {
    return new rs.Promise((resolve, reject) => {
        //Load from cache
        const cachedOffers = cache.get(KEY_OFFERS)
        if (cachedOffers) {
            console.log('get offers from cache')
            cache.put(KEY_FRESH_DATA, false, CACHE_VALIDITY_PERIOD, (key, value) => {
                console.log('fresh was stored in the cache');
            });
            reject({ type: 'carousel', data: cachedOffers, filters: args })
        }
        else {
            flipkart.findAllOffers()
                .then((offers) => {
                    if (offers && offers.length) {
                        cache.put(KEY_FRESH_DATA, true, CACHE_VALIDITY_PERIOD, (key, value) => {
                        });
                        cache.put(KEY_OFFERS, offers, CACHE_VALIDITY_PERIOD, (key, value) => {
                        })
                    }
                    reject({ type: 'carousel', data: offers, filters: args })
                })
                .catch((error) => {
                    reject({ type: 'error', data: error });
                })
        }
    })
}

all.ola.name = 'ola';
all.ola.subroutine = function (rs, args) {
    return new rs.Promise((resolve, reject) => {
        resolve('booking a cab for you from mumbai to thane')
    })
}

all.uber.name = 'uber'
all.uber.subroutine = function (rs, args) {
    return new rs.Promise((resolve, reject) => {
        resolve('booking a cab for you from tirupur to coimbatore')
    })
}

all.skyscanner.name = 'skyscanner'
all.skyscanner.subroutine = function () {
    return new rs.Promise((resolve, reject) => {
        let lat = 19, lon = 72;
        skyscanner.execute(lat, lon)
            .then((report) => {
                rs.setUserlet(rs.currentUser(), 'location', 'your place')
                rs.setUserlets(rs.currentUser(), report)
                return rs.replyAsync(rs.currentUser(), 'jsweather', all.this)
            })
            .then((reply) => {
                resolve(reply)
            })
            .catch((error) => {
                reject(error);
            })
    })
}

all.weather.name = 'weather';
all.weather.subroutine = function (rs, args) {
    return new rs.Promise((resolve, reject) => {
        let lat = 19, lon = 72;
        weather.execute(lat, lon)
            .then((report) => {
                rs.setUserlet(rs.currentUser(), 'location', 'your place')
                rs.setUserlets(rs.currentUser(), report)
                return rs.replyAsync(rs.currentUser(), 'jsweather', all.this)
            })
            .then((reply) => {
                resolve(reply)
            })
            .catch((error) => {
                reject(error);
            })
    })
}

all.location.name = 'askUserLocation';
all.location.subroutine = function (rs, args) {
    return new rs.Promise((resolve, reject) => {
        rs.replyAsync(rs.currentUser(), 'jsasklocation', all.this)
            .then((reply) => {
                reject({ type: 'location', data: reply })
            })
            .catch((error) => {
                reject(error);
            })
    })
}
module.exports = all;
