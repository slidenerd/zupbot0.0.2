'use strict'
const builder = require('../core/');
const cache = require('memory-cache');
const replies = require('./replies');
const flipkart = require('../features/flipkart');
const platforms = require('./platforms')

const messageutils = {}

//TODO add a show more button and no thanks
messageutils.sendFlipkartCarousel = function (session, brain, offers, filters) {

    //A key from cache which indicates if this data was previously cached or freshly loaded
    const fresh = cache.get('fresh');
    const userId = session.message.user.id;
    // The container for our carousel items.
    let attachments = []

    //How many items will you display in a carousel on each platform is controlled by limit
    let limit = platforms.getCarouselLimits(session.message.address.channelId);

    //Out of say 60 offers that we may find, how many offers to display and start from where
    //This letiable keeps track of the start so that we can show exactly 20-30 of 60
    //Number of items displayed depends on the carousel limits for each platform.
    if (fresh) {
        session.userData.flipkartPaginationStartIndex = 0;
    }

    if (filters) {
        console.log('old ' + session.userData.flipkartFilters);
        console.log('new ' + filters[0]);
        session.userData.flipkartFilters = filters;
    }

    //Begin displaying items either from 0 or from a previous number
    let start = session.userData.flipkartPaginationStartIndex || 0

    //Display exactly limit number of items
    let end = start + limit

    offers = flipkart.applyFilters(offers, session.userData.flipkartFilters);


    for (let i = start; i < end && i < offers.length; i++) {
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


    //Contains our text message and carousel
    let msg;
    //If we can display 10 items in each round but we have only 5 results, we need display 0-5
    const available = end < offers.length ? end : offers.length;
    const remaining = available - start;

    brain.set(userId, 'flipkartpagestart', start + 1)
    brain.set(userId, 'flipkartpageend', available)
    brain.set(userId, 'flipkartofferscount', offers.length)
    if (offers.length) {
        //If we have more offers to display
        if ((available - start) > 0) {

            //The first time someone sees the results, show them a complete message       
            let txt;
            if (start == 0) {
                txt = brain.replySync(userId, 'jsflipkartfirsttime')
            }

            //The subsequent time someone sees results, show them a showing now 10-20 kinda thing.

            else {
                txt = brain.replySync(userId, 'jsflipkartsubsequenttime')
            }
            const lastActive = new Date().getTime();
            msg = new builder.Message(session).text(txt)
                .attachmentLayout(builder.AttachmentLayout.carousel)
                .attachments(attachments);
            //Advance the start position so display the next N items for any platform
            session.userData.flipkartPaginationStartIndex = end;

            let timeout = setTimeout(() => {
                let currentTime = new Date().getTime();
                if (currentTime - lastActive > 30000) {
                    platforms.sendQuickReply(session, require('../json/quick_reply_flipkart_show_more.json'))
                    clearTimeout(timeout)
                }
            }, 30000)
        }
        else {

            //We have browsed every single offer and therefore tell the person its all over.
            msg = brain.replySync(userId, 'jsflipkartexhausted')
            //We have reached the limit of browsing every single offer, lets reset things back to 0
            session.userData.flipkartPaginationStartIndex = 0

            //Reset filters set by the user
            session.userData.filters = null;
        }

    }
    else {

        //We did not find any offers perhaps because there was none or all were unavailable.
        msg = brain.replySync(userId, 'jsflipkartnone')
    }
    session.send(msg);
}

module.exports = messageutils;