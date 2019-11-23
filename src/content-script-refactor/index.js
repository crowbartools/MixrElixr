import state from './state/index.js';
import emit from './utils/index.js';
import { waitForDom } from './utils/wait-for.js';

// imported for side effects;
import './page/';

let initialLoad = true;
async function init() {
    let detail = {initialLoad};

    // wait on the retrieval of current user info and settings
    if (initialLoad) {
        let res = await Promise.all([state.user(), state.settings()]);
        detail.user = res[0];
        detail.settings = res[1];
        emit('state:init', { detail });


        await waitForDom();
        emit('state:document-ready', { detail });

    // otherwise retrieved info from cache
    } else {
        detail.user = state.user.cached();
        detail.settings = state.settings.cached();
    }

    // get the current page's info (will wait on mixer to load)
    detail.page = await state.page();

    // if current page is stream-related get the channel's info
    if (detail.page && (detail.page.type === 'channel' || detail.page.type === 'embedded-chat')) {
        detail.channel = await state.channel();
    }

    emit('state:mixer-ready', { detail });
    initialLoad = false;
}
init()
    .then(() => {
        window.addEventListener('url-changed', init);
    });
