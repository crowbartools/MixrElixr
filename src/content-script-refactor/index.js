import state from './state/index.js';
import emit from './utils/index.js';
import { waitForDom } from './utils/wait-for.js';

let initialLoad = true;
async function processPage() {

    // wait on the retrieval of current user info and settings
    let res = await Promise.all([state.user(), state.settings()]),

        // Build events detail object
        detail = { initialLoad, user: res[0], settings: res[1] };

    if (!initialLoad) {
        emit('state:init', { detail });
    }

    // wait for the dom to load
    await waitForDom();
    emit('state:document-ready', { detail });

    // get the current page's info (will wait on mixer to load)
    detail.page = await state.page();

    // if current page is stream-related get the channel's info
    if (detail.page && (detail.page.type === 'channel' || detail.page.type === 'embedded-chat')) {
        detail.channel = await state.channel();
    }

    emit('state:mixer-ready', { detail });

    initialLoad = false;
    window.addEventListener('url-changed', processPage);
}
processPage();