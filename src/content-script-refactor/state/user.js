import * as api from '../api.js';
import channel from './channel.js';
import { urlChangedPromise } from '../utils/';

let user,
    userRoles,
    userIsMod;

window.addEventListener('elixr:url-changed', function () {
    userRoles = null;
    userIsMod = null;
});

window.addEventListener('elixr:chat:user-update', async () => {
    // update user based on result from chat?
});

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

// state.user.roles()
current.roles = function () {
    if (!userRoles) {
        userRoles = urlChangedPromise(async resolve => {
            let [userDetails, channelDetails] = await Promise.all([current(), channel()]);
            if (userRoles.fullfilled) {
                return;
            }
            if (userDetails == null || channelDetails == null) {
                return resolve([]);
            }
            let roles = await api.getUserRolesForChannel(channelDetails.id, userDetails.username);
            if (userRoles.fullfilled) {
                return;
            }
            if (userDetails.username === channel.token) {
                roles.push("Owner");
            }
            resolve(roles);
        });
    }
    return userRoles;
};

// state.user.isMod()
current.isMod = function () {
    if (!userIsMod) {
        userIsMod = urlChangedPromise(async resolve => {
            let userRoles = await current.roles();
            if (userIsMod.fullfilled) {
                return;
            }
            resolve(0 < userRoles.filter(role => role === 'Mod' || role === 'Owner' || role === 'ChannelEditor'));
        });
    }
    return userIsMod;
};

export default current;