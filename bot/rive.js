'use strict';
//Toogle debugging on RiveScript object when you need to debug
const
    all = require('../features/all'),
    cache = require('memory-cache'),
    events = require('events'),
    RiveScript = require('rivescript');

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
    brain.riveScript.setSubroutine(all.flipkart.name, all.flipkart.subroutine)
    brain.riveScript.setSubroutine(all.cab.name, all.cab.subroutine)
    brain.riveScript.setSubroutine(all.cabProvider.name, all.cabProvider.subroutine)
    brain.riveScript.setSubroutine(all.weather.name, all.weather.subroutine)
    brain.riveScript.setSubroutine(all.location.name, all.location.subroutine)
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
        brain.setLoaded(true);
        brain.initSubroutines()
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
    let reply = brain.riveScript.replyAsync(userId, text, brain.this);
    return reply;
}

brain.replySync = function (userId, text) {
    return brain.riveScript.reply(userId, text, brain.this);
}

brain.setLoaded = function (loaded) {
    brain.loaded = loaded;
}

brain.set = function(userId, key, value){
    brain.riveScript.setUservar(userId, key, value)
}

brain.get = function(userId, key){
    return brain.riveScript.getUservar(userId, key)
}

brain.setTopic = function(userId, topic){
    brain.riveScript.setUservar(userId, 'topic', value)
}

brain.getTopic = function(userId){
    return brain.riveScript.getUservar(userId, 'topic')
}

module.exports = brain;