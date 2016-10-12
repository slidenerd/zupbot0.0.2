'use strict';

const
    cache = require('memory-cache'),
    endpoints = require('../config/endpoints'),
    jsonfile = require('jsonfile'),
    platforms = require('../utils/platforms'),
    request = require('request'),
    Constants = require('../utils/constants');

const flipkart = {
    CATEGORY_ALL: 'categoryall',
    cache: {
        key: Constants.KEY_OFFERS
    },
    filters: {
        category: null,
        brand: null,
        model: null,
        discount: null,
        pricing: null
    },
    triggers: {
        done: 'int done',
        first: 'int first',
        none: 'int none',
        subsequent: 'int subsequent',
    }
}

function isValid(json) {
    return json && json.allOffersList && json.allOffersList.length
}

function parse(json) {
    let offers = [];
    if (isValid(json)) {
        for (let current of json.allOffersList) {
            //Chooose only LIVE offers
            let currentTime = new Date().getTime();
            if (current.availability.toLowerCase() === 'live' && currentTime < current.endTime) {
                let offer = {
                    title: current.title,
                    description: current.description,
                    url: current.url,
                    category: current.category,
                    startTime: current.startTime,
                    endTime: current.endTime
                }
                for (let image of current.imageUrls) {
                    if (image.resolutionType === 'default') {
                        offer.imageUrl = image.url;
                        break;
                    }
                }
                offers.push(offer);
            }
        }
    }
    return offers;
}

/**
 * Sort all the offers in the descending order by default
 */
flipkart.findAllOffers = function () {
    return new Promise((resolve, reject) => {
        let headers = {
            'Fk-Affiliate-Id': endpoints.FLIPKART_AFFILIATE_ID,
            'Fk-Affiliate-Token': endpoints.FLIPKART_AFFILIATE_TOKEN
        };

        let options = {
            url: endpoints.FLIPKART,
            headers: headers,
            json: true
        };
        request(options, (error, response, body) => {
            if (!error && response.statusCode == 200) {
                let data = body;
                let offers = parse(data);
                offers = flipkart.sortByDiscounts(offers)
                jsonfile.writeFile(__dirname + '/data.json', offers, { spaces: 4 }, (error) => {
                    console.log(error)
                })
                resolve(offers);
            }
            else {
                reject(error);
            }
        });
    });
}

flipkart.paginator = function (session, offers) {
    //How many items will you display in a carousel on each platform is controlled by limit
    let limit = platforms.getCarouselLimits(session.message.address.channelId);

    //A key from cache which indicates if this data was previously cached or freshly loaded
    if (cache.get('fresh')) {
        session.userData.user.flipkart.page = 0
    }
    //Begin displaying items either from 0 or from a previous number
    let start = session.userData.user.flipkart.page

    //Display exactly limit number of items
    let end = (start + limit < offers.length) ? (start + limit) : offers.length

    let page;

    //We did not find any offers perhaps because there was none or all were unavailable or we got no results after applying our filter
    if ((end - start) === 0) {
        page = {
            triggerName: flipkart.triggers.none,
            offers: []
        }
    }
    else if ((end - start) > 0 && start === 0) {
        page = {
            triggerName: flipkart.triggers.first,
            offers: offers.slice(start, end)
        }
    }
    else if ((end - start) > 0) {
        page = {
            triggerName: flipkart.triggers.subsequent,
            offers: offers.slice(start, end)
        }
    }
    else {
        page = {
            triggerName: flipkart.triggers.done,
            offers: []
        }
    }
    session.userData.user.flipkart.page = end
    return page;
}

flipkart.applyFilters = function (session, offers) {

    // if (filters && filters[0]) {
    //     let category = filters[0].toLowerCase();
    //     if (category != flipkart.CATEGORY_ALL) {
    //         offers = offers.filter((offer) => {
    //             let category = offer.category;
    //             let filter = filters[0];
    //             return category.toLowerCase() === filter;
    //         });
    //     }
    // }
    return offers;
}

/**
 * If the specified category is anything other than the default category, we perform the filtering, else we simply return all the items as it is.
 */
flipkart.filterForCategory = function (category, offers) {
    let filtered = offers
    // if (category !== flipkart.CATEGORY_ALL) {
    //     filtered = offers.filter((item) => {
    //         return item.category.toLowerCase() === category;
    //     })
    // }
    return filtered
}

/**
 * If the specified brand is not found, we return an empty array.
 */
flipkart.filterForBrand = function (brand, offers) {
    let filtered = offers.filter((item) => {
        let total = item.title + ' ' + item.description
        return total.toLowerCase().includes(brand.toLowerCase())
    })
    return filtered;
}

