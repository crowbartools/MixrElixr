/*
	VUE COMPONENTS
*/
Vue.component('nav-bar', {
	template: `
		<nav class="navbar navbar-expand navbar-dark bg-dark">
			<a class="navbar-brand">
				<img src="/resources/images/elixr-light-128.png" width="30" height="30" alt="">
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
		};
	},
	props: ['onlineCount'],
	methods: {
		changeTab: function(tab) {
			this.onlineActive = tab === 'online';
			this.optionsActive = tab === 'options';
			this.$emit('tab-changed', tab);
		}
	}
});

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
	props: ['value', 'label'],
	methods: {
		valueUpdated: function() {
			this.$emit('update:value', this.value);
			this.$emit('change');
		}
	}
});

Vue.component('streamer-page-options', {
	template: `
        <div>
			<h4>Streamer Page 
			<streamer-override-dropdown :overrideNames="overrideNames" 
										:selected="selected"
										@override-added="overrideAdded"
										@override-selected="overrideSelected">
			</streamer-override-dropdown></h4>
            <checkbox-toggle :value.sync="autoCloseInteractive" :change="saveSettings()" label="Auto close Interactive boards"></checkbox-toggle>
            <checkbox-toggle :value.sync="separateChat" :change="saveSettings()" label="Separate Chat Lines"></checkbox-toggle>
            <checkbox-toggle :value.sync="alternateChatBGColor" :change="saveSettings()" label="Alternate Chat BG Color"></checkbox-toggle>
            <checkbox-toggle :value.sync="showImageLinksInline" :change="saveSettings()" label="Show Image Links Inline"></checkbox-toggle>
            <checkbox-toggle :value.sync="autoForwardOnHost" :change="saveSettings()" label="Auto Forward on Host"></checkbox-toggle>
        </div>
	`,
	methods: {
		overrideSelected: function(name) {
			console.log('selected');
			console.log(name);
			this.selected = name;
			this.model = this.getSelectedOptions();
		},
		overrideAdded: function(name) {
			console.log('added');
			this.selected = name;

			var defaults = settingsStorage.getDefaultOptions().streamerPageOptions.global;
			
			var defaultsCopy = JSON.parse(JSON.stringify(defaults));

			this.overrides[name] = defaultsCopy;

			this.overrideNames = this.getOverrideNames();

			this.model = defaultsCopy;

			this.saveSettings();
		},
		saveSettings: function() {
			var model = this.model;

			if(this.selected === 'Global') {
				this.global = model;
			} else {
				this.overrides[this.selected] = model;
			}
			settingsStorage.saveStreamerPageOptions({
				global: this.global,
				overrides: this.overrides
			});
		},
		loadSettings: function() {
			var app = this;
			console.log('setting global');
			app.selected = 'Global';
			console.log('loading settings');
			settingsStorage.fetch().then((data) => {
				console.log(data);
				app.model = data.global;
				app.global = data.global;
				app.overrides = data.overrides;
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
		}
	},
	computed: {
		model: {
			get: function() {
				var app = this;
				
				var builtModel = {};
				var options = app.getSelectedOptions();		
				Object.keys(options).forEach((k) => {
					builtModel[k] = app[k];
				});

				return builtModel;
			}, 
			set: function(options) {
				var app = this;	
				Object.keys(options).forEach((k) => {
					app[k] = options[k];
				});
			}
		}
	},
	data: function() {
		console.log('creating data object');
		var dataObj = {
			selected: 'Global',
			overrideNames: []
		};

		var defaults = settingsStorage.getDefaultOptions().streamerPageOptions;

		// fill out our model with the default settings
		var global = defaults.global;		
		Object.keys(global).forEach((k) => {
			dataObj[k] = global[k];
		});

		dataObj.global = global;
		dataObj.overrides = defaults.overrides;

		console.log(dataObj);
		return dataObj;
	},
	mounted: function() {
		var app = this;
		console.log('mounted');
		app.loadSettings();
	}
});


Vue.component('streamer-override-dropdown', {
	template: `
        <span>
            <b-dropdown id="ddown1" v-bind:text="selected" variant="link" class="m-md-2 white-link">
                <b-dropdown-item  @click="selectOverride('Global')">Global</b-dropdown-item>
                <b-dropdown-header id="header1">Streamer Overrides</b-dropdown-header>
                <b-dropdown-item aria-describedby="header1" v-for="name in overrideNames" @click="selectOverride(name)">{{name}}</b-dropdown-item>
                <b-dropdown-divider></b-dropdown-divider>
                <b-dropdown-item @click="showModal">+ Add Streamer</b-dropdown-item>
            </b-dropdown>
            <b-modal id="newOverrideModal"
                    ref="newOverrideModal"
                    title="Enter Streamer Name"
                    @ok="handleOk"
                    @shown="clearName">
                <b-form-input type="text"
                            placeholder="Enter Streamer Name"
                            v-model="newName"></b-form-input>
                <span v-if="newNameError" style="color:red; margin-top: 10px;">Please enter a name!</span>
            </b-modal>
        </span>   
    `,
	props: ['overrideNames', 'selected'],
	data: function() {
		return {
			newName: '',
			newNameError: false,
			selectedName: this.selected
		};
	},
	methods: {
		selectOverride: function(name) {
			console.log('selecting: ' + name);
			this.$emit('override-selected', name);
		},
		clearName: function() {
			this.newName = '';
		},
		showModal: function() {
			this.$refs.newOverrideModal.show();
		},
		handleOk: function(evt) {
			// Prevent modal from closing
			evt.preventDefault();
			if (!this.newName) {
				this.newNameError = true;
			} else {
				this.handleSubmit();
			}
		},
		handleSubmit: function() {
			var nameCopy = JSON.parse(JSON.stringify(this.newName));
			this.$emit('override-added', nameCopy);

			this.clearName();
			this.$refs.newOverrideModal.hide();

			this.selectOverride(nameCopy);
		}
	}
});

Vue.component('online-friend', {
	template: `
        <div class="mixerFriend">
            <div class="friendPreview" @mouseover="hover = true" @mouseleave="hover = false">
                <a v-bind:href="channelLink" target="_blank" class="friendLink" v-bind:title="channelTitle">
                    <div class="thumbnail">
                        <img v-bind:src="channelImgUrl" v-show="hover === false">
                        <video autoplay="" loop="" preload="none" v-show="hover === true">
                            <source type="video/mp4" v-bind:src="channelVidUrl">
                        </video>
                        <div class="friend-header">
                            <span class="friendName">{{friend.token}}</span>
                            <span class="friendViewers"><i class="fa fa-eye" aria-hidden="true"></i>{{friend.viewersCurrent}}</span>
						</div>
						<div class="friend-icons">
							<i v-if="friend.interactive" class="material-icons">videogame_asset</i>
							<i v-if="friend.costreamId" class="material-icons">group</i>
						</div>
                    </div>
                    <div class="info-container">
                        <div class="friendGame">{{friend.type.name}}</div>
                        <div class="friendTitle">{{friend.name}}</div>
                    </div>
                </a>
            </div>
        </div>
	`,
	props: ['friend'],
	data: function() {
		return {
			hover: false
		};
	},
	computed: {
		channelImgUrl: function() {
			return `https://thumbs.mixer.com/channel/${this.friend.id}.small.jpg`;
		},
		channelVidUrl: function() {
			return `https://thumbs.mixer.com/channel/${this.friend.id}.m4v`;
		},
		channelLink: function(){
			return `https://mixer.com/${this.friend.token}`;
		},
		channelTitle: function(){
			return `${this.friend.name}`;
		}
	}
});


