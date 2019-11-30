import defaults from './defaults';
import convert from './convert/';
import { storage } from '../../util/browser';

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
            storage.set(cache);
            return true;
        }
    });
}

function current() {
    if (!settings) {
        settings = storage
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
    return settings;
}

current.cached = function () {
    if (settings && settings.fullfilled) {
        return settings.result;
    }
};

export default current;