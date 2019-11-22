import * as api from '../api.js';
import pageInfo from './page.js';
import {urlDependentPromise} from '../utils/url-changed.js';

let channelCache = null;

window.addEventListener('elixr:url-changed', () => {
    channelCache = null;
});

// state.channel()
export default function () {
    if (!channelCache) {
        channelCache = urlDependentPromise(resolve => {
            pageInfo()
                .then(page => {

                    // promise fullfilled due to URL change
                    if (!channelCache || channelCache.fullfilled) {
                        return;
                    }

                    // not a channel page
                    if (
                        page == null ||
                        (page.type !== 'embed-chat' && page.type !== 'channel') ||
                        (page.id == null && page.channel == null)
                    ) {
                        return resolve(null);
                    }

                    // get data from api
                    api.getChannelData(page.id != null ? page.id : page.channel)
                        .then(channel => {
                            if (!channelCache || channelCache.fullfilled) {
                                return;
                            }
                            resolve(channel);
                        });

                });
        });
    }
    return channelCache;
}