/*
	VUE APP
*/

var settingsStorage = {
	fetch: function() {
		return new Promise((resolve) => {
			var defaults = settingsStorage.getDefaultOptions();

			console.log('defaults');
			console.log(defaults);
			
			chrome.storage.sync.get({
				'streamerPageOptions': defaults.streamerPageOptions,
				'homePageOptions': defaults.homePageOptions
			}, function(data) {
				console.log('got settings');
				resolve(data);
			});
		});
	},
	save: function(settings) {
		chrome.storage.sync.set(settings, () => {
			settingsStorage.emitEvent();
		});
	},
	saveStreamerPageOptions: function(options) {
		settingsStorage.save({
			'streamerPageOptions': options
		});
	},
	saveHomePageOptions: function(options) {
		settingsStorage.save({
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
					showImageLinksInline: false,
					autoForwardOnHost: false   
				},
				overrides: {}
			},
			homePageOptions: {
				removeFeatured: false
			}
		};
	},
	emitEvent: function() {
		// let the content script on whatever tab know the settings have been updated
		chrome.tabs.query({}, function(tabs) {
			var message = { settingsUpdated: true };
			for (var i = 0; i < tabs.length; ++i) {
				chrome.tabs.sendMessage(tabs[i].id, message);
			}
		});
	}
};

