export async function load(channels, options) {
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
