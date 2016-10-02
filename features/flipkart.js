'use strict';

const request = require('request')
const endpoints = require('../config/endpoints')
// const jsonfile = require('jsonfile')

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
        var headers = {
            'Fk-Affiliate-Id': endpoints.FLIPKART_AFFILIATE_ID,
            'Fk-Affiliate-Token': endpoints.FLIPKART_AFFILIATE_TOKEN
        };

        var options = {
            url: endpoints.FLIPKART,
            headers: headers,
            json: true
        };
        request(options, (error, response, body) => {
            if (!error && response.statusCode == 200) {
                let data = body;
                let offers = parse(data);
                // jsonfile.writeFile(__dirname + '/data.json', offers, function (err) {
                //     console.log(err)
                // })
                resolve(offers);
            }
            else {
                reject(error);
            }
        });
    });
}

flipkart.executeFilterByCategory = function (category) {
    return new Promise((resolve, reject) => {
        var headers = {
            'Fk-Affiliate-Id': endpoints.FLIPKART_AFFILIATE_ID,
            'Fk-Affiliate-Token': endpoints.FLIPKART_AFFILIATE_TOKEN
        };

        var options = {
            url: endpoints.FLIPKART,
            headers: headers,
            json: true
        };
        request(options, (error, response, body) => {
            if (!error && response.statusCode == 200) {
                let data = body;
                let offers = parse(data);
                let filtered = []
                for(let offer of offers){
                    if(offer.category.includes(category)){
                        filtered.add(offer);
                    }
                }
                resolve(filtered);
            }
            else {
                reject(error);
            }
        });
    });
}
module.exports = flipkart