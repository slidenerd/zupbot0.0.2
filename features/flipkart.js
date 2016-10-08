'use strict';

const request = require('request')
const endpoints = require('../config/endpoints')
const jsonfile = require('jsonfile')

const flipkart = {

}

function isValid(json) {
    return json && json.allOffersList && json.allOffersList.length
}

function parse(json) {
    let offers = [];
    if (isValid(json)) {
        for (let current of json.allOffersList) {
            //Chooose only LIVE offers
            if (current.availability.toLowerCase() === 'live') {
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

flipkart.execute = function () {
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
                jsonfile.writeFile(__dirname + '/data.json', offers, { spaces: 4 }, function (err) {
                    console.log(err)
                })
                resolve(offers);
            }
            else {
                reject(error);
            }
        });
    });
}

flipkart.applyFilters = function (offers, filters) {
    if (filters) {
        //filters for category level
        if (filters.length == 1) {
            let category = filters[0].toLowerCase();
            if (category != 'nocategory') {
                offers = offers.filter((offer) => {
                    let category = offer.category;
                    let filter = filters[0];
                    return category.toLowerCase() === filter;
                });
            }
        }

    }
    return offers;
}

module.exports = flipkart