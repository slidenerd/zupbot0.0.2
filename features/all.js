const amazon = require('./amazon')
const flipkart = require('./flipkart')
const ola = require('./ola')
const uber = require('./uber')
const weather = require('./weather')

const all = {
    weather : {},
    flipkart: {},
    ola: {},
    uber: {}
}

all.weather.name = 'weather';
all.weather.subroutine = function(rs, args){

}

all.flipkart.name = 'flipkart';
all.flipkart.subroutine = function(rs, args){

}

all.ola.name = 'ola';
all.ola.subroutine = function(rs, args){

}

all.uber.name = 'uber'
all.uber.subroutine = function(rs, args){
    
}

module.exports = all;