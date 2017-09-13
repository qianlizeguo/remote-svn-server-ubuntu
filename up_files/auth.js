var handlers = {
    signup: {
      error: function (jqXHR, textStatus, errorThrown) {
        var msgToShow = 'Something went wrong while registering, please try again in some time.';
        try {
          msgToShow = JSON.parse(jqXHR.responseText).message || msgToShow;
        }
        catch(e){};
        noty({
          text: msgToShow,
          type: "error"
        })
        return console.log('Signup Error:', arguments);
      },
      success: function (data, textStatus, jqXHR) {
        var result = data.result,
            redirectUrl = app_base + "/signin-redirect?";

        if (result === "success") {

          if (source === "purchase") {
            trackEvent("test_runner", "collection_runner", "sign_up_success");
          }
          if (getQueryStringValue("redirect")==="migration") {
            source = "migration";
          }
          else if(getQueryStringValue("redirect")==="admintransfer") {
            source = "admintransfer";
          }

          //invite acceptance will happen through the signin redirect controller only

          redirectUrl += "user_id=" + data.user_id + "&";
          redirectUrl += "access_token=" + data.access_token + "&";
          redirectUrl += "refresh_token=" + data.refresh_token + "&";
          redirectUrl += "expires_in=" + data.expires_in + "&";
          redirectUrl += "name=" + encodeURIComponent(data.name) + "&";
          redirectUrl += "username=" + encodeURIComponent(data.username) + "&";
          redirectUrl += "app_id=" + data.app_id + "&";
          redirectUrl += "source=" + source + "&";
          redirectUrl += "trigger=signup_success";

          window.location.href = redirectUrl;
        } else {
          // Display the error in the UI
          data.result === "fail" && noty({
            text: data.message,
            type: "error"
          })
          return console.log('Signup Unsuccessful:', arguments);
        }
      },
      complete: function() {
        $("#signup-btn").removeClass('pm-btn-transient');
      }
    },
    signin: {
      error: function (jqXHR, textStatus, errorThrown) {
        console.log(jqXHR, textStatus)
        noty({
          text: "Something went wrong while signing in. Please try again in some time.",
          type: "error"
        })
        return console.log('Signin Error:', arguments);
      },
      success: function (data, textStatus, jqXHR) {
        var result = data.result,
            redirectUrl = app_base + "/signin-redirect?";

        if (result === "success") {
          if (source === "purchase") {
            trackEvent("test_runner", "collection_runner", "sign_in_success");
          }

          //invite acceptance will work through the signin-redirect controller only

          //custom redirect targets
          if(getQueryStringValue("redirect")==="migration") {
            source = "migration";
          }
          else if(getQueryStringValue("redirect")==="admintransfer") {
            source = "admintransfer";
          }

          redirectUrl += "user_id=" + data.user_id + "&";
          redirectUrl += "access_token=" + data.access_token + "&";
          redirectUrl += "refresh_token=" + data.refresh_token + "&";
          redirectUrl += "expires_in=" + data.expires_in + "&";
          redirectUrl += "name=" + encodeURIComponent(data.name) + "&";
          redirectUrl += "username=" + encodeURIComponent(data.username) + "&";
          redirectUrl += "app_id=" + data.app_id + "&";
          redirectUrl += "source=" + source + "&";
          redirectUrl += "sync_enabled=" + data.syncEnabled + "&";
          redirectUrl += "sync_invited=" + data.syncInvited + "&";
          redirectUrl += "base_eula_accepted=" + data.baseEulaAccepted + "&";


          redirectUrl += "persist=false&";
          // Switch to the next line when rememberme is offered by iServ
          //redirectUrl += "persist=" + !!$('#sign-in-persistent').attr('checked') + "&";

          redirectUrl += "trigger=signin_success";

          window.location.href = redirectUrl;
        } else {
          if (source === "purchase") {
            trackEvent("test_runner", "collection_runner", "sign_in_failed");
          }

          if(getQueryStringValue("redirect") === "migration") {
            data.message +=  "Please ensure that you are not using your beta credentials";
          }

          // Display the error in the UI
          data.result === "fail" && noty({
            text: data.message,
            type: "error"
          })
          return console.log('Signin Unsuccessful:', arguments);
        }
      },
      complete: function() {
        $("#signin-btn").removeClass('pm-btn-transient');
      }
    },
    forgot_username: {
      error: function (res) {
        var response = JSON.parse(res.responseText);

        if (res.responseText.indexOf('No user account') > -1) {
          noty({
            type: "error",
            text: "An account with this email address does not exist.",
            timeout: 5000
          });
          return;
        }

        if (res.responseText.indexOf('recaptcha') > -1) {
          $('#recover-username-form').find('.pm-message-wrap.pm-recaptcha-error').attr('data-pm-message',
            (response.error)?response.error.message:response.message
          );
        }
        else {
          $('#recover-username-form').find('.pm-message-wrap.pm-email-error').attr('data-pm-message',
            (response.error)?response.error.message:response.message
          );
        }

        grecaptcha.reset(usernameCaptcha);
      },
      success: function () {
        window.location.replace('#forgot-success')
        $('#forgot-username-success-email').text(window.user_email)
        window.user_email = undefined
      },
      always: function () {
        $('#recover-username-modal .pm-btn-transient').removeClass('pm-btn-transient');
      }
    }
  },
  uri_hash = window.location.hash;