/**
 * \b               => begin word
 * (?:              => begin non capturing group
 * (\d{1,2})        => have 1 or 2 digits at most
 * \s*?             => Any number of spaces following that in a non greedy fashion
 * %?               => An optional percent symbol
 * \s*?             => Any number of spaces following that in a non greedy fashion
 * (?:-|to)         => Dont capture this group and match either a - or to
 * \s*?             => Any number of spaces following that in a non greedy fashion
 * )?               => end group and keep everything above optional
 * (\d{1,2})        => have 1 to 2 digits at most since no one on flipkart is gonna give a 100% off
 * \s*?             => Any number of spaces following that in a non greedy fashion
 * \b               => end word
 * %                => A compulsory % symbol at the end
 * Matches 10%
 * matches 99%, doesnt match 100%
 * Matches 10-40%
 * Matches 10 -   80%
 * Matches 10% to 40%
 * Matches 10  %    -     100 %
 * 2 capture groups, 1st captures minimum value and 2nd one captures maximum value
 * Example 10 - 40%, minimum = 10% and maximum = 40%, in all other cases, minimum is optional
 * If no discounts were found anywhere, the filtered list will return empty array.
 */
flipkart.filterForDiscounts = function (offers) {
    //get 10 -   20% discount handling min and max
    let regex = new RegExp(/\b(?:(\d{1,2})\s*?%?\s*?(?:-|to)\s*?)?(\d{1,2})\s*?\b%/)
    let filtered = offers.filter((item) => {
        let text = item.title + ' ' + item.description
        let result = regex.exec(text);
        if (result) {
            item.discount = {}
            if (result[1]) {
                item.discount.min = result[1]
            }
            if (result[2]) {
                item.discount.max = result[2]
            }
        }
        return result != null;
    })
        .sort((left, right) => {
            if (right.discount.max && left.discount.max) {
                return right.discount.max - left.discount.max
            }
            else {
                //keep items without a discount if any at the end
                return 0;
            }
        })
    return filtered;
}

/**
 * \B               => begin word boundary and take a word that is neither the beginning nor the end
 * rs               => match the literal rs
 * \W*?             => match any number of non alphanumeric characters such as symbols non greedily
 * \d{1,7}          => match 1-7 digits
 * (?:              => begin group without capturing it
 * ,                => match a comma
 * \d+              => match one or more digits
 * )*               => end group and repeat the group 0 or more times    
 * \b               => end word boundary
 * (?:              => begin group without capturing it
 * \s*?             => match 0 or more white spaces non greedily
 * (?:-|to)         => match - or to without capturing it
 * \s*?             => match 0 or more white spaces non greedily
 * (?:\b            => begin word boundary
 * rs               => match the literal rs
 * \b               => end word boundary
 * \W*?             => match any number of non alphanumeric characters such as symbols non greedily
 * )?               => match the previous group any number of times
 * \d{1,7}          => match 1-7 digits
 * (?:              => begin group without capturing it
 * ,                => match a comma
 * \d+              => match one or more digits
 * )*               => end group and repeat the group 0 or more times    
 * \b)?             => end word boundary and keep the entire group optional    
 * |\brs\W*?(\d{1,7}(?:,\d+)*)\b(?:\s*?(?:-|to)\s*?(?:\brs\b\W*?)?(\d{1,7}(?:,\d+)*)\b)?
 */
flipkart.filterForPricing = function (offers) {
    //get 10 -   20% discount handling min and max
    //find all currency expressions without a comma anywhere in them
    let regex = new RegExp(/\Brs\W*?\d{1,7}(?:,\d+)*\b(?:\s*?(?:-|to)\s*?(?:\brs\b\W*?)?\d{1,7}(?:,\d+)*\b)?|\brs\W*?(\d{1,7}(?:,\d+)*)\b(?:\s*?(?:-|to)\s*?(?:\brs\b\W*?)?(\d{1,7}(?:,\d+)*)\b)?/ig)
    let filtered = offers.filter((item) => {
        let text = item.title + ' ' + item.description
        let result = regex.exec(text);
        if (result) {
            //strip all the characters till nothing is left
            item.price = {}

            if (result[1]) {
                item.price.max = result[1].replace(/,/g, '')
            }

            if (result[1] && result[2]) {
                item.price.min = result[1].replace(/,/g, ''),
                    item.price.max = result[2].replace(/,/g, '')
            }
        }
        return result != null;
    })
        .sort((left, right) => {
            if (left.price.max && right.price.max) {
                return right.price.max - left.price.max
            }
            else {
                //keep items without a price if any at the end
                return 0;
            }
        })
    return filtered;
}

flipkart.sortByDiscounts = function (offers) {
    //get 10 -   20% discount handling min and max
    var regex = new RegExp(/\b(?:(\d{1,2})\s*?%?\s*?(?:-|to)\s*?)?(\d{1,2})\s*?\b%/)
    let filtered = offers.filter((item) => {
        var text = item.title + ' ' + item.description
        var result = regex.exec(text);
        if (result) {
            item.discount = {}
            if (result[1]) {
                item.discount.min = result[1]
            }
            if (result[2]) {
                item.discount.max = result[2]
            }
        }
        return true;
    })
        .sort((left, right) => {
            if (right.discount && right.discount.max && left.discount && left.discount.max) {
                return right.discount.max - left.discount.max
            }
            else if (right.discount && right.discount.max) {
                return 1;
            }
            else if (left.discount && left.discount.max) {
                return -1;
            }
            else {
                //keep all the items without a discount at the end
                return 0;
            }
        })
    return filtered;
}

module.exports = flipkart