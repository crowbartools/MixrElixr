import * as elixrEmotes from './elixr-emote-provider';

let emoteProviders = [];
export async function setup(channels, channelPageOptions) {
    emoteProviders = [];

    // load elixr emotes
    emoteProviders.push(
        await elixrEmotes.load({
            channels: channels,
            loadGlobal: true,
            loadChannel: true
        })
    );
}

export function handleEmotes(messageContainerElement, channelId, hostMode) {
    messageContainerElement.find('span:not([class])').each(function() {
        let component = $(this);

        // we've already replaced emotes on this, skip it
        if (component.hasClass('me-custom-emote')) {
            return;
        }

        let text = component.text();
        const tokens = [...new Set(text.split(/\s/))];

        for (const token of tokens) {
            const emoteElement = findAndBuildEmote(token);
            if (!emoteElement) continue;

            text = text.replace(token, emoteElement);
        }
    });
}

function findAndBuildEmote(token, channelId, hostMode) {
    for (const emoteProvider of emoteProviders) {
        for (const emoteGroup of emoteProvider.emoteGroups) {
            for (const emote of emoteGroup.emotes) {
                if (token === emote.code) {
                    const styles = `max-height: ${emote.height}; max-width: ${emote.width};`;
                    const emoteElement = `
                        <span class="elixr-emote me-tooltip" style="${styles}" title="${emoteProvider.name}: Custom emote '${emote.name}'">
                            <img src="${emote.url}">
                        </span>
                    `;
                    return emoteElement;
                }
            }
        }
    }
}
