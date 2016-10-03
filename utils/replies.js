const util = require('util')

const replies = {}

/**
 * Returns a random integer between min (inclusive) and max (inclusive)
 * Using Math.round() will give you a non-uniform distribution!
 */
replies.getRandomInt = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

replies.getRandomMessage = function (messages) {
    return messages[replies.getRandomInt(0, messages.length - 1)];
}

replies.brainLoadingFailed = [
    'I am sorry, it seems something went wrong while putting my brains inside my head. Feel free to inform about this to my creator at admin@zup.chat',
    'Ouch! I short circuited myself, sorry about that. Please inform my creator about this at admin@zup.chat',
    'Oh no! That rat just nibbled my server\'s wires and the lights went out. I am sorry, you can email my bonehead creator about this at admin@zup.chat. Please tell him to get rat poison ready in the future',
    'Eeeeek! The watchman\'s cat just took a piss straight on my server and it short circuited. Feel free to inform my creator at admin@zup.chat and please add a sentence telling him not allow cats in the server room'
]

replies.getBrainLoadingFailed = function () {
    return replies.getRandomMessage(replies.brainLoadingFailed)
}

replies.flipkartOffersFoundFirstTime = [
    'Hurrah! I found %d offers for you on Flipkart. May your shopping be shosperous, oops I was gonna say properous. Here comes %d to %d',
    'Weee, Flipkart gave us %d offers. Isn\'t that awesome! Here comes %d to %d',
    'Yee-Haw! that is so cool of Flipkart to give us %d offers. Showing %d to %d',
    'Ooh-la-la, I was able to get %d offers on Flipkart. Displaying %d to %d'
]

replies.getFlipkartOffersFoundFirstTime = function (count, from, to) {
    var formattedReplies = []
    for (var message of replies.flipkartOffersFoundFirstTime) {
        formattedReplies.push(util.format(message, count, from, to));
    }
    return replies.getRandomMessage(formattedReplies)
}

replies.flipkartOffersFoundAnySubsequentTime = [
    'Here comes %d - %d of %d',
    'Now showing, %d - %d of %d',
    'Showing %d - %d of %d',
    'Currently at %d - %d of %d',
    'Looking at %d - %d of %d',
    'Viewing %d - %d of %d',
    'Displaying %d - %d of %d'
]

replies.getFlipkartOffersFoundAnySubsequentTime = function (count, from, to) {
    var formattedReplies = []
    for (var message of replies.flipkartOffersFoundAnySubsequentTime) {
        formattedReplies.push(util.format(message, from, to, count));
    }
    return replies.getRandomMessage(formattedReplies)
}

replies.flipkartNoMoreOffers = [
    'Oops thats all the offers that I found on Flipkart for now. You will be able to see the existing ones till I get more shortly',
    'Well, that\'s all the Flipkart offers for another couple of hours now. You can however browse the existing ones anytime',
    'Guess our Flipkart party comes to an end for now. I coudnt find anymore offers but Flipkart will come out with new ones in a couple of hours',
]

replies.getFlipkartNoMoreOffers = function () {
    return replies.getRandomMessage(replies.flipkartNoMoreOffers)
}

replies.flipkartNoOffersFound = [
    'Ouch! It seems Flipkart has either no offers today or all their offers have been exhausted',
    'It seems we are late for the party. Flipkart doesnt seem to have any more offers for now',
    'Flipkart has no offers for the time being, I am now waiting for the next train to arrive'
]

replies.getFlipkartNoOffersFound = function () {
    return replies.getRandomMessage(replies.flipkartNoOffersFound)
}

module.exports = replies;