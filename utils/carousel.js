'use strict'
const
    builder = require('../core/'),
    constants = require('./constants'),
    flipkart = require('../features/flipkart');

const carousel = {}
let timeout;

carousel.handleResponse = function (session, brain, response) {
    let topic = brain.getTopic(session.message.user.id)
    console.log(topic + ' ' + constants.KEY_OFFERS)
    if (topic === constants.KEY_OFFERS) {
        console.log('arrived inside the condition ')
        carousel.handleFlipkartResponse(session, brain, response);
    }
}

carousel.handleFlipkartResponse = function (session, brain, response) {
    // carousel.sendFlipkartCarousel(session, brain, response.data, response.filters)
    console.log('we are good here')
    let page = flipkart.paginator(session, response.data);
    console.log('got the page ', page)
    brain.set(session.message.user.id, 'flipkartpagestart', page.start + 1)
    brain.set(session.message.user.id, 'flipkartpageend', page.end)
    brain.set(session.message.user.id, 'flipkartofferscount', page.count)
    console.log('showing offers from ' + (page.start + 1) + ' to  ' + page.end)
    let reply = brain.replySync(session.message.user.id, page.triggerName)
    carousel.showFlipkartOffers(session, page.offers, reply)

    //update the last active time when the user viewed flipkart results
    session.userData.flipkart.lastActive = new Date().getTime();
    //if we havent set a timeout previously, we set one
    if (!timeout) {
        timeout = setInterval(() => {
            let currentTime = new Date().getTime();
            if (currentTime - session.userData.flipkart.lastActive > 30000) {
                platforms.sendQuickReply(session, require('./json/quick_reply_flipkart_show_more.json'))
                clearInterval(timeout)
                //unset the timeout variable so that the person can see the quick reply once again after the next request to view flipkart carousel
                timeout = null;
            }
        }, 30000)
    }
}

carousel.showFlipkartOffers = function (session, offers, text) {
    let attachments = []

    //Out of say 60 offers that we may find, how many offers to display and start from where
    //This letiable keeps track of the start so that we can show exactly 20-30 of 60
    //Number of items displayed depends on the carousel limits for each platform.
    for (let i = 0; i < offers.length; i++) {
        let offer = offers[i];
        attachments.push(new builder.HeroCard(session)
            .title(offer.title)
            .subtitle(offer.description)
            .images([
                builder.CardImage.create(session, offer.imageUrl)
                    .tap(builder.CardAction.showImage(session, offer.url)),
            ])
            .buttons([
                builder.CardAction.openUrl(session, offer.url, "View On Flipkart")
            ]))
    }
    let msg = new builder.Message(session).text(text)
        .attachmentLayout(builder.AttachmentLayout.carousel)
        .attachments(attachments);
    session.send(msg)
}

module.exports = carousel;