'use strict';
//Toogle debugging on RiveScript object when you need to debug
const cache = require('memory-cache');
const RiveScript = require('rivescript');
const events = require('events');

let brain = {
    path: __dirname,
    loaded: false,
    object: new RiveScript({ debug: false, utf8: true, onDebug: this.onDebug })
}

brain.isLoaded = function () {
    return brain.loaded;
}
brain.setLoaded = function (loaded) {
    brain.loaded = loaded;
}

brain.load = function () {
    console.log('load called again')
    brain.object.loadDirectory(brain.path, (count) => {
        brain.onSuccess(count)
    }, (error, count) => {
        brain.onFailure(error)
    });
}

brain.onSuccess = function (count) {
    brain.setLoaded(true);
    brain.object.sortReplies();
}

brain.onFailure = function (count) {
    brain.setLoaded(false);
}

brain.onDebug = function (message) {
    //print all the triggers on the console
}

brain.reply = function () {

}

module.exports = brain;