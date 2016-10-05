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
        platforms.facebook.sendThread('../json/facebook_greeting_text.json', 'Greeting', session)
        platforms.facebook.sendThread('../json/facebook_get_started.json', 'GetStarted', session)
        platforms.facebook.sendThread('../json/facebook_persistent_menu.json', 'PersistentMenu', session)
        platforms.facebook.sendThread('../json/facebook_domain_whitelisting.json', 'Domain Whitelisting', session);
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
                session.send('Updated ' + cmd + ' for you ' + session.message.user.name + ' successfully')
                console.log(body);
            } else {
                // TODO: Handle errors
                session.send('Oops ' + session.message.user.name + ' I had an error ' + error + ' while updating ' + cmd)
                console.log(body);
            }
        });
}

module.exports = platforms