var onlineMixerFriends = {
	getMixerId: function() {
		// This gets a channel id using a mixer username.
		return new Promise(function(resolve, reject) {

			var request = new XMLHttpRequest();
			request.open('GET', 'https://mixer.com/api/v1/users/current', true);

			request.onload = function() {
				if (request.status >= 200 && request.status < 400) {
					// Success!
					var data = JSON.parse(request.responseText);
					resolve(data.id);
				} else {
					// We reached our target server, but it returned an error
					reject('Login at Mixer.com to see your online friends.');
				}
			};

			request.onerror = function() {
				// There was a connection error of some sort
				reject('Error getting userId');
			};

			request.send();
		});
	},
	getMixerFollows: function(userId, page, followList){
		// This will get all online followed channels and put them in an array.
		console.log('Trying page '+page+' of follows for userId '+userId);
		return new Promise(function(resolve, reject) {
			var request = new XMLHttpRequest();
			request.open('GET', 'https://mixer.com/api/v1/users/'+userId+'/follows?fields=id,online,name,token,viewersCurrent,partnered,costreamId,interactive,type&where=online:eq:true&order=viewersCurrent:desc&limit=50&page='+page, true);

			request.onload = function() {
				if (request.status >= 200 && request.status < 400) {
					// Success!
					var data = JSON.parse(request.responseText);

					// Loop through data and throw in array.
					for (friend of data){
						followList.push(friend);
					}
					
					// If we hit 50 friends, cycle again because we've run out of friends on this api call.
					if(data.length === 50){
						var page = page + 1;
						onlineMixerFriends.getMixerFollows(userId, page, followList);
					} else {
						resolve(followList);
					}

				} else {
					// We reached our target server, but it returned an error
					reject('Error getting followed channels.');
				}
			};

			request.onerror = function() {
				// There was a connection error of some sort
				reject('Error while getting followed channels.');
			};

			request.send();
		});
	},
	outputMixerFollows: function(){
		// This combines two functions so that we can get a full list of online followed channels with a username.
		return new Promise((resolve, reject) => {
			onlineMixerFriends.getMixerId()
				.then((userId) =>{
					onlineMixerFriends.getMixerFollows(userId, 0, [])
						.then((friends) => {
							resolve(friends);
						});
				});
		});
	},
	friendsError: function(err){
		// This runs when the user is not logged into mixer.

	}
};

var app = new Vue({
	el: '#app',
	data: {
		autoCloseInteractive: false,
		separateChat: false,
		alternateChatBGColor: false,
		showImageLinksInline: false,
		autoForwardOnHost: false,
		removeFeatured: false,
		activeTab: 'online',
		friends: [],
		streamerOverrides: {}
	},
	computed: {
		settings: {
			get: function() {
				return {
					homepage: {
						removeFeatured: this.removeFeatured
					},
					streamerPage: {
						defaults: this.globalStreamerSettings, 
						overrides: this.streamerOverrides					
					}								
				};
			}, 
			set: function(settings) {
				if(settings.streamerPage) {

					var defaults = settings.streamerPage.defaults;
					this.autoCloseInteractive = defaults.autoCloseInteractive === true;
					this.separateChat = defaults.separateChat === true;
					this.alternateChatBGColor = defaults.alternateChatBGColor === true;
					this.showImageLinksInline = defaults.showImageLinksInline === true;
					this.autoForwardOnHost = defaults.autoForwardOnHost === true;
                    
					var overrides = settings.streamerPage.overrides;
					this.streamerOverrides = overrides ? overrides : {};
				}
                
				if(settings.homepage) {
					var homepage = settings.homepage;
					this.removeFeatured = homepage.removeFeatured === true;
				}		
			}		
		},
		globalStreamerSettings: function() {
			return {
				autoCloseInteractive: this.autoCloseInteractive,
				separateChat: this.separateChat,
				alternateChatBGColor: this.alternateChatBGColor,
				showImageLinksInline: this.showImageLinksInline,
				autoForwardOnHost: this.autoForwardOnHost                      
			};
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
			console.log('tab changed: ' + tab);
			this.activeTab = tab;
		},
		fetchFriends: function() {
			console.log('getting friends');
			onlineMixerFriends.outputMixerFollows()
				.then((res) => {
					this.friends = res;
				})
				.catch((err) => {
					onlineMixerFriends.friendsError(err);
				});
		}
	},
	mounted: function() {
		// When Vue is ready
		this.fetchFriends();
	}
});
