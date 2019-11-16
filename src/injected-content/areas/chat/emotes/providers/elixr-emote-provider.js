export async function load(channels, loadGlobal, loadChannel) {
    return {
        id: 'elixr',
        name: 'MixrElixr',
        emoteGroups: [
            {
                id: 'elixr-global-emotes',
                name: 'MixrElixr Global Emotes',
                global: true,
                emotes: [
                    {
                        id: '1234',
                        code: 'testEmote',
                        url: 'https://crowbartools/',
                        animated: true,
                        width: 50,
                        height: 50
                    }
                ]
            },
            {
                id: 'elixr-channel-emotes-12345',
                name: "ebiggz's Channel Emotes",
                channelId: 12345,
                emotes: [
                    {
                        id: '1234',
                        code: 'testEmote',
                        url: 'https://crowbartools/',
                        animated: false,
                        width: 50,
                        height: 50
                    }
                ]
            }
        ]
    };
}

function getEmotes(channelId) {
    return new Promise(resolve => {
        const GET_ELIXR_EMOTES_URL = `https://api.mixrelixr.com/v1/emotes/${channelId}`;
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
