import * as v1 from './v1-map.js';
import defaults from '../defaults.js';
import {storage} from '../../../util/browser';

function walk (subject, cb, path = []) {
    if (subject == null) {
        return cb(null, path);
    }
    if (typeof subject === 'boolean') {
        return cb(subject === true, path);
    }
    if (typeof subject === 'number') {
        return cb(Number(subject), path);
    }
    if (typeof subject === 'string') {
        return cb('' + subject, path);
    }
    if (Array.isArray(subject)) {
        return cb(subject, JSON.parse(JSON.stringify(subject)), path);
    }
    if (subject.prototype === Object.prototype) {
        return Object.keys(subject).forEach(key => walk(subject[key], cb, [...path, key]));
    }
}

export default async function(settings) {

    // remove v1 settings from storage
    await storage.clear();

    // if the settings object exists
    if (settings) {

        // apply overrides to settings
        if (settings.streamPageOptions && settings.streamPageOptions.overrides) {
            settings.streamPageOptions.globals = Object.assign(settings.streamPageOptions.globals, settings.streamPageOptions.overrides);
        }

        // clone the v2 defaults object
        let result = JSON.parse(JSON.stringify(defaults));

        // walk the stored v1 settings and map their values to the v2 format
        walk(settings, function (value, path) {

            // get map entry for item
            let keyMap = v1.map;
            while (path.length) {
                keyMap = keyMap[path.shift()];
                if (keyMap === undefined) {
                    return;
                }
            }

            // walk v2 settings object
            let setting = result, key;
            while (keyMap.length > 1) {
                key = keyMap.shift();
                if (setting[key] === undefined) {
                    return;
                }
                setting = setting[key];
            }

            // apply the setting
            if (keyMap.length === 1) {
                settings[keyMap[0]] = value;
            }
        });
        settings = result;
    }

    // store the updated settings
    await storage.set(settings);

    // return the updated settings
    return settings;
}