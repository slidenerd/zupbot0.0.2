'use strict';

const request = require('request');
const endpoints = require('../config/endpoints')
const MESSENGER_CAROUSEL_LIMIT = 10;
const SKYPE_CAROUSEL_LIMIT = 5;
const EMULATOR_CAROUSEL_LIMIT = 10;
const platforms = {
    facebook: {},
    skype: {},
    slack: {},
    telegram: {},
    kik: {}
}

platforms.getCarouselLimits = function (channel) {
    if (channel.toLowerCase() === 'facebook') {
        return MESSENGER_CAROUSEL_LIMIT
    }
    else if (channel.toLowerCase() === 'skype') {
        return SKYPE_CAROUSEL_LIMIT
    }
    else {
        //Emulator has no limits, this value has been set for testing purposes on the emulator
        return EMULATOR_CAROUSEL_LIMIT
    }
}

platforms.greet = function (session) {
    const channel = session.message.address.channelId;
    if (channel.toLowerCase() === 'facebook') {
        platforms.facebook.sendThread('../json/facebook_greeting_text.json', 'Greeting')
        platforms.facebook.sendThread('../json/facebook_get_started.json', 'GetStarted')
        platforms.facebook.sendThread('../json/facebook_persistent_menu.json', 'PersistentMenu')
        platforms.facebook.sendThread('../json/facebook_domain_whitelisting.json', 'Domain Whitelisting');
        console.log('greeting with facebook')
    }
    else if (channel.toLowerCase() === 'skype') {

    }
    else if (channel.toLowerCase() === 'slack') {

    }
    else if (channel.toLowerCase() === 'telegram') {

    }
    else if (channel.toLowerCase() === 'kik') {

    }
    else if (channel.toLowerCase() === 'emulator') {

    }
}

platforms.isGeolocation = function (session) {
    const channel = session.message.address.channelId;
    if (channel.toLowerCase() === 'facebook') {
        return platforms.facebook.isGeolocation(session)
    }
    else if (channel.toLowerCase() === 'skype') {
        return false;
    }
    else if (channel.toLowerCase() === 'slack') {
        return false;
    }
    else if (channel.toLowerCase() === 'telegram') {
        return false;
    }
    else if (channel.toLowerCase() === 'kik') {
        return false;
    }
    else if (channel.toLowerCase() === 'emulator') {
        return false;
    }
    return false;
}

platforms.getGeolocation = function (session) {
    const channel = session.message.address.channelId;
    if (channel.toLowerCase() === 'facebook') {
        return platforms.facebook.getGeolocation(session)
    }
    else if (channel.toLowerCase() === 'skype') {
        return null;
    }
    else if (channel.toLowerCase() === 'slack') {
        return null;
    }
    else if (channel.toLowerCase() === 'telegram') {
        return null;
    }
    else if (channel.toLowerCase() === 'kik') {
        return null;
    }
    else if (channel.toLowerCase() === 'emulator') {
        return null;
    }
    return null;
}

platforms.testWebView = function (session) {
    let webView = {
        recipient: {
            id: session.message.user.id
        },
        message: {
            attachment: {
                type: "template",
                payload: {
                    template_type: "button",
                    text: "What do you want to do next?",
                    buttons: [
                        {
                            "type": "web_url",
                            "url": "https://zup.chat/features/cab.html",
                            "title": "Book A Cab",
                            "webview_height_ratio": "compact"
                        }
                    ]
                }
            }
        }
    }
    request({
        url: 'https://graph.facebook.com/v2.7/me/messages?access_token=' + endpoints.FACEBOOK_PAGE_ACCESS_TOKEN,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        form: webView
    },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                // Print out the response body
                console.log(": Updated.");
                console.log(body);
            } else {
                // TODO: Handle errors
                console.log(": Failed. Need to handle errors.");
                console.log(body);
            }
        });

}

platforms.sendQuickReply = function (session, quickReplies) {
    const channel = session.message.address.channelId;
    if (channel.toLowerCase() === 'facebook') {
        platforms.facebook.sendQuickReply(session, quickReplies)
    }
    else if (channel.toLowerCase() === 'skype') {

    }
    else if (channel.toLowerCase() === 'slack') {

    }
    else if (channel.toLowerCase() === 'telegram') {

    }
    else if (channel.toLowerCase() === 'kik') {

    }
    else if (channel.toLowerCase() === 'emulator') {

    }
}

// Calls the Facebook graph api to change letious bot settings
platforms.facebook.sendThread = function (jsonFile, cmd) {

    // Start the request
    request({
        url: 'https://graph.facebook.com/v2.7/me/thread_settings?access_token=' + endpoints.FACEBOOK_PAGE_ACCESS_TOKEN,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        form: require(jsonFile)
    },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                // Print out the response body
                console.log(cmd + ": Updated.");
                console.log(body);
            } else {
                // TODO: Handle errors
                console.log(cmd + ": Failed. Need to handle errors.");
                console.log(body);
            }
        });
}

platforms.facebook.sendQuickReply = function (session, quickReplies) {
    let quickReply = {
        recipient: {
            id: session.message.user.id
        },
        "message": quickReplies
    }
    request({
        url: 'https://graph.facebook.com/v2.7/me/messages?access_token=' + endpoints.FACEBOOK_PAGE_ACCESS_TOKEN,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        form: quickReply
    },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                // Print out the response body
                console.log(": Updated with quick reply");
            } else {
                // TODO: Handle errors
                console.log(": Failed. Need to handle errors." + error);
            }
        });
}

platforms.facebook.askLocation = function (session, message) {
    let quickReply = {
        recipient: {
            id: session.message.user.id
        },
        "message": {
            text: message,
            quick_replies: [
                {
                    "content_type": "location"
                }
            ]
        }
    }
    request({
        url: 'https://graph.facebook.com/v2.7/me/messages?access_token=' + endpoints.FACEBOOK_PAGE_ACCESS_TOKEN,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        form: quickReply
    },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                // Print out the response body
                console.log(": Updated with quick reply");
            } else {
                // TODO: Handle errors
                console.log(": Failed. Need to handle errors." + error);
            }
        });
}

platforms.facebook.isGeolocation = function (session) {
    //Get the entities sent by the user if any
    let entities = session.message.entities;
    return entities
        && entities.length
        && entities[0]
        && entities[0].geo
        && entities[0].geo.latitude
        && entities[0].geo.longitude
        && entities[0].type.toLowerCase() === 'place'
}

platforms.facebook.getGeolocation = function (session) {
    //Get the entities sent by the user if any
    let entities = session.message.entities;
    return {
        lat: entities[0].geo.latitude,
        lon: entities[0].geo.longitude
    }
}

module.exports = platforms