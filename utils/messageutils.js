const builder = require('../core/');
const cache = require('memory-cache');
const replies = require('./replies')


const messageutils = {}
const MESSENGER_CAROUSEL_LIMIT = 15;
const SKYPE_CAROUSEL_LIMIT = 5;
const EMULATOR_CAROUSEL_LIMIT = 10;


messageutils.sendFlipkartCarousel = function (session, offers) {
    // Ask the user to select an item from a carousel.
    var attachments = []
    //handle upper limits on how many items can be displayed in the carousel for each platform

    const channel = session.message.address.channelId;
    //How many items will you display in a carousel on each platform is controlled by limit
    var limit;
    if (channel.toLowerCase() === 'facebook') {
        limit = MESSENGER_CAROUSEL_LIMIT
    }
    else if (channel.toLowerCase() === 'skype') {
        limit = SKYPE_CAROUSEL_LIMIT
    }
    else {
        //Emulator has no limits, this value has been set for testing purposes on the emulator
        limit = EMULATOR_CAROUSEL_LIMIT
    }

    //A key from cache which indicates if this data was previously cached or freshly loaded
    const fresh = cache.get('fresh');

    //Out of say 60 offers that we may find, how many offers to display and start from where
    //This variable keeps track of the start so that we can show exactly 20-30 of 60
    //Number of items displayed depends on the carousel limits for each platform.
    if (fresh) {
        session.userData.from = 0;
    }

    //Begin displaying items either from 0 or from a previous number
    var from = session.userData.from || 0

    //Display exactly limit number of items
    var to = from + limit

    for (var i = from; i < to && i < offers.length; i++) {
        var offer = offers[i];
        attachments.push(new builder.HeroCard(session)
            .title(offer.title)
            .subtitle(offer.description + ' in ' + offer.category) 
            .images([
                builder.CardImage.create(session, offer.imageUrl)
                    .tap(builder.CardAction.showImage(session, offer.url)),
            ])
            .buttons([
                builder.CardAction.openUrl(session, offer.url, "Get On Flipkart")
            ]))
    }

    //Contains our text message and carousel
    var msg;

    //If we can display 10 items in each round but we have only 5 results, we need display 0-5
    const smaller = to < offers.length ? to : offers.length;
    if (offers.length) {
        //If we have more offers to display
        if ((smaller - from) > 0) {

            //The first time someone sees the results, show them a complete message       
            var txt;
            if (from == 0) {
                txt = replies.getFlipkartOffersFoundFirstTime(offers.length, from + 1, smaller)
            }

            //The subsequent time someone sees results, show them a showing now 10-20 kinda thing.

            else {
                txt = replies.getFlipkartOffersFoundAnySubsequentTime(offers.length, from, smaller)
            }
            msg = new builder.Message(session).text(txt)
                .attachmentLayout(builder.AttachmentLayout.carousel)
                .attachments(attachments);

            //Advance the start position so display the next N items for any platform
            session.userData.from = to;
        }
        else {

            //We have browsed every single offer and therefore tell the person its all over.
            msg = replies.getFlipkartNoMoreOffers()
            //We have reached the limit of browsing every single offer, lets reset things back to 0
            session.userData.from = 0
        }

    }
    else {

        //We did not find any offers perhaps because there was none or all were unavailable.
        msg = replies.getFlipkartNoOffersFound();
    }
    session.send(msg);
}

module.exports = messageutils;