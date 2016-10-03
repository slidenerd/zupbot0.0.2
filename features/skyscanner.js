'use strict';

const
    builder = require('../core/'),
    constants = require('../engine/constants'),
    utils = require('../engine/utils'),
    //The name of the subroutine that can find deals
    subroutineName = getFlightDetailsFromSkyScanner.name,
    request = require('request')



getFlightDetailsFromSkyScanner('coimb', 'chennai', '2016-10-12', '2016-10-22');

/**
 * Main entry point in this file
 */
function init(rs, userId, session) {
    rs.setSubroutine(subroutineName, (rs, args) => {
        return new rs.Promise((resolve, reject) => {
            report(resolve, reject, rs, args, userId, session);
        });
    });
}

function getFlightDetailsFromSkyScanner(from, to, outboundDate, inboundDate) {
    var body = new Object();
    body.country = 'IN';
    body.currency = 'INR';
    body.locale = 'en-IN';
    body.locationSchema = 'sky';
    body.apikey = 'prtl6749387986743898559646983194';
    body.grouppricing = 'on';
    body.outbounddate = outboundDate;
    body.inbounddate = inboundDate;
    body.adults = 1;
    findLocation(body, from, to, 0);
}

function findLocation(params, query, nextQuery, count) {
    var options = {
        url: constants.ENDPOINT_SKY_SCANNER_AUTO_SUGGEST + query + '&apiKey=' + constants.SKYSCANNER_API_KEY,
        json: true
    }
    request.get(options, (error, response, body) => {
        if(response.statusCode == 200) {
            if(body.Places.length == 0) {
                //TODO: no results found
                console.log("Found no results for query " + query);
            } else if(body.Places.length == 1) {
                if(count == 0) {
                    params.originplace = body.Places[0].PlaceId;
                    findLocation(params, nextQuery, null, 1);
                } else if(count == 1) {
                    params.destinationplace = body.Places[0].PlaceId;
                    getFlightDetails(params);
                }    
            } else {
                //TODO: multiple results found
                console.log("Found " + body.Places.length + " results for query " + query);
            }
        }
    });
}

function getFlightDetails(body) {
    var headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json' 
    };

    var options = {
        url: constants.ENDPOINT_SKY_SCANNER_LIVE_PRICE + constants.SKYSCANNER_API_KEY,
        headers: headers,
        form: body,
        json: false
    };



    return new Promise((resolve, reject) => {
        request.post(options, (error, response, body) => {
            sessionStartCallback(resolve, reject, error, response, body)
        });
    });
}

function sessionStartCallback(resolve, reject, error, response, body) {
    if (!error && response.statusCode == 201) {
        var location = response.headers.location;
        var headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'Cookie': response.headers["set-cookie"][0]
        };
        
        var options = {
            url: location + "?apikey=" + constants.SKYSCANNER_API_KEY + "&pageindex=0&pagesize=20",
            headers: headers,
            json: true
        };
        setTimeout(function() {
            pollSession(options, resolve, reject);
        }, 1000);
        return;
    }
    finalCallback(resolve, reject, error, response, body);
}

function pollSession(options, resolve, reject) {
    console.log("Polling...");
        request.get(options, (error, response, body) => {
            if(error) {
                reject(error);
                return;
            }
            if (response.statusCode == 200) {
                if(body.Status == "UpdatesPending") {
                    setTimeout(function() {
                        pollSession(options, resolve, reject);
                    }, 500)                
                } else if(body.Status == "UpdatesComplete") {
                    finalCallback(resolve, reject, error, response, body);
                }
                return;
            } else if(response.statusCode == 304) {
                setTimeout(function() {
                    pollSession(options, resolve, reject);
                }, 500)                
                return;    
            }
            finalCallback(resolve, reject, error, response, body);
        });
}

function finalCallback(resolve, reject, error, response, body) {
    if (!error) {
        let flightOptions = parse(body);
        console.log(flightOptions);
        resolve(flightOptions);
    }
    else {
        reject(error);
    }
}

