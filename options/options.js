var app = new Vue({
	el: '#app',
	data: {
		settings: {
			autoCloseInteractive: false
		}
	},
	methods: {
		getSavedSettings: function() {
			var app = this;
			// pull saved settings, provide the default settings if nothing exists
			chrome.storage.sync.get({
				"settings": app.settings
			}, function(options) {
				app.settings = options.settings;
			});
		},
		saveAllSettings: function() {
			var app = this;
			console.log("saving all settings");	
			chrome.storage.sync.set({
				settings: app.settings
			}, () => {
				// let the content script on whatever tab know the settings have been updated
				app.fireSaveEvent();
			});
		},
		fireSaveEvent: function() {
			chrome.tabs.query({}, function(tabs) {
				var message = { settingsUpdated: true };
				for (var i=0; i<tabs.length; ++i) {
					chrome.tabs.sendMessage(tabs[i].id, message);
				}
			});
		}
	},
	mounted: function() {
		// When the page is loaded
		this.getSavedData();
	}
});
