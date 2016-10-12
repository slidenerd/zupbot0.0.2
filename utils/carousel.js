'use strict'
const builder = require('../core/');
const carousel = {}

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