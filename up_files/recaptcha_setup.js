var forgotCaptcha, forgotCaptchaResponse;
function recaptchaLoadCallback() {
  forgotCaptcha = grecaptcha.render('forgot-recaptcha', {
    'sitekey' : recaptcha_public_key,
    'theme' : 'light',
    'size': window.innerWidth < 440 ? 'compact' : 'normal',
    'callback': function(g_input) {
      forgotCaptchaResponse = g_input;
    }
  });
}