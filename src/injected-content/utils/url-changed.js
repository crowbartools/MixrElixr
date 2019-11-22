let pending = [],
    previousUrl = window.location.href;


(function pollurl() {
    setTimeout(pollurl, 50);

    let currentUrl = window.location.href.replace(/#.*$/, '');

    // uri hasn't changed
    if (previousUrl === currentUrl) {
        return;
    }

    // fullfill any pending promises that depend on the current page
    let error = new Error('url-changed');
    pending.forEach(pending => {
        let opts = pending.opts || {};
        if (!opts.reject) {
            pending.promise.resolve(opts.value);
        } else if (opts.value) {
            pending.promise.reject(opts.value);
        } else {
            pending.promise.reject(error);
        }
    });
    pending = [];

    // create a new event
    let detail = {
        previous: previousUrl.toString(),
        current: currentUrl.toString()
    };
    let event = new CustomEvent('elixr:url-changed', { detail });

    // update url var, and emit event
    previousUrl = currentUrl;
    window.dispatchEvent(event);
}());

export function urlChangePromise(executer, opts = {}) {
    let fullfilled = false,
        resolve,
        reject,
        promise = new Promise((res, rej) => {
            resolve = res;
            reject = rej;
        });

    Object.defineProperties(promise, {
        fullfilled: {
            get: function () {
                return fullfilled;
            }
        },
        resolve: {
            writable: false,
            value: function (value) {
                if (!fullfilled) {
                    fullfilled = true;
                    pending = pending.filter(pending => !pending.promise.fullfilled);
                    resolve(value);
                }
            }
        },
        reject: {
            writable: false,
            value: function (value) {
                if (!fullfilled) {
                    fullfilled = true;
                    pending = pending.filter(pending => !pending.promise.fullfilled);
                    reject(value);
                }
            }
        }
    });

    pending.push({
        promise: promise,
        options: opts
    });

    executer(promise.resolve, promise.reject);
    return promise;
}