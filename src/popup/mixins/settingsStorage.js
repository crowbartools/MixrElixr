import browser from 'webextension-polyfill';

global.settingsStorage = {
  methods: {
    fetchSettings: function() {
      let app = this;
      let defaults = app.getDefaultOptions();

      return browser.storage.sync.get({
        streamerPageOptions: defaults.streamerPageOptions,
        homePageOptions: defaults.homePageOptions,
        generalOptions: defaults.generalOptions
      });
    },
    saveAllSettings: function(settings, emitEvent = true) {
      let app = this;
      browser.storage.sync.set(settings).then(() => {
        if (emitEvent) {
          app.emitSettingUpdatedEvent();
        }
      });
    },
    saveStreamerPageOptions: function(options) {
      this.saveAllSettings({
        streamerPageOptions: options
      });
    },
    saveHomePageOptions: function(options) {
      this.saveAllSettings({
        homePageOptions: options
      });
    },
    saveGeneralOptions: function(options) {
      this.saveAllSettings({
        generalOptions: options
      });
    },
    getDefaultOptions: function() {
      return {
        streamerPageOptions: {
          global: {
            autoCloseInteractive: false,
            autoCloseCostreams: false,
            autoTheater: false,
            separateChat: false,
            alternateChatBGColor: false,
            mentionChatBGColor: false,
            customEmotes: false,
            globalEmotes: true,
            channelEmotes: true,
            hideChatAvatars: false,
            hideChannelProgression: false,
            hideChatHeaders: false,
            hideDeleted: false,
            timestampAllMessages: false,
            showImagesInline: false,
            lowestUserRoleLinks: 'mod',
            inlineImgPermittedUsers: [],
            inlineImgBlacklistedUsers: [],
            autoForwardOnHost: false,
            autoMute: false,
            autoMuteOnHost: false,
            ignoredUsers: [],
            keywords: [],
            hideKeywords: [],
            hideStyle: 'blur',
            enableHideKeywordsWhenMod: false,
            useCustomFontSize: false,
            textSize: 15
          },
          overrides: {}
        },
        homePageOptions: {
          removeFeatured: false,
          autoMute: false,
          pinSearchToTop: true
        },
        generalOptions: {
          declutterTopBar: true,
          showBadge: true,
          favoriteFriends: [],
          highlightFavorites: true,
          liveNotificationsMode: 'favorites',
          playLiveNotificationSound: true,
          liveNotificationSoundType: 'default'
        }
      };
    },
    emitSettingUpdatedEvent: function() {
      // let the content script on whatever tab know the settings have been updated
      browser.tabs.query({}).then(tabs => {
        var message = { settingsUpdated: true };
        for (let tab of tabs) {
          browser.tabs.sendMessage(tab.id, message);
        }
      });
    }
  }
};
