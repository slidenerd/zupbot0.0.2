'use strict';
//Toogle debugging on RiveScript object when you need to debug
const cache = require('memory-cache');
const RiveScript = require('rivescript');
const events = require('events');

const all = require('../features/all');

/**
 * Initially, the brain is not loaded
 * All the rive files are located in the current directory
 */
let brain = {
    loaded: false,
    path: __dirname,
    riveScript: new RiveScript({ debug: false, utf8: true, onDebug: this.onDebug })
}

/**
 * Initialize all the methods that will called from rive files.
 * All subroutines must return values
 */
brain.initSubroutines = function () {
    brain.riveScript.setSubroutine(all.flipkart.name, (rs, args) => {
        return all.flipkart.subroutine(rs, args)
    })
    brain.riveScript.setSubroutine(all.ola.name, all.ola.subroutine)
    brain.riveScript.setSubroutine(all.uber.name, all.uber.subroutine)
    brain.riveScript.setSubroutine(all.weather.name, (rs, args) => {
        return all.weather.subroutine(rs, args)
    })
}

/**
 * Check if the brain has been loaded before
 */
brain.isLoaded = function () {
    return brain.loaded;
}

/**
 * Load the brain
 * If successfully, loaded, initialize all subroutines
 * Change the state of the brain to loaded
 * Sort all rive replies
 * Execute the callback for success
 * If not loaded, reset state of the brain to not loaded
 * Trigger the callback for error
 */
brain.load = function (onSuccess, onError) {
    brain.riveScript.loadDirectory(brain.path, (count) => {
        brain.initSubroutines()
        brain.setLoaded(true);
        brain.riveScript.sortReplies();
        onSuccess()
    }, (error, count) => {
        brain.setLoaded(false);
        onError();
    });
}

brain.onDebug = function (message) {
    //print all the triggers on the console
}

/**
 * Return an asynchronous reply from the brain corresponding to a particular user id
 */
brain.reply = function (userId, text) {
    return brain.riveScript.replyAsync(userId, text, brain.this);
}

brain.setLoaded = function (loaded) {
    brain.loaded = loaded;
}

module.exports = brain;