let previousUrl = window.location.href;
(function pollurl() {
    setTimeout(pollurl, 100);

    let currentUrl = window.location.href;
    if (previousUrl === currentUrl) {
        return;
    }

    let detail = {
        previous: previousUrl.toString(),
        current: currentUrl.toString()
    };
    let event = new CustomEvent('MixrElixr:url-changed', { detail });
    window.dispatchEvent(event);

    previousUrl = currentUrl;
}());