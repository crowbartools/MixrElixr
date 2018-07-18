Vue.component('home-page-options', {
	template: `
		<div class="settings-section">
			<div class="settings-section-header">
				<span class="title">Homepage</span>
			</div>
			<div class="settings-section-settings" style="padding-bottom: 0;">
				<checkbox-toggle :value.sync="removeFeatured" @changed="saveSettings()" label="Minimal Homepage"></checkbox-toggle>
			</div>
		</div>
	`,
	mixins: [settingsStorage],
	data: function() {
		var dataObj = {};

		var defaults = this.getDefaultOptions().homePageOptions;

		// fill out our model
		Object.keys(defaults).forEach((k) => {
			dataObj[k] = defaults[k];
		});

		return dataObj;
	},
	methods: {
		saveSettings: function() {
			var model = this.getModel();
			this.saveHomePageOptions(model);
		},
		loadSettings: function() {
			var app = this;
			this.fetchSettings().then((data) => {
				var homePageOptions = data.homePageOptions;
				app.setModel(homePageOptions);
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
			var options = this.getDefaultOptions().homePageOptions;
			
			Object.keys(options).forEach((k) => {
				builtModel[k] = app[k];
			});

			return builtModel;
		}
	},
	mounted: function() {
		this.loadSettings();
	}
});