'use strict';

const
    amazon = require('./amazon'),
    cache = require('memory-cache'),
    carousel = require('../utils/carousel'),
    flipkart = require('./flipkart'),
    geocoder = require('./geocoder'),
    ola = require('./ola'),
    payloads = require('../config/payloads'),
    platforms = require('../utils/platforms'),
    uber = require('./uber'),
    weather = require('./weather');

//Cache the results for 30 mins
const CACHE_VALIDITY_PERIOD = 1000 * 60 * 30

//key used to determine if flipkart results are fresh or came from the cache
const KEY_FRESH_DATA = 'fresh'

//Key used to store the offers retrieved from Flipkart
const KEY_OFFERS = 'offers'

const all = {
    flipkart: {
        name: 'getAllFlipkartOffers'
    },
    cabProvider: {
        name: 'askCabProvider'
    },
    cab: {
        name: 'bookCab'
    },
    skyscanner: {
        name: 'skyscanner'
    },
    weather: {
        name: 'weather'
    },
    location: {
        name: 'askGeolocation'
    }
}


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
            cache.put(KEY_FRESH_DATA, false, CACHE_VALIDITY_PERIOD, (key, value) => {
            });
            reject({ type: 'carousel', data: cachedOffers, filters: args })
        }
        else {
            flipkart.findAllOffers()
                .then((offers) => {
                    if (offers.length) {
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

all.location.subroutine = function (rs, args) {
    return new rs.Promise((resolve, reject) => {
        let reply = rs.reply(rs.currentUser(), 'int askcabsourcemessage', all.this);
        reject({ type: 'location', data: reply })
    })
}

all.cabProvider.subroutine = function (rs, args) {
    return new rs.Promise((resolve, reject) => {
        let reply = rs.reply(rs.currentUser(), 'int askcabprovidermessage', all.this);
        reject({ type: 'cabProvider', data: reply })
    })
}

all.cab.subroutine = function (rs, args) {
    return new rs.Promise((resolve, reject) => {
        //add the previous response?
        resolve('int bookcab')
    })
}

all.skyscanner.subroutine = function () {
    return new rs.Promise((resolve, reject) => {
        resolve('getting your flight')
    })
}

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

/**
 * Generate a reply from the brain
 * We also handle incoming PAYLOADS that are generated as a result of clicking quick replies on facebook
 * PAYLOAD_FACEBOOK_GET_STARTED => Triggered when the user hits the get started button on facebook
 * PAYLOAD_FACEBOOK_PERSISTENT_MENU_HELP => Triggered when the user hits the persistent menu help button 
 * PAYLOAD_FACEBOOK_FLIPKART_SHOW_MORE => Triggered when the user hits the show more quick reply button on flipkart offers
 * PAYLOAD_FACEBOOK_FLIPKART_CANCEL => Triggered when the user hits the no quick reply button on flipkart offers
 * Handle special cases inside the catch block such as carousel, since we rejected them from all.js.
 * If the results generated by any feature is not a string in all.js we reject the Object as brain.rive does not let you resolve custom objects
 */

all.preprocessReplies = function (session, brain) {
    let text = session.message.text
    if (text === payloads.FACEBOOK_GET_STARTED) {
        return brain.triggers.GET_STARTED
    }
    else if (text === payloads.FACEBOOK_PERSISTENT_MENU_GET_UBER_CAB) {
        return 'get me an uber cab ma boy'
    }
    else if (text === payloads.FACEBOOK_PERSISTENT_MENU_FLIPKART_OFFERS) {
        return 'show me some offers on flipkart mate'
    }
    else if (text === payloads.FACEBOOK_PERSISTENT_MENU_HELP) {
        return brain.triggers.HELP
    }
    else if (text === payloads.FACEBOOK_FLIPKART_SHOW_MORE) {
        return brain.triggers.FLIPKART_SHOW_MORE
    }
    else if (text === payloads.FACEBOOK_FLIPKART_CANCEL) {
        return brain.triggers.FLIPKART_CANCEL
    }
    else if (text === payloads.FACEBOOK_CAB_UBER) {
        brain.set(session.message.user.id, brain.keys.CAB_PROVIDER, 'uber')
        return brain.triggers.ASK_LOCATION_UBER_CAB
    }
    else if (text === payloads.FACEBOOK_CAB_OLA) {
        brain.set(session.message.user.id, brain.keys.CAB_PROVIDER, 'ola')
        return brain.triggers.ASK_LOCATION_OLA_CAB
    }
    //TODO handle null geolocation
    else if (platforms.isGeolocation(session)) {
        let geolocation = platforms.getGeolocation(session);
        brain.set(session.message.user.id, brain.keys.LATITUDE, geolocation.lat)
        brain.set(session.message.user.id, brain.keys.LONGITUDE, geolocation.lon)
        return brain.triggers.HANDLE_GEOLOCATION
    }
    else {
        return text
    }
}

all.handleSpecialRepliesOnResolve = function (session, brain, response) {
    session.sendTyping();
    if (response === 'int bookcab') {
        let latitude = brain.get(session.message.user.id, brain.keys.LATITUDE);
        let longitude = brain.get(session.message.user.id, brain.keys.LONGITUDE);
        let destination = brain.get(session.message.user.id, brain.keys.CAB_DESTINATION)
        let cabProvider = brain.get(session.message.user.id, brain.keys.CAB_PROVIDER)
        let url = encodeURI('https://zup.chat/api/ride?lat=' + latitude + '&long=' + longitude + '&drop=' + destination + '&provider=' + cabProvider);
        platforms.getWebViewButton(session, 'Here is your ride! :)', url, 'Your Cab', 'full');
    }
    else {
        session.send(response);
    }
}

all.handleSpecialRepliesOnReject = function (session, brain, response) {
    session.sendTyping();
    if (response && response.type === 'carousel') {
        // carousel.sendFlipkartCarousel(session, brain, response.data, response.filters)
        carousel.handleResponse(session, brain, response)
    }
    else if (response.type === 'location') {
        platforms.askGeolocation(session, response.data)
    }
    else if (response.type === 'cabProvider') {
        platforms.sendTextQuickReply(session, response.data, ['Uber', 'Ola'], [payloads.FACEBOOK_CAB_UBER, payloads.FACEBOOK_CAB_OLA])
    }
    //ERROR here, make an appropriate message for this
    else {
        session.send(response)
    }
}

all.runCron = function () {
    flipkart.runCron();
}
module.exports = all;
