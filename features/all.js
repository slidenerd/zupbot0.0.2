const amazon = require('./amazon')
const flipkart = require('./flipkart')
const ola = require('./ola')
const uber = require('./uber')
const weather = require('./weather')

const all = {
    weather: {},
    flipkart: {},
    ola: {},
    uber: {}
}

all.geocoder = require('./geocoder')
all.weather.name = 'weather';
all.weather.subroutine = function (rs, args) {
    return new rs.Promise((resolve, reject) => {
        weather.execute((report)=>{
            resolve(report)
        })
    })
}

all.flipkart.name = 'flipkart';
all.flipkart.subroutine = function (rs, args) {
    return new rs.Promise((resolve, reject) => {
        resolve('found 24 offers for you from flipkart today')
    })
}

all.ola.name = 'ola';
all.ola.subroutine = function (rs, args) {
    return new rs.Promise((resolve, reject) => {
        resolve('booking a cab for you from mumbai to thane')
    })
}

all.uber.name = 'uber'
all.uber.subroutine = function (rs, args) {
    return new rs.Promise((resolve, reject) => {
        resolve('booking a cab for you from tirupur to coimbatore')
    })
}

module.exports = all;