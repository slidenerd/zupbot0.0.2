var fs = require('fs'),
    JSONStream = require('JSONStream');

var stream = fs.createReadStream('../json/citylist.json', { encoding: 'utf8' }),
    parser = JSONStream.parse();

stream.pipe(parser);

parser.on('data', function (obj) {
    if (obj.name.toLowerCase().includes('coimbatore')) {
        console.log(obj); // whatever you will do with each JSON object
    }
});

parser.on('error', (error) => {
    console.error(error);
})