import state from './state/index.js';

// import all of util for side effects
import * as utils from './utils/';

// import contexts for side effects
import './contexts/';

// aliases for easy referencing
let { emit, waitFor } = utils;

(async function () {

    // pre-calls so the promises can be running in the background while others are await'ed
    let proms = {
        settings: state.settings(),
        user: state.user(),
        dom: waitFor.dom(),
        page: state.page()
    };

    // Event: MixrElixr:load:init
    let [settings, user] = await Promise.all([proms.settings, proms.user]);
    emit('load:init', { settings, user });

    // Event: MixrElixr:load:dom
    await proms.dom;
    emit('load:dom', { settings, user });

    // Event: MixrElixr:load:page
    let page = await proms.page;
    emit('load:page', { settings, user, page });
}());