function getQueryStringValue(key) {
  return unescape(window.location.search.replace(new RegExp("^(?:.*[&\\?]" + escape(key).replace(/[\.\+\*]/g, "\\$&") + "(?:\\=([^&]*))?)?.*$", "i"), "$1"));
}

function associateAccountWithOrganization(user_id, access_token, invite_code, organization_id, success, error) {
  var body = {
    "invite_code": invite_code,
    "type": "invite"
  };

  //this needs the access_token because signin-redirect has not been called yet
  //so there's no cookie
  var bodyJson = JSON.stringify(body);
  var userUrl = app_base + '/' + api_prefix + "users/" + user_id + "/associate_with_team";

  $.ajax(userUrl, {
    type: "PUT",
    data: bodyJson,
    dataType: "json",
    contentType: "application/json",
    error: function(jqXHR, textStatus, errorThrown) {
      error(_.get(jqXHR, "responseJSON.message", "Something went wrong"));
    },
    success: function(data, textStatus, jqXHR) {
      var result = data.result;

      if (result === "success") {
        success();
      }
      else {
        error(data.message);
      }

    }
  });
}

function credentialIsUsed(key, value, cb) {
  var api = app_base + '/' + api_prefix + 'user/exists',
    data = {
      key: key,
      value: value
    };

  $.get(api, data, cb);
}

$('#signup-btn').on('click', function (e) {
  // Prevent usual form submission
  e.preventDefault();

  var $thisForm = $(this),
      $username = $('#sign-up-username'),
      $password = $('#sign-up-password'),
      $email = $('#sign-up-email'),
      formData = {
        email: $email.val(),
        username: $username.val(),
        realname: $username.val(),
        password: $password.val(),
        forAdminTransfer: (getQueryStringValue("redirect")==="admintransfer"),
        forInvite: (for_invite === "true"),
        device: {
          type: "browser"
        }
      },
      formJSON = JSON.stringify(formData),
      signupURI = app_base + '/' + api_prefix + "signup";

  // Clear any error messages
  $thisForm.find('.pm-message-wrap').attr('data-pm-message', '');
  $thisForm.find('.pm-solo-message').attr('data-pm-message', '');

  // Validation, to taste
  if(!formData.email || formData.email.indexOf('@') === -1) {
    $email.closest('.pm-message-wrap').attr('data-pm-message', 'A valid email is required');
    return false;
  }

  if(!formData.username || !formData.username.length) {
    $username.closest('.pm-message-wrap').attr('data-pm-message', 'Username is required');
    return false;
  }

  if(!formData.password || formData.password.length <= 6) {
    $password.closest('.pm-message-wrap').attr('data-pm-message', 'Password is required, and should have more than 6 characters');
    return false;
  }

  if(!formData.password || formData.password.length > 64) {
    $password.closest('.pm-message-wrap').attr('data-pm-message', 'Password is required, and should have less than 65 characters');
    return false;
  }

  $("#signup-btn").addClass('pm-btn-transient');

  $.ajax(signupURI, {
    type: 'POST',
    data: formJSON,
    contentType: "application/json",
    dataType: 'json',
    error: handlers.signup.error,
    success: handlers.signup.success,
    complete: handlers.signup.complete
  });
});

$('#signin-btn').on('click', function (e) {
  // Prevent usual form submission
  e.preventDefault();

  var $thisForm = $(this),
      $username = $('#sign-in-email'),
      $password = $('#sign-in-password'),
      formData = {
        username: $username.val(),
        password: $password.val(),
        device: {
          type: "browser"
        }
      },
      formJSON = JSON.stringify(formData),
      signinURI = app_base + '/' + api_prefix + "signin";

  // Clear any error messages
  $thisForm.find('.pm-message-wrap').attr('data-pm-message', '');
  $thisForm.find('.pm-solo-message').attr('data-pm-message', '');

  if(!formData.username) {
    $username.parent().parent().attr('data-pm-message', 'Username is required');
    return false;
  }

  if(!formData.password) {
    $password.parent().parent().attr('data-pm-message', 'Password is required');
    return false;
  }

  $username.parent().parent().attr('data-pm-message', '');
  $password.parent().parent().attr('data-pm-message', '');
  $("#signin-btn").addClass('pm-btn-transient');

  $.ajax(signinURI, {
    type: 'POST',
    data: formJSON,
    contentType: "application/json",
    dataType: 'json',
    error: handlers.signin.error,
    success: handlers.signin.success,
    complete: handlers.signin.complete
  });
});

//trouble-submit-link

