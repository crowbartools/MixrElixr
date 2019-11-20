export async function waitForDom() {
    if (document.readyState === 'complete') {
        return;
    }
    return new Promise(resolve => {
        document.addEventListener("DOMContentLoaded", function domIsReady() {
            document.removeEventListener("DOMContentLoaded", domIsReady);
            resolve();
        });
    });
}

export async function waitForMixer() {
    await waitForDom();
    return new Promise(resolve => {
        (function mixerReadyCheck() {
            if (document.querySelectorAll('.initial-loading-overlay').length === 0) {
                setTimeout(resolve, 10);
            } else {
                setTimeout(mixerReadyCheck, 50);
            }
        }());
    });
}

export let waitForElement = (function () {
    let waitingForElements = [];
    let observer = new MutationObserver(function () {
        waitingForElements = waitingForElements.filter(waitingForElement => {
            if (document.querySelector(waitingForElement.selector) != null) {
                waitingForElement.resolve();
                return false;
            }
            return true;
        });
    });
    observer.observe(document, {childList: true, attributes: true, subtree: true});

    return async function waitForElement(selector) {
        if (document.querySelector(selector) != null) {
            return;
        }

        return new Promise(resolve => waitingForElements.push({selector, resolve}));
    };
}());