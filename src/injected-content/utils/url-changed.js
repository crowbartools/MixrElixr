import {emit} from './index.js';

let pending = [],
    previousURI = window.location.href;


(function pollurl() {
    setTimeout(pollurl, 50);

    let currentURI = window.location.href;

    // uri hasn't changed
    if (previousURI === currentURI) {
        return;
    }

    // fullfill all pending promises that depend on the previous URI
    let error = new Error('elixr:url-changed');
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
        previous: previousURI.toString(),
        current: currentURI.toString()
    };

    // update url var, and emit event
    previousURI = currentURI;
    emit('url-changed', detail);
}());

export function urlDependentPromise(executer, opts = {}) {
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
                    this.result = value;
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