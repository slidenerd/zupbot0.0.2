'use strict';
const
    token = 'pTb3Xb7TtgJzKit5AY4EiJpu',
    request = require('request'),
    botmetrics = require('node-botmetrics')(token),
    platforms = require('./platforms');

botmetrics.trackIncoming = function (userId, text, platform) {
    if (platform !== platforms.channels.emulator) {
        botmetrics.track({
            text: text,
            message_type: 'incoming',
            user_id: userId,
            platform: platform
        });
    }
}

botmetrics.trackOutgoing = function (userId, text, platform) {
    if (platform !== platforms.channels.emulator) {
        botmetrics.track({
            text: text,
            message_type: 'outgoing',
            user_id: userId,
            platform: platform
        });
    }
}

module.exports = botmetrics;