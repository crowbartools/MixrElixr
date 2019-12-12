import * as api from '../mixer/api';
import page from './page';
import {urlChangedPromise} from '../utils/';

let channel = null;

window.addEventListener('MixrElixr:url-changed', () => {
    channel = null;
});

// state.channel()
function current() {
    if (!channel) {
        channel = urlChangedPromise(resolve => {
            page()
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