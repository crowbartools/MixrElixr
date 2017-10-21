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
    fetch: function(defaultSettings) {
        return new Promise((resolve) => {
            chrome.storage.sync.get({
                'settings': defaultSettings
            }, function(data) {
                resolve(data);
            });
        });
    },
    save: function(settings) {
        chrome.storage.sync.set({ 'settings': settings }, () => {
            settingsStorage.emitEvent();
        });
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
            request.open('GET', 'https://mixer.com/api/v1/users/'+userId+'/follows?fields=id,online,name,token,viewersCurrent,partnered,type&where=online:eq:true&order=viewersCurrent:desc&limit=50&page='+page, true);

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
        removeHomepageFeatured: false,
        activeTab: 'online',
        friends: []
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
                };
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
                })
        }
    },
    mounted: function() {
        // When Vue is ready
        this.fetchSettings();
        this.fetchFriends();
    }
});
