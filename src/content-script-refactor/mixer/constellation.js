import { Carina } from 'carina';

import state from '../state/';
import { emit } from '../utils/';

let constellation,
    slugUserId;

function onUpdate(data) {
    let user = state.user.cached(),
        userId = user ? user.id : null;

    // Current user doesn't match the user being monitored
    if (userId !== slugUserId) {
        switchUser(userId); // eslint-disable-line no-use-before-define

    // Emit Event: MixrElixr:constellation:user-update
    } else {
        emit('constellation:user-update', data);
    }
}

function switchUser(userId) {

    // no need to switch
    if ((userId == null && slugUserId == null) || userId === slugUserId) {
        return;
    }

    // Unsubscribe from previous slug
    if (userId != null) {
        constellation.unsubsubscribe(`user:${userId}:update`);
    }

    // Subscribe to new slug
    if (userId != null) {
        slugUserId = userId;
        constellation.subscribe(`user:${slugUserId}:update`, onUpdate);
    }
}

// Wait for mixer to load
window.addEventListener('MixrElixr:load:init', evt => {

    // start constellation
    constellation = new Carina({ isBot: true }).open();

    // if the user is logged in, subscribe to the user update slug
    let user = evt.details.user;
    if (user && user.id) {
        switchUser(user.id);
    }
});

// User logged in: switch user slug
window.addEventListener('MixrElixr:user:login', evt => {
    switchUser(evt.details.user.id);
});

// User logged out: unsub from user slug
window.addEventListener('MixrElixr:user:logout', () => {
    switchUser();
});