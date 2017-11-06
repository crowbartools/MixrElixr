Vue.component('general-options', {
	template: `
		<div class="settings-section">
			<div class="settings-section-header">
				<span class="title">General</span>
			</div>
			<div class="settings-section-settings" style="padding-bottom: 0;">
			<div class="option-wrapper">
				<div style="padding-bottom: 5px;">Favorite Streamers<option-tooltip name="favorite" title="Any streamers listed here will show up in the favorites list. If a favorite is online, the icon badge will be green instead of blue."></option-tooltip></div>
				<edittable-list class="option" :value.sync="favoriteFriends" :options="followingList" tag-placeholder="" placeholder="Select a streamer" @changed="favoritesChanged()" :auto-close="true"></edittable-list>
			</div>
			</div>
		</div>
	`,
	mixins: [settingsStorage, friendFetcher],
	data: function() {

		var dataObj = {
			followingList: []
		};

		//apply our defaults
		var defaults = this.getDefaultOptions().generalOptions;

		// fill out our model
		Object.keys(defaults).forEach((k) => {
			dataObj[k] = defaults[k];
		});

		return dataObj;
	},
	methods: {
		favoritesChanged: function() {
			this.saveSettings();
			bus.$emit('favorites-updated');
		},
		saveSettings: function() {
			var model = this.getModel();
			this.saveGeneralOptions(model);
		},
		loadSettings: function() {
			var app = this;
			this.fetchSettings().then((data) => {
				app.setModel(data.generalOptions);
			});
		},
		setModel: function(options) {
			var app = this;
			Object.keys(options).forEach((k) => {
				app[k] = options[k];
			});
		},
		getModel: function() {
			var app = this;
			
			var builtModel = {};
			var options = this.getDefaultOptions().generalOptions;
			
			Object.keys(options).forEach((k) => {
				builtModel[k] = app[k];
			});

			return builtModel;
		}
	},
	mounted: function() {
		var app = this;
		app.loadSettings();
		app.outputMixerFollows(false).then((followList) => {
			app.followingList = followList.map(u => u.token);
		})
	}
});