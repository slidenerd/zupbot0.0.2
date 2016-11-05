const request = require('request')
const xml2js = require('xml2js'); 
var parser = new xml2js.Parser();


const ebay = {
  appId: "PrabhSwa-ChatBot-PRD-ebff0c33e-e6e89638",
  endPoint: "http://open.api.ebay.com/Shopping",
  version: "729",
  siteid: "203"
};

ebay.findCategories = function(categoryId, callback) {
    if(typeof(categoryId) === 'undefined') {
        categoryId = -1;
    }
    var url = ebay.endPoint + "?callname=GetCategoryInfo&appid=" + ebay.appId + "&siteid=" + ebay.siteid + "&CategoryID=" + categoryId + "&IncludeSelector=ChildCategories&version=" + ebay.version
    var options = {
        url: url
    }
    request.get(options, (error, response, body) => {
        parser.parseString(body, function (err, result) {
            const categoryList = result.GetCategoryInfoResponse.CategoryArray;
            callback(categoryList);
        });
    });
}

ebay.searchProduct = function(keyword, callback, categoryId) {
    var url = "http://svcs.ebay.com/services/search/FindingService/v1?OPERATION-NAME=findItemsAdvanced&SERVICE-VERSION=1.0.0&SECURITY-APPNAME=" 
    + ebay.appId + "&RESPONSE-DATA-FORMAT=JSON&REST-PAYLOAD=true&paginationInput.entriesPerPage=20&keywords=" + keyword + "&GLOBAL-ID=EBAY-IN" 
    
    if(typeof(categoryId) != 'undefined' && categoryId != null) {
        url = url + "&categoryId=" + categoryId
    }
    
    var options = {
        url: url
    }
    console.log(url);
    request.get(options, (error, response, body) => {
        console.log(body);
    });
}

// ebay.findCategories(-1, function(result) {
//     console.log(JSON.stringify(result));
// });


ebay.searchProduct('iphone 6s', function(result) {
    console.log(JSON.stringify(result));
}, null);

module.exports = ebay;