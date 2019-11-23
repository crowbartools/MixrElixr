import * as elixrEmotes from './providers/elixr-emote-provider';
import * as api from '../../../api';
import * as utils from '../../../utils/index.js';
import $ from '../../../plugins/jquery-wrapper.js';


let emoteProviders = [];

export let emotesAvailable = false;
export async function setup(mainChannelData, channelPageOptions) {
    emoteProviders = [];
    emotesAvailable = false;

    const allowCustomEmoteMasterSwitch = channelPageOptions.customEmotes !== false;
    const allowGlobal = channelPageOptions.globalEmotes !== false;
    const allowChannel = channelPageOptions.channelEmotes !== false;

    if (!allowCustomEmoteMasterSwitch || (!allowGlobal && !allowChannel)) return;

    let emoteChannels = [
        {
            id: mainChannelData.id,
            name: mainChannelData.token
        }
    ];

    if (allowChannel) {
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
                    if (costreamChannel.id === mainChannelData.id) continue;
                    emoteChannels.push({
                        id: costreamChannel.id,
                        name: costreamChannel.token
                    });
                }
            }
        }
    }

    // load elixr emotes
    emoteProviders.push(await elixrEmotes.load(emoteChannels, allowGlobal, allowChannel));

    emotesAvailable = emoteProviders.some(
        ep => ep.emoteGroups != null && ep.emoteGroups.some(eg => eg.emotes != null && eg.emotes.length > 0)
    );
}

export function getAvailableEmoteGroups(channelName = null) {
    let emoteGroups = [];
    for (const emoteProvider of emoteProviders) {
        for (const emoteGroup of emoteProvider.emoteGroups) {
            if (channelName) {
                // if channel name is provided we are in host mode and are looking at a specific channels chat
                if (!emoteGroup.global && emoteGroup.channelName !== channelName) {
                    continue;
                }
            }
            emoteGroups.push(emoteGroup);
        }
    }

    //sort global groups to the bottom
    emoteGroups.sort((a, b) => {
        return (a.global === b.global ? 0 : a.global ? 1 : -1);
    });
    return emoteGroups;
}

export function getEmoteElement(emote, providerName = 'MixrElixr') {
    const styles = `max-height: ${emote.height}px; max-width: ${emote.width}px;`;
    const emoteElement = `<img src="${
        emote.url
    }" style="${styles}" class="elixr-emote elixr-tooltip" title="${providerName}: Custom emote '${utils.escapeHTML(
        emote.code
    )}'">`;
    return emoteElement;
}

function findAndBuildEmote(token, channelName = null) {
    for (const emoteGroup of getAvailableEmoteGroups(channelName)) {
        for (const emote of emoteGroup.emotes) {
            if (token === emote.code) {
                console.debug('found emote', emote);
                return getEmoteElement(emote, emoteGroup.providerName);
            }
        }
    }
}

export function handleEmotes(messageContainerElement, channelName) {
    if (!emotesAvailable) return;
    messageContainerElement.find('span:not([class])').each(function() {
        let component = $(this);

        // we've already replaced emotes on this, skip it
        if (component.hasClass('elixr-custom-emote')) {
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

            component.addClass('elixr-custom-emote');
        }
    });
}
