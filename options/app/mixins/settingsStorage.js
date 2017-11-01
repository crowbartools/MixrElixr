settingsStorage = {
	methods: {
		fetchSettings: function() {
			var app = this;
			return new Promise((resolve) => {
				var defaults = this.getDefaultOptions();
			
				chrome.storage.sync.get({
					'streamerPageOptions': defaults.streamerPageOptions,
					'homePageOptions': defaults.homePageOptions
				}, function(data) {
					resolve(data);
				});
			});
		},
		saveAllSettings: function(settings) {
			var app = this;
			chrome.storage.sync.set(settings, () => {
				app.emitSettingUpdatedEvent();
			});
		},
		saveStreamerPageOptions: function(options) {
			this.saveAllSettings({
				'streamerPageOptions': options
			});
		},
		saveHomePageOptions: function(options) {
			this.saveAllSettings({
				'homePageOptions': options
			});
		},
		getDefaultOptions: function() {
			return {
				streamerPageOptions: {
					global: {
						autoCloseInteractive: false,
						separateChat: false,
						alternateChatBGColor: false,
						mentionChatBGColor: false,
						timestampAllMessages: false,
						showImagesInline: false,
						lowestUserRoleLinks: 'mod',
						inlineImgUsers: [],
						inlineUsersIsWhitelist: false,
						autoForwardOnHost: false,
						autoMute: false,
						autoMuteOnHost: false,
						ignoredUsers: [],
						keywords: []
					},
					overrides: {}
				},
				homePageOptions: {
					removeFeatured: false,
					autoMute: false
				}
			};
		},
		emitSettingUpdatedEvent: function() {
		// let the content script on whatever tab know the settings have been updated
			chrome.tabs.query({}, function(tabs) {
				var message = { settingsUpdated: true };
				for (var i = 0; i < tabs.length; ++i) {
					chrome.tabs.sendMessage(tabs[i].id, message);
				}
			});
		}
	}
};