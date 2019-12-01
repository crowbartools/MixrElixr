import defaults from './defaults';
import convert from './convert/';
import browser, { storage } from '../../util/browser';

import { emit } from '../../util/index.js';

let settings,
    cache;

function wrap(subject) {
    if (subject == null) {
        return null;
    }
    if (
        typeof subject === 'boolean' ||
        typeof subject === 'number' ||
        typeof subject === 'string' ||
        typeof subject === 'function'
    ) {
        return subject;
    }

    return new Proxy(subject, {
        get(target, property) {
            return wrap(target[property]);
        },
        set(target, property, value) {
            target[property] = value;
            storage.set(cache).then(() => {
                emit('settings:updated');
            });
            return true;
        }
    });
}

function getSettings() {
    return storage
        .get()
        .then(settings => {
            if (settings !== null && settings.version !== 2) {
                return convert(settings);
            }
            return storage.get(defaults);
        })
        .then(values => {
            cache = values;
            settings.result = wrap(values);
            settings.fullfilled = true;
            return Promise.resolve(settings.result);
        });
}

// All elixr messages are prefixed as { MixrElixr: { event: name, data: ... } }
browser.runtime.onMessage.addEventListener(function (message) {
    if (message.MixrElixr == null) {
        return false;
    }
    if (message.MixrElixr.event === 'settingsChanged') {
        settings = getSettings();
        settings.then(() => {
            emit('settings:changed');
        });
    }
});

function current() {
    if (!settings) {
        settings = getSettings();
    }
    return settings;
}

current.cached = function () {
    if (settings && settings.fullfilled) {
        return settings.result;
    }
};

export default current;