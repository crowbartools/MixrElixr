Vue.component('streamer-page-options', {
	template: `
		<div class="settings-section">
			<div class="settings-section-header">
				<span class="title">Streamer Page</span> <streamer-override-dropdown :overrideNames="overrideNames" 
						:selected="selected"
						@override-added="overrideAdded"
						@override-selected="overrideSelected"
						@override-deleted="overrideDeleted">
					</streamer-override-dropdown>
			</div>
			<div class="settings-section-settings">
				<span class="setting-subcategory">General</span>
				<checkbox-toggle :value.sync="autoCloseInteractive" @changed="saveSettings()" label="Auto close Interactive boards"></checkbox-toggle>
				<checkbox-toggle :value.sync="autoMute" @changed="saveSettings()" label="Auto Mute Streams"></checkbox-toggle>

				<span class="setting-subcategory">Chat</span>
				<checkbox-toggle :value.sync="separateChat" @changed="saveSettings()" label="Separate Chat Lines"></checkbox-toggle>
				<checkbox-toggle :value.sync="alternateChatBGColor" @changed="saveSettings()" label="Alternate Chat BG Color"></checkbox-toggle>
				<checkbox-toggle :value.sync="showImageLinksInline" @changed="saveSettings()" label="Show Image Links Inline"></checkbox-toggle>
				<div v-if="showImageLinksInline" style="width: 65%">
					<div style="padding-bottom: 5px;">Permitted User Roles for Inline Images</div>
					<b-form-select v-model="lowestUserRoleLinks" :options="userRoles" class="mb-3"></b-form-select>
				</div>
				

				<span class="setting-subcategory">Hosts</span>
				<checkbox-toggle :value.sync="autoForwardOnHost" @changed="saveSettings()" label="Auto Forward on Host"></checkbox-toggle>
				<checkbox-toggle :value.sync="autoMuteOnHost" @changed="saveSettings()" label="Auto Mute Stream on Host"></checkbox-toggle>
			</div>
        </div>
	`,
	mixins: [settingsStorage],
	methods: {
		overrideSelected: function(name) {
			this.selected = name;
			this.setModel(this.getSelectedOptions());
		},
		overrideAdded: function(name) {
			this.selected = name;

			var defaults = this.getDefaultOptions().streamerPageOptions.global;
			
			var defaultsCopy = JSON.parse(JSON.stringify(defaults));

			this.overrides[name] = defaultsCopy;

			this.overrideNames = this.getOverrideNames();

			this.setModel(defaultsCopy);

			this.saveSettings();
		},
		overrideDeleted: function(name) {
			delete this.overrides[name];
			this.overrideNames = this.getOverrideNames();
			this.selectModel('Global');
			this.saveSettings();
		},
		selectModel: function(name) {
			this.selected = name;
			this.setModel(this.getSelectedOptions());
		},
		saveSettings: function() {
			var model = this.getModel();

			if(this.selected === 'Global') {
				this.global = model;
			} else {
				this.overrides[this.selected] = model;
			}
			this.saveStreamerPageOptions({
				global: this.global,
				overrides: this.overrides
			});
		},
		loadSettings: function() {
			var app = this;
			app.selected = 'Global';
			this.fetchSettings().then((data) => {
				var streamerPageOptions = data.streamerPageOptions;
				app.setModel(streamerPageOptions.global);
				app.global = streamerPageOptions.global;
				app.overrides = streamerPageOptions.overrides;
				app.overrideNames = app.getOverrideNames();
			});
		},
		getOverrideNames: function() {
			return Object.keys(this.overrides);
		},
		getSelectedOptions: function() {
			if(this.selected === 'Global') {
				return this.global;
			} else {
				return this.overrides[this.selected];
			}
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
			var options = app.getSelectedOptions();	
			
			Object.keys(options).forEach((k) => {
				builtModel[k] = app[k];
			});

			return builtModel;
		}
	},
	watch: {
		lowestUserRoleLinks: function(newRole) {
			this.saveSettings();
		}
	},
	data: function() {

		var dataObj = {
			selected: 'Global',
			userRoles: [
				{ value: 'owner', text: 'Streamer' },
				{ value: 'mod', text: 'Mods (& above)' },
				{ value: 'subscriber', text: 'Subscribers (& above)' },
				{ value: 'pro', text: 'Pro (& above)' },
				{ value: 'all', text: 'All' }
			],
			overrideNames: []
		};

		var defaults = this.getDefaultOptions().streamerPageOptions;

		// fill out our model with the default settings
		var global = defaults.global;		
		Object.keys(global).forEach((k) => {
			dataObj[k] = global[k];
		});

		dataObj.global = global;
		dataObj.overrides = defaults.overrides;

		return dataObj;
	},
	mounted: function() {
		this.loadSettings();
	}
});