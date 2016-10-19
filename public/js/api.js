var baseURL = "https://zup.chat/api/", call_url = "";

// Email Subscribe
function subscribeEmail(email) {
    call_url = "subscribe";
    var form = new Object();
    form['email'] = email;

    var settings = {
      "async": true,
      "crossDomain": true,
      "url": baseURL+call_url,
      "method": "POST",
      "crossOrigin" :true,
      "xhrFields": { withCredentials: true },
      "processData": false,
      "contentType": 'application/json',
      "data": JSON.stringify(form)
    }

    $.ajax(settings).success(function (response) {
        console.log(response);
        if(response.success == true) {
            fakeMessage(2);
        } else {
            fakeMessage(3);
        }
    }).error(function (errorResponse) {
        console.warn(errorResponse);
        fakeMessage(3);
    });
}

// Contact Us
function contactUs() {
    call_url = "sendMail"
    var type = '';
    var form = new Object();
    form['name'] = $('#form1').val();
    form['email'] = $('#form1').val();
    form['subject'] = $('#form1').val();
    form['message'] = $('#form1').val();
    form['location'] = $('#form1').val();
    form['name'] = $('#form1').val();

    if($('#form6').val() == 1) {
        type = 'individual';
    } else if($('#form6').val() == 1) {
        type = 'company';
    }
    form['type'] = $('#form1').val();

    var settings = {
      "async": true,
      "crossDomain": true,
      "url": baseURL+call_url,
      "method": "POST",
      "crossOrigin" :true,
      "xhrFields": { withCredentials: true },
      "processData": false,
      "contentType": 'application/json',
      "dataType": "json",
      "data": JSON.stringify(form)
    }

    $.ajax(settings).success(function (response) {
        console.log(response);
        if(response.success == true) {
            clear();
        }
    }).error(function (errorResponse) {
        console.warn(errorResponse);
    }).complete(function(completeResponse) {
        if(completeResponse.success == true) {
            clear();
        }
    });

    return;
}
function clear() {
    $('#form1').val('');
    $('#form2').val('');
    $('#form3').val('');
    $('#form4').val('');
    $('#form5').val('');
    $('#form6').val('');
}