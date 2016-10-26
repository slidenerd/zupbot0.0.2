var amazon_api = require('amazon-product-api');

const searchIndex = ['All', 'Beauty', 'Grocery', 'Industrial', 'PetSupplies', 'OfficeProducts', 'Electronics', 'Watches', 'Jewelry', 'Luggage', 'Shoes', 'KindleStore', 'Automotive', 'MusicalInstruments', 'GiftCards', 'Toys', 'SportingGoods', 'PCHardware', 'Books', 'Baby', 'HomeGarden', 'VideoGames', 'Apparel', 'Marketplace', 'DVD', 'Music', 'HealthPersonalCare', 'Software']

const amazon = amazon_api.createClient({
  awsId: "AKIAJOJIQZGNUMTL6KZQ",
  awsSecret: "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",
  awsTag: "httpwwwvkslab-21"
});

amazon.searchProduct = function(query, category, minPercentageOff, maxPrice) {
    var options = {
    }
    if(typeof(category) === 'undefined') {
        options.SearchIndex = "ALL";
    } else {
        options.SearchIndex = category;        
        if(typeof(minPercentageOff) === 'undefined') {
            minPercentageOff = "0"
        }
        options.MinPercentageOff = minPercentageOff;

        if(typeof(maxPrice) != 'undefined') {
            options.MaximumPrice = maxPrice;
        }

    }
    options.Keywords = query;
    options.responseGroup = 'ItemAttributes,Offers,Images';
    options.domain = 'webservices.amazon.in';

    console.log(options);

    if(maxPrice) {
        options.MaximumPrice = maxPrice;
    }
    return amazon.itemSearch(options)
}

module.exports = amazon;

// amazon.searchProduct("acer laptop", "Electronics").then(function(results) {
//     console.log(JSON.stringify(results));
// }).catch(function(err){
//   console.log(JSON.stringify(err));
// });