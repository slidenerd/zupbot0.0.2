'use strict';

const
    cache = require('memory-cache'),
    endpoints = require('../config/endpoints'),
    jsonfile = require('jsonfile'),
    platforms = require('../utils/platforms'),
    request = require('request');

const flipkart = {
    AFFILIATE_ID: 'slidenerd',
    AFFILIATE_TOKEN: 'cb49349872094f7494d802c1efc6b67b',
    FILE_PREFIX: 'flipkart',
    TOP_PREFIX: 'top',
    FILE_SUFFIX: '.json',
    DIRECTORY: __dirname + '/../ecommerce/flipkart/',
    endpoints: {
        ALL_OFFERS: 'https://affiliate-api.flipkart.net/affiliate/offers/v1/all/json',
        DEALS_OF_THE_DAY: 'https://affiliate-api.flipkart.net/affiliate/offers/v1/dotd/json',
        SEARCH: 'https://affiliate-api.flipkart.net/affiliate/search/json',
        CATEGORIES: 'https://affiliate-api.flipkart.net/affiliate/api/slidenerd.json'
    },
    errors: {
        ALL_OFFERS: 'Flipkart error while fetching all offers ',
        DEALS_OF_THE_DAY: 'Flipkart error while fetching daily deals ',
        SEARCH: 'Flipkart error while searching ',
        CATEGORIES: 'Flipkart error while fetching categories on product feed listing API ',
        SPECIFIC_CATEGORY: 'Flipkart error while extracting all the data from specific category'
    },
    CATEGORY_ALL: 'categoryall',
    cache: {
        key: 'offers'
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

const
    CATEGORIES_FILE = flipkart.FILE_PREFIX + '_' + 'categories' + flipkart.FILE_SUFFIX,
    TOP_FILE_PREFIX = flipkart.FILE_PREFIX + '_' + flipkart.TOP_PREFIX + '_',
    OTHER_FILE_PREFIX = flipkart.FILE_PREFIX + '_',
    headers = {
        'Fk-Affiliate-Id': flipkart.AFFILIATE_ID,
        'Fk-Affiliate-Token': flipkart.AFFILIATE_TOKEN
    };

flipkart.parseAllOffers = function (json) {
    let offers = [];
    if (json) {
        for (let current of json) {
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

flipkart.parseDealsOfTheDay = function (json) {
    let offers = [];
    if (json) {
        for (let current of json) {
            //Chooose only LIVE offers
            if (current.availability.toLowerCase() === 'live') {
                let offer = {
                    title: current.title,
                    description: current.description,
                    url: current.url,
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

flipkart.paginator = function (session, offers) {
    //How many items will you display in a carousel on each platform is controlled by limit

    let limit = platforms.getCarouselLimits(session.message.address.channelId);
    //if flipkart does not exist for a particular user 
    if (!session.userData.user.flipkart) {
        let flipkart = {
            page: {
                start: 0
            }
        }
        session.userData.user.flipkart = flipkart;
    }
    if (!session.userData.user.flipkart.page) {
        let page = {
            start: 0
        }
        session.userData.user.flipkart.page = page;
    }

    if (!session.userData.user.flipkart.page.hasOwnProperty('start')) {
        session.userData.user.flipkart.page.start = 0
    }
    //A key from cache which indicates if this data was previously cached or freshly loaded
    if (cache.get('fresh')) {
        session.userData.user.flipkart.page.start = 0
        console.log('fresh')
    }

    //Begin displaying items either from 0 or from a previous number
    let start = session.userData.user.flipkart.page.start

    //Display exactly limit number of items
    let end = ((start + limit) < offers.length) ? (start + limit) : offers.length

    console.log(start, end)
    let page;

    //We did not find any offers perhaps because there was none or all were unavailable or we got no results after applying our filter
    if ((end - start) === 0) {
        page = {
            triggerName: flipkart.triggers.none,
            offers: [],
            start: 0,
            end: 0,
            count: offers.length
        }
    }
    //If we found results but this is the first time we are paginating through them
    else if ((end - start) > 0 && start === 0) {
        page = {
            triggerName: flipkart.triggers.first,
            offers: offers.slice(start, end),
            start: start,
            end: end,
            count: offers.length
        }
    }
    //If we found results and this is not the first page of results that we are viewing
    else if ((end - start) > 0) {
        page = {
            triggerName: flipkart.triggers.subsequent,
            offers: offers.slice(start, end),
            start: start,
            end: end,
            count: offers.length
        }
    }
    //if we browsed every result and there is nothing else left to browse
    else {
        page = {
            triggerName: flipkart.triggers.done,
            offers: [],
            start: 0,
            end: 0,
            count: offers.length
        }
    }
    //Reset the page index if we have browsed all offers
    if (end === offers.length) {
        session.userData.user.flipkart.page.start = 0
    }
    else {
        session.userData.user.flipkart.page.start = end
    }
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

flipkart.cron = function (job, seconds) {
    job()
    setInterval(job, seconds * 1000)
}

flipkart.error = function (reject, error, errorMessage, statusCode, statusMessage) {
    reject({
        error: error,
        errorMessage: errorMessage,
        statusCode: statusCode,
        statusMessage: statusMessage
    })
}

flipkart.save = function (fileName, data) {
    return new Promise((resolve, reject) => {
        jsonfile.writeFile(flipkart.DIRECTORY + fileName, data, { spaces: 4 }, (error) => {
            if (error) {
                reject(error)
            }
            else {
                resolve({ fileName: fileName, data: data })
            }
        })
    })
}

flipkart.findAllOffers = function () {
    let options = {
        url: flipkart.endpoints.ALL_OFFERS,
        headers: headers,
        json: true
    };
    return new Promise((resolve, reject) => {
        request(options, (error, response, body) => {
            if (!error && response.statusCode === 200 && body && body.allOffersList) {
                resolve(body.allOffersList)
            }
            else {
                flipkart.error(reject, response.error, flipkart.errors.ALL_OFFERS, response.statusCode, response.statusMessage)
            }
        });
    })
}

flipkart.findDealsOfTheDay = function () {

    let options = {
        url: flipkart.endpoints.DEALS_OF_THE_DAY,
        headers: headers,
        json: true
    };
    return new Promise((resolve, reject) => {
        request(options, (error, response, body) => {
            if (!error && response.statusCode === 200 && body.dotdList) {
                resolve(body.dotdList);
            }
            else {
                flipkart.error(reject, response.error, flipkart.errors.DEALS_OF_THE_DAY, response.statusCode, response.statusMessage)
            }
        });
    })
}


flipkart.search = function (query, count) {
    let options = {
        url: flipkart.endpoints.SEARCH,
        headers: headers,
        qs: {
            query: query,
            resultCount: count
        },
        json: true
    };
    return new Promise((resolve, reject) => {
        request(options, (error, response, body) => {
            if (!error && response.statusCode === 200 && body.productInfoList) {
                resolve(body.productInfoList);
            }
            else {
                flipkart.error(reject, response.error, flipkart.errors.SEARCH, response.statusCode, response.statusMessage)
            }
        });
    })
}

flipkart.findAllCategories = function () {
    let options = {
        url: flipkart.endpoints.CATEGORIES,
        headers: headers,
        json: true
    };
    return new Promise((resolve, reject) => {
        request(options, (error, response, body) => {
            if (!error && response.statusCode === 200 && body && body.apiGroups && body.apiGroups.affiliate && body.apiGroups.affiliate.apiListings) {
                let items = [];
                for (let key in body.apiGroups.affiliate.apiListings) {
                    let item = body.apiGroups.affiliate.apiListings[key];
                    items.push({
                        category: item.apiName,
                        get: item.availableVariants['v1.1.0'].get,
                        deltaGet: item.availableVariants['v1.1.0'].deltaGet,
                        top: item.availableVariants['v1.1.0'].top
                    })
                }
                items = items.sort((a, b) => { return a.category.localeCompare(b.category) })
                resolve(items)
            }
            else {
                flipkart.error(reject, response.error, flipkart.errors.CATEGORIES, response.statusCode, response.statusMessage)
            }
        });
    })
}

flipkart.getProductsFrom = function (categoryName, url) {
    let options = {
        url: url,
        headers: headers,
        json: true
    };
    return new Promise((resolve, reject) => {
        request(options, (error, response, body) => {
            if (!error && response.statusCode === 200 && body) {
                resolve(body.productInfoList)
            }
            else {
                flipkart.error(reject, response.error, flipkart.errors.SPECIFIC_CATEGORY, response.statusCode, response.statusMessage)
            }
        });
    })
}

flipkart.getAllProducts = function (categories, which) {
    let i = 0;
    load();
    function load() {
        let url = (which === 'top') ? categories[i].top : categories[i].get;
        let prefix = (which === 'top') ? TOP_FILE_PREFIX : OTHER_FILE_PREFIX
        flipkart.getProductsFrom(categories[i].category, url).then((items) => {
            return flipkart.save(prefix + categories[i].category + flipkart.FILE_SUFFIX, items)
        }).then((result) => {
            console.log(result.data.length + ' Flipkart data saved to ' + result.fileName)
        }).catch((error) => {
            console.log(error)
        }).then(next)
    }
    function next() {
        i++;
        if (i < categories.length) {
            setTimeout(load, 0)
        }
    }
}
module.exports = flipkart