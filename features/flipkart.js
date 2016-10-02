'use strict';

const request = require('request')
const endpoints = require('../config/endpoints')

const flipkart = {

}

function isValid(json) {
    return json && json.dotdList && json.dotdList.length
}

function parse(json) {
    let offers = [];
    if (isValid(json)) {
        for (let current of json.dotdList) {
            //Chooose only LIVE offers
            if (current.availability.toLowerCase() === 'live') {
                let offer = {
                    title: current.title,
                    description: current.description,
                    url: current.url
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
    var headers = {
        'Fk-Affiliate-Id': endpoints.FLIPKART_AFFILIATE_ID,
        'Fk-Affiliate-Token': endpoints.FLIPKART_AFFILIATE_TOKEN
    };

    var options = {
        url: endpoints.FLIPKART,
        headers: headers,
        json: true
    };

    return new Promise((resolve, reject) => {
        request(options, (error, response, body) => {
            if (!error && response.statusCode == 200) {
                let offers = parse(body);
                resolve(offers);
            }
            else {
                reject(error);
            }
        });
    });
}

module.exports = flipkart