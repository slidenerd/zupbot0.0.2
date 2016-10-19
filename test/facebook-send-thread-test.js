const request = require('request');
const endpoints = require('../config/endpoints')
const facebookTemplates = require('../utils/facebook-templates')

const platforms = {
    channels: {
        emulator: 'emulator',
        facebook: 'facebook',
        kik: 'kik',
        slack: 'slack',
        skype: 'skype',
        telegram: 'telegram'
    },
    facebook: {
        GRAPH_BASE_URI: 'https://graph.facebook.com/v2.8'
    }
}

const session = {
    message: {
        user: {
            id: '1078904948813864'
        }
    },
    userData: {
        user: {
            profile: {}
        }
    }
}

// Calls the Facebook graph api to change bot settings
platforms.facebook.sendThread = function (template, cmd) {

    return new Promise((resolve, reject) => {
        // Start the request
        request({
            url: platforms.facebook.GRAPH_BASE_URI + '/me/thread_settings?access_token=' + endpoints.FACEBOOK_PAGE_ACCESS_TOKEN,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            form: template
        },
            function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    // Print out the response body
                    resolve({ status: response.statusCode, data: body })
                } else {
                    // TODO: Handle errors
                    reject({ status: response.statusCode, data: error })
                }
            });
    })
}

platforms.facebook.getProfile = function (userId) {
    return new Promise((resolve, reject) => {
        request({
            url: platforms.facebook.GRAPH_BASE_URI + '/' + userId,
            method: 'GET',
            qs: {
                access_token: endpoints.FACEBOOK_PAGE_ACCESS_TOKEN,
                fields: 'first_name,last_name,profile_pic,locale,timezone,gender'
            },
            headers: { 'Content-Type': 'application/json' },
            json: true
        },
            function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    let profile = {
                        firstName: body.first_name,
                        lastName: body.last_name,
                        picture: body.profile_pic,
                        locale: body.locale,
                        timezone: body.timezone,
                        gender: body.gender
                    }
                    resolve({ status: response.statusCode, data: profile })
                } else {
                    // TODO: Handle errors
                    reject({ status: response.statusCode, data: error })
                }
            });
    })
}

/**
 * Actions to perform on each platform when the user runs it the first time
 */
platforms.firstRun = function (userId, channel) {
    switch (channel) {
        case platforms.channels.emulator:
            return Promise.reject('none')
        case platforms.channels.facebook:
            return platforms.facebook.firstRun(userId)
        case platforms.channels.skype:
            return Promise.reject('none')
        default:
            return Promise.reject('none')
    }
}

platforms.facebook.firstRun = function () {
    return Promise.all([
        platforms.facebook.sendThread(facebookTemplates.greet(), 'Greeting'),
        platforms.facebook.sendThread(facebookTemplates.getStarted(), 'Get Started'),
        platforms.facebook.sendThread(facebookTemplates.getPersistentMenu(), 'Persistent Menu'),
        platforms.facebook.sendThread(facebookTemplates.getDomainWhitelisting(), 'Domain Whitelisting'),
        platforms.facebook.getProfile(session.message.user.id)
    ])
}

platforms.firstRun = function (userId, channel) {
    switch (channel) {
        case platforms.channels.emulator:
            return Promise.reject('none')
        case platforms.channels.facebook:
            return platforms.facebook.firstRun(userId)
        case platforms.channels.skype:
            return Promise.reject('none')
        default:
            return Promise.reject('none')
    }
}

platforms.firstRun(session.message.user.id, 'facebook')
    .then((values) => {
        for (let value of values) {
            if (value.data.firstName && value.data.lastName) {
                console.log(value)
            }
        }
    })
    .catch((error) => {
        console.error(error)
    })



