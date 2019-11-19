function mapElixrAPIEmote(elixrEmote, urlTemplate) {
    return {
        id: elixrEmote.id,
        code: elixrEmote.code,
        url: urlTemplate.replace('{{emoteId}}', elixrEmote.id),
        animated: elixrEmote.animated,
        width: elixrEmote.maxSize || 50,
        height: elixrEmote.maxSize || 50
    };
}

function getChannelEmotes(channels) {
    return new Promise(resolve => {
        let encodedChannels = encodeURIComponent(JSON.stringify(channels));
        const GET_ELIXR_EMOTES_URL = `https://api.mixrelixr.com/v1/emotes?channels=${encodedChannels}`;
        $.getJSON(GET_ELIXR_EMOTES_URL)
            .done(function(data) {
                resolve(data);
            })
            .fail(function(err) {
                console.log(err);
                resolve(null);
            });
    });
}

function getGlobalOnlyEmotes() {
    return new Promise(resolve => {
        const GET_ELIXR_GLOBAL_EMOTES_URL = `https://api.mixrelixr.com/v1/global`;
        $.getJSON(GET_ELIXR_GLOBAL_EMOTES_URL)
            .done(function(data) {
                resolve(data);
            })
            .fail(function(err) {
                console.log(err);
                resolve(null);
            });
    });
}

export async function load(channels, loadGlobal, loadChannel) {
    let emoteData;
    if (!loadChannel) {
        if (loadGlobal) {
            emoteData = await getGlobalOnlyEmotes();
        }
    } else {
        let channelIds = (channels && channels.map(c => c.id)) || [];
        emoteData = await getChannelEmotes(channelIds, loadGlobal === false);
    }

    if (emoteData == null) {
        return null;
    }

    let provider = {
        id: 'elixr-emotes',
        name: 'MixrElixr',
        emoteGroups: []
    };

    if (loadGlobal) {
        provider.emoteGroups.push({
            id: 'elixr-global-emotes',
            name: 'MixrElixr Global Emotes',
            providerName: 'MixrElixr',
            global: true,
            emotes: emoteData.globalEmotes.map(em => mapElixrAPIEmote(em, emoteData.globalEmoteUrlTemplate))
        });
    }

    if (loadChannel && channels && emoteData.channelEmotes) {
        for (let channelEmoteData of emoteData.channelEmotes) {
            let channelData = channels.find(c => c.id === channelEmoteData.channelId);
            provider.emoteGroups.push({
                id: `elixr-channel-emotes-${channelEmoteData.channelId}`,
                name: `${channelData.name}'s Custom Emotes`,
                channelId: channelData.id,
                channelName: channelData.name,
                providerName: 'MixrElixr',
                emotes: channelEmoteData.emotes.map(em =>
                    mapElixrAPIEmote(em, channelEmoteData.channelEmoteUrlTemplate)
                )
            });
        }
    }

    return provider;
}
