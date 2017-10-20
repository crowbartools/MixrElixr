/*
	VUE COMPONENTS
*/
Vue.component('nav-bar', {
	template: `
		<nav class="navbar navbar-expand navbar-dark bg-dark">
			<a class="navbar-brand">
				<img src="/resources/images/elixr-128.png" width="30" height="30" alt="">
			</a>
			<div class="collapse navbar-collapse" id="navbarNav">
				<ul class="navbar-nav">
					<li class="nav-item" class="clickable" :class="{active: onlineActive}" @click="changeTab('online')">
						<a class="nav-link">Who's Online <span class="badge badge-light" v-if="onlineCount > 0">{{onlineCount}}</span></a>
					</li>
					<li class="nav-item" class="clickable" :class="{active: optionsActive}" @click="changeTab('options')">
						<a class="nav-link">Options</a>
					</li>
				</ul>
			</div>
		</nav>
	`,
	data: function() {
		return {
			activeTab: 'online',
			onlineActive: true,
			optionsActive: false
		}  
	},
	props: ['onlineCount'],
	methods: {
		changeTab: function(tab) {
			this.onlineActive = tab === 'online';
			this.optionsActive = tab === 'options';
			this.$emit('tab-changed', tab)
		}
	}
})

Vue.component('checkbox-toggle', {
	template: `
		<label style="display:flex">
			<label class="switch">
				<input type="checkbox" v-model="value" @change="valueUpdated"/>
				<span class="slider"></span>
			</label>
			{{label}}
		</label>
	`,
	props: ['value', "label"],
	methods: {
		valueUpdated: function() {
			this.$emit('update:value', this.value)
			this.$emit('change');
		}
	}
})




/*
	VUE APP
*/

var settingsStorage = {
	fetch: function(defaultSettings) {
		return new Promise((resolve, reject) => {
			chrome.storage.sync.get({
				"settings": defaultSettings
			}, function(data) {
				resolve(data);
			});
		});
	}, 
	save: function(settings) {
		chrome.storage.sync.set({ "settings": settings }, () => {		
			settingsStorage.emitEvent();
		});
	},
	emitEvent: function() {
		// let the content script on whatever tab know the settings have been updated
		chrome.tabs.query({}, function(tabs) {
			var message = { settingsUpdated: true };
			for (var i=0; i<tabs.length; ++i) {
				chrome.tabs.sendMessage(tabs[i].id, message);
			}
		});
	}
}

var app = new Vue({
	el: '#app',
	data: {
		autoCloseInteractive: false,
		separateChat: false,
		alternateChatBGColor: false,
		showImageLinksInline: false,
		autoForwardOnHost: false,
		removeHomepageFeatured: false,
		activeTab: 'online',
		onlineStreamers: 1
	},
	computed: {
		settings: {
			get: function() {
				return {
					autoCloseInteractive: this.autoCloseInteractive,
					separateChat: this.separateChat,
					alternateChatBGColor: this.alternateChatBGColor,
					showImageLinksInline: this.showImageLinksInline,
					autoForwardOnHost: this.autoForwardOnHost,
					removeHomepageFeatured: this.removeHomepageFeatured
				}
			}, 
			set: function(settings) {
				this.autoCloseInteractive = settings.autoCloseInteractive === true;
				this.separateChat = settings.separateChat === true;
				this.alternateChatBGColor = settings.alternateChatBGColor === true;
				this.showImageLinksInline = settings.showImageLinksInline === true;
				this.autoForwardOnHost = settings.autoForwardOnHost === true;
				this.removeHomepageFeatured = settings.removeHomepageFeatured === true;
			}		
		}
	},
	methods: {
		fetchSettings: function() {
			var app = this;
			settingsStorage.fetch(app.settings).then((data) => {
				app.settings = data.settings;
			});
		},
		saveSettings: function() {
			var app = this;
			settingsStorage.save(app.settings);
		},
		updateActiveTab: function(tab) {
			console.log("tab changed: " + tab);
			this.activeTab = tab;
		}
	},
	mounted: function() {
		// When Vue is ready
		this.fetchSettings();
	}
});


