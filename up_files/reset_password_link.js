var handlers = $.extend(handlers || {}, {
  signup_forgot_password: {
    error: function (res) {
      if (res.responseText.indexOf('No user account') > -1) {
        noty({
          type: "error",
          text: "An account with this email address does not exist.",
          timeout: 5000
        });
        return;
      }
      var response = JSON.parse(res.responseText);
      if (res.responseText.indexOf('recaptcha') > -1) {
        $('#reset-password-form').find('.pm-message-wrap.pm-recaptcha-error').attr('data-pm-message',
          (response.error)?response.error.message:response.message
        );
      }
      else {
        $('#reset-password-form').find('.pm-message-wrap.pm-email-error').attr('data-pm-message',
          (response.error)?response.error.message:response.message
        );
      }
      grecaptcha.reset(forgotCaptcha);
    },
    success: function () {
      window.location.replace('#forgot-success')
      $('.forgot-success-container .pm-text').text("We’ve sent you an email with instructions on how to reset your password.")
    },
    always: function () {
      $('#reset-password-modal .pm-btn-transient').removeClass('pm-btn-transient');
    }
  },
  edit_profile_forgot_password: {
    success: function () {
      $("#change-profile-success")
        .css("display", "block")
        .find('.message')
        .text("We've sent you an email with instructions on resetting your password.");

      $('#reset-password-modal').modal('toggle');
    },
    fail: function (res) {
      var response = JSON.parse(res.responseText);
      $('#reset-password-form').find('.pm-message-wrap').attr('data-pm-message',
        response.error ? response.error.message : response.message
      );
    },
    always: function () {
      $('#reset-password-modal .pm-btn-transient').removeClass('pm-btn-transient');
      grecaptcha.reset(forgotCaptcha);
    }
  }
});

$('#reset-password-form').on('submit', function (e) {
  e.preventDefault();

  var $thisForm = $(this),
    recaptchaResponse = forgotCaptchaResponse,
    $email = $thisForm.find('input[type="text"]'),
    $btn = $thisForm.closest('.modal-content').find('#reset-password'),
    formData = {
      email: $email.val(),
      recaptchaResponse: recaptchaResponse
    },
    apiURI = app_base + '/' + api_prefix + "forgot-password";

  $btn.addClass('pm-btn-transient');
  $thisForm.find('.pm-message-wrap').attr('data-pm-message', '');

  var forgot_password_handlers = {};
  
  switch (e.target.dataset.ref) {
    case "signup": 
      forgot_password_handlers = handlers.signup_forgot_password;
      break;

    case "edit_profile":
      forgot_password_handlers = handlers.edit_profile_forgot_password;
      break;
  };

  $.post(apiURI, formData, forgot_password_handlers.success)
    .fail(forgot_password_handlers.error)
    .always(forgot_password_handlers.always);
});

// Trigger form submission when primary button within modals are clicked
$('.modal-footer .pm-btn-primary').on('click', function() {
  var $button = $(this),
    $form = $button.closest('.modal-content').find('form').eq(0);

  $button.addClass('pm-btn-transient');
  $form.submit();
});
