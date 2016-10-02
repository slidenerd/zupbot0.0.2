const builder = require('../core/');
const messageutils = {}

messageutils.sendFlipkartCarousel = function (session, offers) {
    // Ask the user to select an item from a carousel.
    var attachments = []
    //handle upper limits on how many items can be displayed in the carousel for each platform
    for (var offer of offers) {
        attachments.push(new builder.HeroCard(session)
            .title(offer.title)
            .subtitle(offer.description)
            .images([
                builder.CardImage.create(session, offer.imageUrl)
                    .tap(builder.CardAction.showImage(session, offer.url)),
            ])
            .buttons([
                builder.CardAction.openUrl(session, offer.url, "Get On Flipkart")
            ]))
    }

    var msg;
    if (offers.length) {
        msg = new builder.Message(session)
            .attachmentLayout(builder.AttachmentLayout.carousel)
            .attachments(attachments);
    }
    else {
        msg = 'Ouch! It seems Flipkart has either no offers today or all their offers have been exhausted'
    }

    session.send(msg);
}

module.exports = messageutils;