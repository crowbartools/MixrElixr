import { waitForElementAvailablity } from '../utils';

export function apply(settings) {

    if (settings.generalOptions.declutterTopBar !== false) {

        waitForElementAvailablity("a[href='/dashboard/onboarding']").then(() => {
          $("a[href='/dashboard/onboarding']").hide();
        });

        waitForElementAvailablity("[class*='getEmbersButtonBackground'").then((emberBtn) => {
            emberBtn.css("background", "transparent");
            emberBtn.find("[class^='content_']").contents().filter(function() {
                return (this.nodeType == 3);
            }).remove();
          });
    }

    const theme = settings.generalOptions.theme;
    if (theme != null && theme !== 'default') {
        $("body").addClass(theme);
    } else {
        $("body").removeClass("elixr-dark");
    }
}