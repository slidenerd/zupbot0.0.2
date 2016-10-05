var request = require('request')
var express = require('express');

const API_KEY = "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";
const LIST_ID = 631957

const mail = {
}

mail.addToList = function(email, res) {
    console.log("Adding to List");
    var url = "https://api.sendgrid.com/v3/contactdb/lists/" + LIST_ID + "/recipients/" + email;
        var headers = {
            'Authorization': 'Bearer ' + API_KEY,
        };
        var options = {
            url: url,
            headers: headers,
            json: true
        };
        request.post(options, (error, response, body) => {
            var responseBody = new Object();
            if (!error && (response.statusCode == 201 || response.statusCode == 204)) {
                responseBody.success = true;
            } else {
                console.log("Error adding to list " + JSON.stringify(response));
                if(body.errors[0].field == 'recipient_id') {
                    createRecipient(email, res);
                } else {
                    responseBody.success = false;
                    responseBody.field = body.errors[0].field;
                    responseBody.message = body.errors[0].message;
                }
            }
            res.end(JSON.stringify(responseBody));
        });
}


mail.createRecepient = function(email, res) {
    console.log("creating Recepient");
    var url = "https://api.sendgrid.com/v3/contactdb/recipients";
        var headers = {
            'Authorization': 'Bearer ' + API_KEY,
        };

        var body = new Object();
        body.email = email;
        var arr = new Array();
        arr.push(body);
        console.log(arr);    

        var options = {
            url: url,
            headers: headers,
            body: arr,
            json: true
        };
        request.post(options, (error, response, body) => {
            var responseBody = new Object();
            if (!error && response.statusCode == 201) {
                console.log(body.persisted_recipients[0]);
                mail.addToList(body.persisted_recipients[0], res);    
                return;
            } else {
            console.log("Error creating Recepient " + JSON.stringify(body.errors));                
                responseBody.success = false;
                responseBody.field = body.errors[0].field;
                responseBody.message = body.errors[0].message;
            }
            res.end(JSON.stringify(responseBody));
        });    
}



mail.getAllLists = function(list, res) {
    console.log("Getting all List");
    var url = "https://api.sendgrid.com/v3/contactdb/lists/" + list + "/recipients?page_size=100&page=1";
        var headers = {
            'Authorization': 'Bearer ' + API_KEY,
        };
        var options = {
            url: url,
            headers: headers,
            json: true
        };
        request.get(options, (error, response, body) => {
            if (!error && response.statusCode == 200) {
                res.end(JSON.stringify(body));    
                return;    
            } else {
                res.end(JSON.stringify(error));
            }
        });    
}



// function createList(list, email, res) {
//     console.log("creating list");
//     var url = "https://api.sendgrid.com/v3/contactdb/lists";
//         var headers = {
//             'Authorization': 'Bearer ' + API_KEY,
//         };
//         var options = {
//             url: url,
//             headers: headers,
//             body: "name=" + list,
//             json: true
//         };
//         request.post(options, (error, response, body) => {
//             console.log(body);
//             var responseBody = new Object();
//             if (!error && response.statusCode == 201) {
//                 lists.push(response);
//                 addToList(list, email, res);    
//                 return;
//             } else {
//                 console.log("Error creating list " + body.errors);
//                 responseBody.success = false;
//                 responseBody.field = body.errors[0].field;
//                 responseBody.message = body.errors[0].message;
//             }
//             res.end(JSON.stringify(responseBody));
//         });    
// }

module.exports = mail


// app.listen(3000, function () {
//   console.log('Example app listening on port 3000!');
// });