const request = require('request');
const endpoints = require('../config/endpoints')

const platforms = {
    facebook: {},
    skype: {},
    slack: {},
    telegram: {},
    kik: {}
}

platforms.greet = function (session) {
    const channel = session.message.address.channelId;
    if (channel.toLowerCase() === 'facebook') {
        platforms.facebook.sendThread('../json/facebook_greeting_text.json', 'Greeting')
        platforms.facebook.sendThread('../json/facebook_get_started.json', 'GetStarted')
        platforms.facebook.sendThread('../json/facebook_persistent_menu.json', 'PersistentMenu')
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
                console.log(cmd + ": Updated.");
                console.log(body);
            } else {
                // TODO: Handle errors
                console.log(cmd + ": Failed. Need to handle errors.");
                console.log(body);
            }
        });
}

module.exports = platforms