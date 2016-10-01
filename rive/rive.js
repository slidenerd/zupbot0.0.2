'use strict';
//Toogle debugging on RiveScript object when you need to debug
const cache = require('memory-cache');
const RiveScript = require('rivescript');
const events = require('events');

const all = require('../features/all');

let brain = {
    loaded: false,
    path: __dirname,
    riveScript: new RiveScript({ debug: false, utf8: true, onDebug: this.onDebug })
}

brain.initSubroutines = function (userId) {
    brain.riveScript.setSubroutine(all.flipkart.name, all.flipkart.subroutine)
    brain.riveScript.setSubroutine(all.ola.name, all.ola.subroutine)
    brain.riveScript.setSubroutine(all.uber.name, all.uber.subroutine)
    brain.riveScript.setSubroutine(all.weather.name, (rs, args) => {
        return all.weather.subroutine(userId, rs, args)
    })
}

brain.isLoaded = function () {
    return brain.loaded;
}

brain.load = function (userId, successCallback, errorCallback) {
    brain.riveScript.loadDirectory(brain.path, (count) => {
        brain.initSubroutines(userId)
        brain.setLoaded(true);
        brain.riveScript.sortReplies();
        successCallback()
    }, (error, count) => {
        brain.setLoaded(false);
        errorCallback();
    });
}

brain.onDebug = function (message) {
    //print all the triggers on the console
}

brain.reply = function (userId, text) {
    return brain.riveScript.replyAsync(userId, text, brain.this);
}

brain.setLoaded = function (loaded) {
    brain.loaded = loaded;
}

module.exports = brain;