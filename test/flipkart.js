'use strict';
const
    flipkart = {
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

    },
    CATEGORIES_FILE = flipkart.FILE_PREFIX + '_' + 'categories' + flipkart.FILE_SUFFIX,
    TOP_FILE_PREFIX = flipkart.FILE_PREFIX + '_' + flipkart.TOP_PREFIX + '_',
    OTHER_FILE_PREFIX = flipkart.FILE_PREFIX + '_',
    headers = {
        'Fk-Affiliate-Id': flipkart.AFFILIATE_ID,
        'Fk-Affiliate-Token': flipkart.AFFILIATE_TOKEN
    },
    jsonfile = require('jsonfile'),
    platforms = require('../utils/platforms'),
    request = require('request');

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

/**
 * TEST METHODS
 */

flipkart.testAllOffers = function () {
    flipkart.findAllOffers()
        .then((items) => {
            console.log(JSON.stringify(items))
        })
        .catch((error) => {
            console.log(JSON.stringify(error))
        })
}

flipkart.testDealsOfTheDay = function () {
    flipkart.findDealsOfTheDay()
        .then((items) => {
            console.log(JSON.stringify(items))
        })
        .catch((error) => {
            console.log(JSON.stringify(error))
        })
}

flipkart.testSearch = function () {
    flipkart.search('apple iphone', 10)
        .then((items) => {
            console.log(JSON.stringify(items))
        })
        .catch((error) => {
            console.log(JSON.stringify(error))
        })
}

flipkart.testAllCategories = function () {
    flipkart.findAllCategories()
        .then((items) => {
            console.log(JSON.stringify(items))
        })
        .catch((error) => {
            console.log(JSON.stringify(error))
        })
}

flipkart.testSpecificCategory = function () {
    let mobilesUrl = 'https://affiliate-api.flipkart.net/affiliate/1.0/topFeeds/slidenerd/category/tyy-4io.json?expiresAt=1478211115723&sig=75282a127348e77aea513274594e40da'
    flipkart.getProductsFrom('mobiles', mobilesUrl)
        .then((items) => {
            console.log(JSON.stringify(items))
        })
        .catch((error) => {
            console.log(JSON.stringify(error))
        })
}

// flipkart.cron(() => {
//     flipkart.findAllCategories().then((categories) => {
//         return flipkart.save(CATEGORIES_FILE, categories)
//     }).then((result) => {
//         flipkart.getAllProducts(result.data, 'top')
//         flipkart.getAllProducts(result.data)
//     }).catch((error) => {
//         console.log(JSON.stringify(error))
//     })
// }, 36000)