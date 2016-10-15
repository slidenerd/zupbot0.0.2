'use strict';

const request = require('request');
const endpoints = require('../config/endpoints')
const facebookTemplates = require('./facebook-templates')

const platforms = {
    actions: {
        askGeolocation: 'askGeolocation',
        firstRun: 'firstRun',
        getGeolocation: 'getGeolocation',
        isGeolocation: 'isGeolocation',
        limits: {
            carousel: 'carouselLimits'
        },
        sendWebView: 'sendWebView',
        sendQuickReply: 'sendQuickReply',
        sendThread: 'sendThread'
    },
    channels: {
        emulator: 'emulator',
        facebook: 'facebook',
        kik: 'kik',
        slack: 'slack',
        skype: 'skype',
        telegram: 'telegram'
    },
    emulator: {
        limits: {
            carousel: 10
        }
    },
    facebook: {
        limits: {
            carousel: 10
        }
    },
    skype: {
        limits: {
            carousel: 5
        }
    }
}

platforms.askGeolocation = function (session, message) {
    const channel = session.message.address.channelId;
    switch (channel) {
        case platforms.channels.emulator:
            session.send(message);
            break;
        case platforms.channels.facebook:
            platforms.facebook.askGeolocation(session, message);
            break;
        case platforms.channels.skype:
            break;
        default:
            break;
    }
}

/**
 * Actions to perform on each platform when the user runs it the first time
 */
platforms.firstRun = function (session) {
    const channel = session.message.address.channelId;
    switch (channel) {
        case platforms.channels.emulator:
            break
        case platforms.channels.facebook:
            platforms.facebook.sendThread(facebookTemplates.greet(), 'Greeting')
            platforms.facebook.sendThread(facebookTemplates.getStarted(), 'Get Started')
            platforms.facebook.sendThread(facebookTemplates.getPersistentMenu(), 'Persistent Menu')
            platforms.facebook.sendThread(facebookTemplates.getDomainWhitelisting(), 'Domain Whitelisting')
            break
        case platforms.channels.skype:
            break
        default:
    }
}

platforms.getCarouselLimits = function (channel) {
    switch (channel) {
        case platforms.channels.emulator:
            return platforms.emulator.limits.carousel;
        case platforms.channels.facebook:
            return platforms.facebook.limits.carousel;
        case platforms.channels.skype:
            return platforms.skype.limits.carousel;
        default:
            return 5;
    }
}

platforms.getGeolocation = function (session) {
    const channel = session.message.address.channelId;
    switch (channel) {
        case platforms.channels.emulator:
            return null;
        case platforms.channels.facebook:
            return platforms.facebook.getGeolocation(session);
        case platforms.channels.skype:
            return null;
        default:
            return null;
    }
}

platforms.getWebViewButton = function (session, text, url, urlTitle, webViewRatio) {
    const channel = session.message.address.channelId;
    let webView;
    switch (channel) {
        case platforms.channels.emulator:
            break;
        case platforms.channels.facebook:
            webView = facebookTemplates.getWebViewButtonTemplate(session.message.user.id, text, url, urlTitle, webViewRatio)
            platforms.facebook.getWebViewButton(webView)
            break;
        case platforms.channels.skype:
            break;
        default:
            break;
    }
}

platforms.isGeolocation = function (session) {
    const channel = session.message.address.channelId;
    switch (channel) {
        case platforms.channels.emulator:
            return false;
        case platforms.channels.facebook:
            return platforms.facebook.isGeolocation(session);
        case platforms.channels.skype:
            return false;
        default:
            return false;
    }
}

platforms.facebook.askGeolocation = function (session, message) {
    request({
        url: 'https://graph.facebook.com/v2.7/me/messages?access_token=' + endpoints.FACEBOOK_PAGE_ACCESS_TOKEN,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        form: facebookTemplates.getGeolocationTemplate(session.message.user.id, message)
    },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                // Print out the response body
                console.log(": Updated with quick reply");
            } else {
                // TODO: Handle errors
                console.log(": Failed. Need to handle errors." + error + ' ' + response.statusCode);
            }
        });
}

platforms.facebook.getGeolocation = function (session) {
    //Get the entities sent by the user if any
    let entities = session.message.entities;
    return {
        lat: entities[0].geo.latitude,
        lon: entities[0].geo.longitude
    }
}

platforms.facebook.getWebViewButton = function (webView) {
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

platforms.facebook.isGeolocation = function (session) {
    //Get the entities sent by the user if any
    let entities = session.message.entities;
    if (entities
        && entities.length
        && entities[0]
        && entities[0].geo
        && entities[0].geo.latitude
        && entities[0].geo.longitude
        && entities[0].type.toLowerCase() === 'place') {
        return true;
    }
    return false;
}

// Calls the Facebook graph api to change letious bot settings
platforms.facebook.sendThread = function (template, cmd) {

    // Start the request
    request({
        url: 'https://graph.facebook.com/v2.7/me/thread_settings?access_token=' + endpoints.FACEBOOK_PAGE_ACCESS_TOKEN,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        form: template
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

platforms.sendQuickReply = function (session, quickReplies) {
    const channel = session.message.address.channelId;
    switch (channel) {
        case platforms.channels.emulator:
            break;
        case platforms.channels.facebook:
            platforms.facebook.sendQuickReply(session, quickReplies)
            break;
        case platforms.channels.skype:
            break;
        default:
            break;
    }
}

platforms.sendTextQuickReply = function (session, text, titles, payloads) {
    const channel = session.message.address.channelId;
    switch (channel) {
        case platforms.channels.emulator:
            break;
        case platforms.channels.facebook:
            platforms.facebook.sendTextQuickReply(session, text, titles, payloads)
            break;
        case platforms.channels.skype:
            break;
        default:
            break;
    }
}

platforms.facebook.sendQuickReply = function (session, quickReplies) {
    let quickReply = {
        recipient: {
            id: session.message.user.id
        },
        message: quickReplies
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

platforms.facebook.sendTextQuickReply = function (session, text, titles, payloads) {
    let quickReplies = facebookTemplates.getTextQuickReplies(text, titles, payloads);
    let json = {
        recipient: {
            id: session.message.user.id
        },
        message: JSON.stringify(quickReplies)
    }
    console.log(json)
    request({
        url: 'https://graph.facebook.com/v2.7/me/messages?access_token=' + endpoints.FACEBOOK_PAGE_ACCESS_TOKEN,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        form: json
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
module.exports = platforms