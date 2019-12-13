import $ from './jquery/';
import { browser, storage } from './browser/';

import merge from './merge/';
import urlChangedPromise from './url-changed/';
import * as escape from './escape/';
import * as waitFor from './waitfor/';

function log(...message) {
    console.log('[MixrElixr]', ...message);
}

function debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction(...args) {
        let context = this;
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

function emit(name, detail, target) {
    let event = new CustomEvent('MixrElixr:' + name, { detail });
    (target || window).dispatchEvent(event);
}

export {
    browser,
    storage,
    $,
    merge,
    urlChangedPromise,
    escape,
    waitFor,
    log,
    debounce,
    emit
};
