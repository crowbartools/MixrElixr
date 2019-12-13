// import for side effects
import '../mixer/constellation';

import * as api from '../mixer/api';
import { emit, merge, urlChangedPromise } from '../utils/';

let user;

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

// When the user's info updates, update the cache and emit: MixrElixr:user:update
window.addEventListener('MixrElixr:constellation:user-update', data => {
    if (user && user.result) {
        merge(user.result, data);
        emit('user:update', user.result);
    }
});

export default current;