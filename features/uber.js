var express = require('express');
var app = express();
var Uber = require('node-uber');
const bodyParser = require('body-parser');
app.use(bodyParser.json());

var uber = new Uber({
  client_id: '8exI8gJATHVUDQhClYVezEfFKFN_Pjpi',
  client_secret: 'tgWo_lU-lmYGXbWEaWLRka_kotJFK6lgOzAsawJN',
  server_token: 'f66_z76gV63NmDY1bhl2oNES3r2fYjxGONs3iJeL',
  redirect_uri: 'http://localhost:8080/api/callback',
  name: 'CHATBOT-VKSLABS',
  language: 'en_US', // optional, defaults to en_US
  sandbox: true // optional, defaults to false
});

app.get('/api/login', function(request, response) {
  var url = uber.getAuthorizeUrl(['history','profile', 'request', 'places']);
  response.redirect(url);
});

app.get('/api/callback', function(request, response) {
    uber.authorization({
      authorization_code: request.query.code
    }, function(err, access_token, refresh_token) {
      if (err) {
        console.error(err);
      } else {
        // store the user id and associated access token
        // redirect the user back to your actual app
        response.redirect('/api/products?lat=12.9491416&lng=77.64298');
      }
    });
});

app.get('/api/products', function(request, response) {
  // extract the query from the request URL
  var query = request.query;
  // if no query params sent, respond with Bad Request
  if (!query || !query.lat || !query.lng) {
    response.sendStatus(400);
  } else {
    uber.products.getAllForLocation(query.lat, query.lng, function(err, res) {
      if (err) {
        console.error(err);
        response.sendStatus(500);
      } else {
        response.json(res);
      }
    });
  }
});

app.listen(8080);
console.log('8080 is the magic port');
