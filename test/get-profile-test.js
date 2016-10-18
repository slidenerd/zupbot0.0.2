const request = require('request')
const id = '1078904948813864';
const token = 'EAAZAJiqhoMfYBAFEM3IxmIV5X0zdr5GlFfD86SoD7kA0ir5ngpSWd4YGEttflmPzu4ypZBxuJreOXbkRWJ6sTHbQN6gnkpYdfTkZAAEhvVwaZCuZAYxBBVHhIecTBCCBmhU65mbLL6XKQUgNg1AqXR4CbgrET2ZAQMwqIZA8jeouAZDZD'

const platforms = {
    facebook: {

    }
};
platforms.facebook.getProfile = function () {
    request({
        url: 'https://graph.facebook.com/v2.7/' + id,
        method: 'GET',
        qs: {
            access_token: token,
            fields: 'first_name,last_name,profile_pic,locale,timezone,gender'
        },
        headers: { 'Content-Type': 'application/json' },
        json: true
    },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                let profile = {
                    firstName: body.first_name,
                    lastName: body.last_name,
                    picture: body.profile_pic,
                    locale: body.locale,
                    timezone: body.timezone,
                    gender: body.gender
                }
                console.log(profile);
            } else {
                // TODO: Handle errors
                console.log(" Failed. Need to handle errors ", error);
            }
        });
}

platforms.facebook.getProfile();