function parse(json) {
    let options = [];
    console.log(json);
    for (let legs of json.Legs) {
        var option = new Object();
        var outbound = new Object();
        outbound.departure = legs.Departure
        outbound.arrival = legs.Arrival
        outbound.stops = legs.Stops.length
        outbound.duration = legs.Duration
        outbound.id = legs.Id
        option.outboud = outbound
        
        var inbound = new Object();
        inbound.departure = legs.Departure
        inbound.arrival = legs.Arrival
        inbound.stops = legs.Stops.length
        inbound.duration = legs.Duration
        inbound.id = legs.Id
        option.inbound = inbound
        option = findCheapestPrice(option, json)
        options.push(option)
    }
    return options;
}

function findCheapestPrice(option, json) {
    var price = Number.MAX_SAFE_INTEGER;
    var bookingLink;
    for (let priceObj of json.Itineraries[0].PricingOptions) {
        if(priceObj.Price < price) {
            price = priceObj.Price;
            bookingLink = priceObj.DeeplinkUrl;
        }    
    }
    option.price = price;
    option.bookingLink = bookingLink
    return option;
    
}

//TODO detect source if its skype or facebook and render different content for each
function report(resolve, reject, rs, args, userId, session) {
    getDealsOfTheDayFromFlipkart()
        .then((deals) => {
            if (deals) {
                let channelId = session.message.address.channelId;
                return handlePlatforms(userId, channelId,session, rs, deals)
            }
            else {
                session.send(utils.sendRandomMessage(constants.INFO_NO_DEALS_FOUND));
                resolve(true);
            }
        })
        .then((reply) => {
            resolve(reply);
        })
        .catch((error) => {
            console.log(error);
            reject(error);
        })
}

//TODO handle limits for each platform while displaying carousel, Facebook has a limit of 15, Skype has a limit of 5

//TODO track this bug https://github.com/Microsoft/BotBuilder/issues/1167
//If Skype is on, messenger doesnt show carousel and if messenger is ON, skype doesnt show carousel
function handlePlatforms(userId, channelId, session, rs, deals) {
    let attachments = []
    if (channelId.toLowerCase() === 'facebook') {
        //Build cards containing all the data
        for (let i = 0; i < deals.length && i < constants.MESSENGER_CAROUSEL_LIMIT; i++) {
            let deal = deals[i];
            attachments.push(
                new builder.HeroCard(session)
                    .title(deal.title)
                    .subtitle(deal.subtitle)
                    .images([
                        builder.CardImage.create(session, deal.imageUrl)
                            .tap(builder.CardAction.openUrl(session, deal.url)),
                    ])
                    .buttons([
                        builder.CardAction.openUrl(session, deal.url, "View On Flipkart")
                    ])
            )
        }
    }
    else {
        //Build cards containing all the data
        //All skype urls must be in HTTPS else they wont be rendered
        for (let i = 0; i < deals.length && i < constants.SKYPE_CAROUSEL_LIMIT; i++) {
            let deal = deals[i];
            let httpsDealUrl =  replaceHttpLinksWithHttpsForSkype(deal.url);
            let httpsImageUrl = replaceHttpLinksWithHttpsForSkype(deal.imageUrl);
            attachments.push(
                new builder.HeroCard(session)
                    .title(deal.title)
                    .subtitle(deal.subtitle)
                    .images([
                        builder.CardImage.create(session, httpsImageUrl)
                            .tap(builder.CardAction.openUrl(session, httpsDealUrl)),
                    ])
                    .buttons([
                        builder.CardAction.openUrl(session, httpsDealUrl, "View On Flipkart")
                    ])
            )
        }
    }
    rs.setUservar(userId, constants.VAR_FLIPKART_RESULTS_SIZE, deals.length)
    let msg = new builder.Message(session)
        .attachmentLayout(builder.AttachmentLayout.carousel)
        .attachments(attachments);
    session.send(msg);
    return rs.replyAsync(userId, constants.JS_TRIGGER_DEALS, this);
}

//TODO do this with a regex that matches the beginning of each line
function replaceHttpLinksWithHttpsForSkype(url){
	let regex = 'http://'
	return url.replace(regex, 'https://');
}

let deals = {
    init: init
}
module.exports = deals