import { log } from './utils';

export function getChannelData(channelIdOrName) {
    return new Promise(resolve => {
        $.get(`https://mixer.com/api/v1/channels/${channelIdOrName}`)
            .done(data => {
                log('Got channel data for ' + channelIdOrName);
                resolve(data);
            })
            .fail(() => {
                // We reached our target server, but it returned an error
                log('Failed to get channel data for ' + channelIdOrName);
                resolve(null);
            });
    });
}
