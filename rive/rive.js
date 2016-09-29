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

brain.initSubroutines = function () {
    brain.riveScript.setSubroutine(all.flipkart.name, all.flipkart.subroutine)
    brain.riveScript.setSubroutine(all.ola.name, all.ola.subroutine)
    brain.riveScript.setSubroutine(all.uber.name, all.uber.subroutine)
    brain.riveScript.setSubroutine(all.weather.name, all.weather.subroutine)
}

brain.isLoaded = function () {
    return brain.loaded;
}

brain.load = function (successCallback, errorCallback) {
    brain.riveScript.loadDirectory(brain.path, (count) => {
        brain.onSuccess(count, successCallback)
    }, (error, count) => {
        brain.onFailure(error, errorCallback)
    });
}

brain.onDebug = function (message) {
    //print all the triggers on the console
}

brain.onFailure = function (count, errorCallback) {
    brain.setLoaded(false);
    errorCallback();
}

brain.onSuccess = function (count, successCallback) {
    brain.initSubroutines()
    brain.setLoaded(true);
    brain.riveScript.sortReplies();
    successCallback()
}

brain.reply = function (userId, text) {
    return brain.riveScript.replyAsync(userId, text, brain.this);
}

brain.setLoaded = function (loaded) {
    brain.loaded = loaded;
}

module.exports = brain;