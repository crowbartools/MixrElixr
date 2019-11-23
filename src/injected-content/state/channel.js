import * as api from '../api.js';
import pageInfo from './page.js';
import {urlDependentPromise} from '../utils/url-changed.js';

let channel = null;

window.addEventListener('elixr:url-changed', () => {
    channel = null;
});

// state.channel()
function current() {
    if (!channel) {
        channel = urlDependentPromise(resolve => {
            pageInfo()
                .then(page => {

                    // promise fullfilled due to URL change
                    if (!channel || channel.fullfilled) {
                        return;
                    }

                    // not a channel page
                    if (
                        page == null ||
                        (page.type !== 'embedded-chat' && page.type !== 'channel') ||
                        (page.identifier == null)
                    ) {
                        return resolve(null);
                    }

                    // get data from api
                    api.getChannelData(page.identifier)
                        .then(channelDetails => {
                            if (!channel || channel.fullfilled) {
                                return;
                            }
                            resolve(channelDetails);
                        });

                });
        });
    }
    return channel;
}

// state.channel.cached()
current.cached = function cached() {
    if (!channel || !channel.fullfilled) {
        return;
    }
    return channel.result;
};

export default current;