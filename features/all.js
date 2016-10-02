const amazon = require('./amazon')
const flipkart = require('./flipkart')
const ola = require('./ola')
const uber = require('./uber')
const weather = require('./weather')
const cache = require('memory-cache');

const CACHE_VALIDITY_PERIOD = 3600000

const all = {
    flipkart: {
        alloffers: {},
        filtered: {}
    },
    ola: {},
    uber: {},
    weather: {},
}

all.flipkart.alloffers.name = 'flipkart';
all.flipkart.alloffers.subroutine = function (userId, rs, args) {
    return new rs.Promise((resolve, reject) => {
        //Load from cache
        const KEY_FRESH_DATA = 'fresh'
        const KEY_OFFERS = 'offers'
        const cachedOffers = cache.get(KEY_OFFERS)
        if (cachedOffers) {
            console.log('get offers from cache')
            cache.put(KEY_FRESH_DATA, false, CACHE_VALIDITY_PERIOD, (key, value) => {
                console.log('fresh was stored in the cache');
            });
            //Reject this message as it is a carousel, we ll handle it differently from server
            reject({ type: 'carousel', data: cachedOffers })
        }
        else {
            flipkart.execute()
                .then((offers) => {
                    if (offers && offers.length) {
                        cache.put(KEY_FRESH_DATA, true, CACHE_VALIDITY_PERIOD, (key, value) => {
                            console.log('fresh was stored in the cache');
                        });
                        cache.put(KEY_OFFERS, offers, CACHE_VALIDITY_PERIOD, (key, value) => {
                            console.log(offers.length + 'offers was stored in the cache')
                        })
                    }
                    //Reject this message as it is a carousel, we ll handle it differently from server
                    reject({ type: 'carousel', data: offers })
                })
                .catch((error) => {
                    reject({ type: 'error', data: error });
                })
        }
    })
}

all.flipkart.filtered.name = 'flipkartFilter';
all.flipkart.filtered.subroutine = function (userId, rs, args) {
    return new rs.Promise((resolve, reject) => {
        //Load from cache
        const KEY_FRESH_DATA = 'fresh'
        const KEY_OFFERS = 'filtered'
        const cachedOffers = cache.get(KEY_OFFERS)
        if (cachedOffers) {
            cache.put(KEY_FRESH_DATA, false, CACHE_VALIDITY_PERIOD, (key, value) => {
                console.log('fresh was stored in the cache');
            });
            //Reject this message as it is a carousel, we ll handle it differently from server
            reject({ type: 'carousel', data: cachedOffers })
        }
        else {
            flipkart.executeFilter()
                .then((offers) => {
                    if (offers && offers.length) {
                        cache.put(KEY_FRESH_DATA, true, CACHE_VALIDITY_PERIOD, (key, value) => {
                            console.log('fresh was stored in the cache');
                        });
                        cache.put(KEY_OFFERS, offers, CACHE_VALIDITY_PERIOD, (key, value) => {
                            console.log(offers.length + 'offers was stored in the cache')
                        })
                    }
                    //Reject this message as it is a carousel, we ll handle it differently from server
                    reject({ type: 'carousel', data: offers })
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

all.weather.name = 'weather';
all.weather.subroutine = function (userId, rs, args) {
    return new rs.Promise((resolve, reject) => {
        var lat = 19, lon = 72;
        weather.execute(lat, lon)
            .then((report) => {
                rs.setUservar(userId, 'location', 'your place')
                rs.setUservars(userId, report)
                return rs.replyAsync(userId, 'jsweather', all.this)
            })
            .then((reply) => {
                resolve(reply)
            })
            .catch((error) => {
                reject(error);
            })
    })
}

module.exports = all;