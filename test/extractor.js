'use strict';

const fs = require('fs');
const flipkart = require('./flipkart')

const extractor = {
    WORKING_DIRECTORY: __dirname + '/../ecommerce/'
};

extractor.getProductBrands = function () {

    fs.readdir(extractor.WORKING_DIRECTORY, (err, files) => {
        files.forEach(file => {
            let source = require(__dirname + '/../ecommerce/' + file);
            let brands = []
            if (source) {
                for (let item of source) {
                    if (item.productBaseInfoV1) {
                        brands.push(item.productBaseInfoV1.productBrand)
                    }
                }
                brands = brands.filter((x, i, a) => a.indexOf(x) == i).sort((a, b)=>{return a.localeCompare(b)})
                console.log(brands.sort())
            }
        });
    })
}
extractor.getProductBrands()
module.exports = extractor;