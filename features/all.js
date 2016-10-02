const amazon = require('./amazon')
const flipkart = require('./flipkart')
const ola = require('./ola')
const uber = require('./uber')
const weather = require('./weather')

const all = {
    flipkart: {},
    ola: {},
    uber: {},
    weather: {},
}

all.flipkart.name = 'flipkart';
all.flipkart.subroutine = function (userId, rs, args) {
    return new rs.Promise((resolve, reject) => {
        flipkart.execute()
            .then((offers) => {
                reject({ type: 'carousel', data: offers })
            })
            .catch((error) => {
                reject({type: 'error', data: error});
            })
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

all.weather.name = 'weather';
all.weather.subroutine = function (userId, rs, args) {
    return new rs.Promise((resolve, reject) => {
        var lat = 19, lon = 72;
        weather.execute(lat, lon)
            .then((report) => {
                rs.setUservar(userId, 'location', 'your place')
                rs.setUservars(userId, report)
                return rs.replyAsync(userId, 'jsweather', all.this)
            })
            .then((reply) => {
                resolve(reply)
            })
            .catch((error) => {
                reject(error);
            })
    })
}

module.exports = all;