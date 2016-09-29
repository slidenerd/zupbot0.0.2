const weather = {
    units: 'metric'
}

weather.execute = function (callback) {
    setTimeout(() => {
        callback('temperature = 27, humidity = 97%')
    }, 500)
}

module.exports = weather