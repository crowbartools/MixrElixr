import * as api from '../mixer/api';
import settings from '../settings/';
import { emit, merge, urlChangedPromise } from '../utils/';
import monitorCookie from './monitor-cookie.js';

let user;

async function cookieMonitorHandler() {
    let details = await api.getCurrentUser();
    details = details != null ? details : null;

    // no change in state
    if (
        (details == null && user == null) ||
        (user.result && details && user.result.id === details.id)
    ) {
        return;
    }

    // user logged out or switched accounts
    if (details == null) {
        user = null;
        emit('user:logout', { settings: settings.cached() });
    }

    // user logged in or switched accounts
    if (details != null) {
        user = Promise.resolve(details);
        user.result = details;
        user.fullfilled = true;
        emit('user:login', { settings: settings.cached(), user: details });
    }
}

// state.user()
function current() {
    if (!user) {
        user = urlChangedPromise(async resolve => {
            let details = await api.getCurrentUser();
            if (user.fullfilled) {
                return;
            }
            resolve(details);
        });
    }
    return user;
}

// state.user.cached()
current.cached = function cached() {
    if (!user || !user.fullfilled) {
        return;
    }
    return user.result;
};

window.addEventListener('MixrElixr:load:init', () => monitorCookie('uvts', cookieMonitorHandler));

// When the user's info updates, update the cache and emit: MixrElixr:user:update
window.addEventListener('MixrElixr:constellation:user-update', data => {
    if (user && user.result) {
        merge(user.result, data);
        emit('user:update', user.result);
    }
});

export default current;