var baseURL = "https://zup.chat/api/", call_url = "";

// Email Subscribe
function subscribeEmail(email) {
    call_url = "subscribe";
    var successMsg = 'Subscribed successfully, Please check your mail, thanks.';
    var errorMsg = 'Subscribe failed.';
    var form = new FormData();
    form.append( 'email', email );
    var settings = {
      "async": true,
      "crossDomain": true,
      "url": baseURL+call_url,
      "method": "POST",
      "crossOrigin" :true,
      "xhrFields": { withCredentials: true },
      "processData": false,
      "contentType": false,
      "mimeType": "multipart/form-data",
      "data": form
    }

    $.ajax(settings).success(function (response) {
        console.log(response);
        if(response.success == true) {
            fakeMessage(successMsg);
        } else {
            fakeMessage(errorMsg);
        }
    }).error(function (errorResponse) {
        console.warn(errorResponse);
        fakeMessage(errorMsg);
    });
}

// Contact Us
function contactUs() {
    call_url = "sendMail";
    var successMsg = "Your request has been sent, we will reach out to you shortly.";
    var errorMsg = "Your request has been not sent, please try again later.";
    var type = '';
    var form = new FormData();
    var opts = {
        "closeButton": true,
        "debug": false,
        "positionClass": "toast-top-right",
        "onclick": null,
        "showDuration": "300",
        "hideDuration": "1000",
        "timeOut": "5000",
        "extendedTimeOut": "1000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut"
    };
    
    $('body').append('<div class="loader-bg"><div class="loader"></div></div>');

    form.append( 'name', $('#form1').val() );
    form.append( 'email', $('#form2').val() );
    form.append( 'subject', $('#form3').val() );
    form.append( 'message', $('#form4').val() );
    form.append( 'location', $('#form5').val() );
    if($('#form6').val() == 1) {
        type = 'individual';
    } else if($('#form6').val() == 1) {
        type = 'company';
    }
    form.append( 'type',  type);

    var settings = {
      "async": true,
      "crossDomain": true,
      "url": baseURL+call_url,
      "method": "POST",
      "crossOrigin" :true,
      "xhrFields": { withCredentials: true },
      "processData": false,
      "contentType": false,
      "mimeType": "multipart/form-data",
      "data": form
    }

    $.ajax(settings).success(function (response) {
        console.log(response);
        if(response.success == true) {
            clear();
            toastr.success(successMsg, null, opts);
        } else {
            toastr.error(errorMsg, null, opts);
        }
    }).error(function (errorResponse) {
        console.warn(errorResponse);
        toastr.error(errorMsg, null, opts);
    }).complete(function(completeResponse) {
        $('.loader-bg').remove();
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