$('#trouble-form').on('submit', function (e) {
  e.preventDefault();

  var checked = $('input[name=forgot-type]:checked').val();

  checked = 'password'; //preventing forgot username emails right now

  if (checked === 'username') {
    var $thisForm = $(this),
      $email = $('#forgot-email'),
      recaptchaResponse = forgotCaptchaResponse,
      formData = {
        email: $email.val(),
        recaptchaResponse: recaptchaResponse
      },
      apiURI = app_base + '/' + api_prefix + "forgot-username";

    $thisForm.find('.pm-message-wrap').attr('data-pm-message', '');

    if (_.isUndefined(forgotCaptchaResponse) || _.isEmpty(forgotCaptchaResponse)) {
      noty({
        text: "You must complete the reCAPTCHA challenge",
        type: "error"
      })

      return;
    }

    window.user_email = $email.val();
    $('.forgot-success-container .pm-text').text("We’ve sent you an email with your username.")
    $.post(apiURI, formData, handlers.forgot_username.success)
      .fail(handlers.forgot_username.error)
      .always(handlers.forgot_username.always);
  }
  else if (checked === 'password') {
    var $thisForm = $(this),
        recaptchaResponse = forgotCaptchaResponse,
        $email = $('#forgot-email'),
        formData = {
          email: $email.val(),
          recaptchaResponse: recaptchaResponse
        },
        apiURI = app_base + '/' + api_prefix + "forgot-password";

    $thisForm.find('.pm-message-wrap').attr('data-pm-message', '');

    if (_.isUndefined(forgotCaptchaResponse) || _.isEmpty(forgotCaptchaResponse)) {
      noty({
        text: "You must complete the reCAPTCHA challenge",
        type: "error"
      })
      
      return;
    }

    $.post(apiURI, formData, handlers.signup_forgot_password.success)
      .fail(handlers.signup_forgot_password.error)
      .always(handlers.signup_forgot_password.always);
  }
});

$('#sign-in-form .pm-link-google').on('click', function(e) {
  var redirectUrl = [static_host_url, '/client-login', google_login_suffix].join(''),
      googlePersistence = 'false', // THIS WAS COMMENTED WHEN REMEMBERME WAS REMOVED: $('#google-sign-in-persistent').get(0).checked,
      persistentString = 'persistent=';

  e.preventDefault();

  if(!google_login_suffix || google_login_suffix[0]!=='?') {
    persistentString = '?' + persistentString;
  }
  else {
    persistentString = '&' + persistentString;
  }


  redirectUrl = [redirectUrl, persistentString, googlePersistence].join('');

  window.location = redirectUrl;
});

$('#sign-up-form input[data-credential-type]').on('change', function(e) {
  var $this = $(this),
    type = $this.data('credential-type'),
    value = $this.val(),
    $state = $this.closest('.pm-input-state');

  $state.removeClass('pm-input-error-state pm-input-success-state');
  $state.removeClass('pm-input-error-state');
  $state.closest('.pm-message-wrap').attr('data-pm-message', '');

  // In case this is an email, at least check to see if it's possibly valid
  // This is to avoid showing a green check next to content that's just `kjshdfl`
  if(type === 'email' && value.indexOf('@') === -1) {
    value && $state.addClass('pm-input-error-state');
    value && $state.closest('.pm-message-wrap').attr('data-pm-message', 'A valid email is required');
    return;
  }

  value && credentialIsUsed(type, value, function ($state) {
    return function (res) {
      if(res.user_exists) {
        $state.addClass('pm-input-error-state');
        if (type === 'email') {
          $state.closest('.pm-message-wrap').attr('data-pm-message', 'The email is already registered');
        }
        else if (type === 'username') {
          $state.closest('.pm-message-wrap').attr('data-pm-message', 'The username is already taken');
        }
      }
    }
  } ($state));
});

$('input[data-credential-type=password]').on('focus', function () {
  $('.pm-password-strength-indicator').css('visibility', 'visible');
})

$('input[data-credential-type=password]').on('blur', function () {
  $('.pm-password-strength-indicator').css('visibility', 'hidden');
})

$('input[data-credential-type=password]').on('keyup', function(e) {
  var minimumPercentage = 10;

  var getPercentage = function (entropy) {
    return minimumPercentage + Math.floor((entropy * 90) / 128);
  }

  var $this = $(this),
    value = $this.val(),
    $strength = $('.pm-password-strength .strength-text'),
    $indicator = $('.strength-progress__foreground');

  if (!value || value.length < 8) {
    $strength.text('Too short');
    $strength.removeClass().addClass('strength-text is-short');
    $indicator.attr('x2', '10%');
    $indicator.removeClass().addClass('strength-progress__foreground is-short');
    return;
  }

  var entropy = getPasswordEntropy(value),
    strength,
    className;

  if (entropy < 36) {
    strength = 'weak';
  }
  else if (entropy < 60) {
    strength = 'fair';
  }
  else {
    strength = 'strong';
  }

  if (strength) {
    $strength
      .text(strength)
      .removeClass('is-weak is-fair is-strong')
      .addClass('is-' + strength);
    $indicator
      .attr('x2', getPercentage(entropy) + '%')
      .removeClass('is-weak is-fair is-strong')
      .addClass('is-' + strength);
  }
});

// If the URL has a hash, check to see if it's mean to open a modal
uri_hash && (function () {
  if(uri_hash.match(/^#mod-/)) {
    $(uri_hash.replace(/mod-/i, '')).modal();
  }
})();
