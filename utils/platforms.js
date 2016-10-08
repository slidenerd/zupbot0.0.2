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

platforms.testWebView = function (session) {
    var webView = {
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

platforms.sendQuickReply = function(session, quickReplies){
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

// Calls the Facebook graph api to change various bot settings
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
    var quickReply = {
        recipient: {
            id: session.message.user.id
        },
        "message": quickReplies
    }

}

module.exports = platforms