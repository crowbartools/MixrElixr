import * as elixrEmotes from './providers/elixr-emote-provider';
import * as api from '../../../api';
import * as utils from '../../../utils';

let emoteProviders = [];
export async function setup(mainChannelData, channelPageOptions) {
    let emoteChannels = [
        {
            id: mainChannelData.id,
            name: mainChannelData.token
        }
    ];

    if (mainChannelData.hosteeId) {
        const hosteeChannelData = await api.getChannelData(mainChannelData.hosteeId);
        if (hosteeChannelData != null) {
            emoteChannels.push({
                id: hosteeChannelData.id,
                name: hosteeChannelData.token
            });
        }
    }

    if (mainChannelData.costreamId) {
        const costreamData = await api.getCostreamData(mainChannelData.costreamId);
        if (costreamData != null) {
            for (let costreamChannel of costreamData.channels) {
                emoteChannels.push({
                    id: costreamChannel.id,
                    name: costreamChannel.token
                });
            }
        }
    }
    emoteProviders = [];

    // load elixr emotes
    emoteProviders.push(await elixrEmotes.load(emoteChannels, true, true));
}

export function handleEmotes(messageContainerElement, channelName) {
    messageContainerElement.find('span:not([class])').each(function() {
        let component = $(this);

        // we've already replaced emotes on this, skip it
        if (component.hasClass('me-custom-emote')) {
            return;
        }

        let text = component.text();
        const tokens = [...new Set(text.split(/\s/))];

        let foundEmote = false;
        for (const token of tokens) {
            const emoteElement = findAndBuildEmote(token, channelName);

            if (!emoteElement) continue;

            foundEmote = true;

            const tokenRegex = new RegExp(utils.escapeRegExp(token), 'g');
            text = text.replace(tokenRegex, emoteElement);
        }

        if (foundEmote) {
            component.html(text);

            component.addClass('me-custom-emote');
        }
    });
}

function findAndBuildEmote(token, channelName = null) {
    for (const emoteProvider of emoteProviders) {
        for (const emoteGroup of emoteProvider.emoteGroups) {
            if (channelName) {
                // if channel name is provided we are in host mode and are looking at a specific channels chat
                if (!emoteGroup.global && emoteGroup.channelName !== channelName) {
                    continue;
                }
            }
            for (const emote of emoteGroup.emotes) {
                if (token === emote.code) {
                    console.log('found emote', emote);
                    const styles = `max-height: ${emote.height}px; max-width: ${emote.width}px;`;
                    const emoteElement = `
                    <img src="${emote.url}" style="${styles}" class="elixr-emote me-tooltip" title="${emoteProvider.name}: Custom emote '${emote.code}'">
                    `;
                    return emoteElement;
                }
            }
        }
    }
}
