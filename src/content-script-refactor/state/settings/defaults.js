export default {
    settingsFormatVersion: 2,
    global: {
        favoriteChannels: [], // {id: channelid, token: channeltoken}
        liveCount: {
            show: true,
            favoritesOnly: false
        },
        notifications: {
            enable: 'favorite',
            playSound: false,
            sound: 'default'
        },
        showBadge: false
    },
    channel: {
        autoTheater: false,
        closeCostreams: false,
        closeInteractive: false,
        largeVideo: false,
        lightsOutTheater: false,
        onHost: {
            foward: false,
            mute: false
        }
    },
    chat: {
        blacklistWords: {
            enableWhenMod: false,
            style: 'blur',
            words: []
        },
        customEmotes: {
            enable: true,
            autoComplete: true,
            globalEmotes: true,
            channelEmotes: true
        },
        fontSize: {
            enable: false,
            size: 15
        },
        hideAvatars: false,
        hideChatHeaders: false,
        hideDeleted: true,
        hideEmberMessages: false,
        hideLevelProgression: false,
        hideSkillEffects: false,
        hideSkillMessages: false,
        hideStickers: false,
        highlightOnMention: false,
        highlightWords: [],
        ignoreUsers: {
            enableWhenMod: false,
            users: [] // {id: userid, token: username}
        },
        inlineImages: {
            enable: false,
            minrole: 'mod',
            users: {
                whitelist: [], // {id: userid, token: username}
                blacklist: [] // {id: userid, token: username}
            }
        },
        modActions: {
            showActions: true,
            showDeleted: true
        },
        slowChatCooldownTimer: false,
        timestampMessages: false
    },
    homepage: {
        automute: false,
        highlightFavorites: false,
        pinsearch: false,
        removeFeatured: false
    },
    browsepage: {
        highlightFavorites: true
    },
    sitewide: {
        navbar: {
            declutter: false,
            infoPanel: false
        },
        theme: 'default'
    },
    stream: {
        autoMute: false
    }
};