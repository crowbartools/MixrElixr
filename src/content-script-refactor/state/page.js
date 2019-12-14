import { $, emit, waitFor, urlChangedPromise } from '../utils/';
import { channel, settings, user } from './';

const embedChatMatch = /^https?:\/\/(?:www\.)?mixer\.com\/embed\/chat\/(\w+)/;
const channelMatch = /^https?:\/\/(?:www\.)mixer\.com\/([^(){}%\\/?#]+)(?:\(hub:.*)?$/i;

let page;

// state.page();
function current() {
    if (!page) {
        current.update();
    }
    return page;
}

current.update = function () {
    page = urlChangedPromise(async resolve => {
        await waitFor.mixer();

        // fullfilled due to url change
        if (page == null || page.fullfilled) {
            return;
        }

        // remove query parameters and hash from uri
        // remove /mobile suffix from uri
        let uri = window.location.uri.replace(/[?#].*$/, '').replace(/\/mobile\/?$/, '');

        // Page: embedded chat
        let isEmbedChat = embedChatMatch.exec(uri);
        if (isEmbedChat != null) {
            return resolve({
                type: 'embedded-chat',
                hasChat: true,
                channel: isEmbedChat[1]
            });
        }

        // Page: home page
        if ($('b-homepage').length !== 0) {
            return resolve({
                type: 'homepage'
            });
        }


        let details = {
            desktop: $('b-channel-page-wrapper').length !== 0,
            mobile: $('b-channel-mobile-page-wrapper').length !== 0
        };

        // Page: other/unknown
        if (!details.desktop && !details.mobile) {
            return resolve({
                type: 'other'
            });
        }

        // Page: channel
        details.type = 'channel';
        details.hasChat = true;

        // Attempt to get channel identifier from uri
        let channelInUri = channelMatch.exec(uri);
        if (channelInUri != null) {
            details.identifier = channelInUri[1];
            return resolve(details);
        }

        // Attempt to get channel identifier from dom
        let pollPageForChannel = urlChangedPromise(resolve => {
            (function pollForChannelName() {
                if (pollPageForChannel.fullfilled) {
                    return;
                }

                let identifier = '';
                if (details.isDesktop) {
                    identifier = $('b-channel-profile')
                        .find('h2')
                        .first()
                        .text();

                } else {
                    identifier = $('b-mobile-details-bar')
                        .find('.name')
                        .text();
                }
                identifier = (identifier || '').trim();

                if (identifier === '') {
                    setTimeout(pollForChannelName, 10);

                } else {
                    resolve(identifier);
                }
            }());
        });
        let identifier = await pollPageForChannel;

        // promise fullfilled due to url change
        if (!page || page.fullfilled) {
            return;
        }

        if (identifier != null) {
            details.identifier = identifier;
        }

        return resolve(details);
    });
};

// state.page.cached();
current.cached = function () {
    if (!page || !page.fullfilled) {
        return;
    }
    return page.result;
};

export default current;

async function renew() {
    let page = await current.update();

    let details = {
        settings: settings.cached(),
        user: user.cached(),
        page
    };

    // emit generic page load event
    emit('MixrElixr:load:page', details);

    // if page is channel-esq update channel's info
    if (page.type === 'embedded-chat' || page.type === 'channel') {
        details.channel = await channel.update();
    }

    // emit page-specific event
    emit(`MixrElixr:page:${page.type}`, details);
}

// Renew when dom loads or the url changes
window.addEventListener('MixrElixr:load:dom', renew);
window.addEventListener('MixrElixr:state:url-changed', renew);

