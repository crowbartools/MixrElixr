export function log(message) {
    console.log(`[MixrElixr] ${message}`);
}

export function waitForElementAvailablity(selector) {

    log(`Waiting for element '${selector}'...`);

    let promise = new Promise(resolve => {
        $.deinitialize(selector);

        $.initialize(selector, function() {
            log(`Found element '${selector}'!`);
            $.deinitialize(selector);
            resolve($(this));
        });
    });

    return promise;
}

export function debounce(func, wait, immediate) {
    let timeout;

    return function executedFunction() {
        let context = this;
        let args = arguments;

        let later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };

        let callNow = immediate && !timeout;

        clearTimeout(timeout);

        timeout = setTimeout(later, wait);

        if (callNow) func.apply(context, args);
    };
}