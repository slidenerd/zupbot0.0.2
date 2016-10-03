const amazon = require('./amazon')
const flipkart = require('./flipkart')
const ola = require('./ola')
const uber = require('./uber')
const weather = require('./weather')
const cache = require('memory-cache');

const CACHE_VALIDITY_PERIOD = 1000 * 60 * 15

const all = {
    flipkart: {},
    ola: {},
    uber: {},
    weather: {}
}

all.geocoder = require('./geocoder')
all.weather.name = 'weather';
all.weather.subroutine = function (rs, args) {
    return new rs.Promise((resolve, reject) => {
        weather.execute((report)=>{
            resolve(report)
        })
    })
}

all.flipkart.name = 'flipkart';
all.flipkart.subroutine = function (userId, rs, args) {
    return new rs.Promise((resolve, reject) => {
        console.log(args)
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
            flipkart.execute(args[0])
                .then((offers) => {
                    if (offers && offers.length) {
                        cache.put(KEY_FRESH_DATA, true, CACHE_VALIDITY_PERIOD, (key, value) => {
                            console.log('fresh was stored in the cache');
                        });
                        cache.put(KEY_OFFERS, offers, CACHE_VALIDITY_PERIOD, (key, value) => {
                            console.log(offers.length + 'offers was stored in the cache')
                        })
                    }

                    if(args && args[0] === 'mobiles_and_accessories'){
                        
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
