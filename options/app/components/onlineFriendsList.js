Vue.component('online-friends-list', {
	template: `
	<div>
		<div v-if="!loadingMixerUser">
			<div class="online-type-title">Favorites <b-badge>{{favorites.length}}</b-badge></div>
			<div class="online-friends-wrap" style="margin-bottom: 15px;">
				<online-friend	v-for="friend in favorites" :friend="friend" :favorite="true"></online-friend>
			</div>
			<div class="online-type-title">Following <b-badge>{{friends.length}}</b-badge></div>
			<div class="online-friends-wrap">
				<online-friend	v-for="friend in friendsShown" :friend="friend" :favorite="false"></online-friend>
			</div>
		</div>	
		<div v-if="!loadingMixerUser && !mixerUserFound">
			To view your online friends go to <a href="https://mixer.com" target="_blank">Mixer.com</a> and log in.
		</div>
		<div class="muted" v-if="!loadingMixerUser && mixerUserFound && friends.length === 0">
			No one is currently streaming.
		</div>
		<div class="muted" v-if="loadingMixerUser">
			Loading online friends...
		</div>
	</div>	
	`,
	props: ['active'],	
	mixins: [settingsStorage, friendFetcher],
	data: function() {
		return {
			favorites: [],			
			friends: [],
			friendsShown: [],
			loadingMixerUser: true,
			mixerUserFound: false
		}
	},
	methods: {
		addMoreFriendsToView: function(){
			// This grabs the next 10 friends and shows them.
			var size = 10;
			var friends = this.friends;
			var friendsShown = this.friendsShown;
			var friendsEnd = friendsShown.length + size;

			var newFriends = friends.slice( friendsShown.length, friendsEnd);
			for(person in newFriends){
				friendsShown.push( newFriends[person] );
			}
		},
		updateIconBadge: function() {
			var text = '', color = '#18ABE9';
			var friends = this.friends, favorites = this.favorites;
			if(friends != null && favorites != null) {
				let onlineCount = friends.length + favorites.length;
				if(onlineCount > 0) {
					text = onlineCount.toString();
				}
				if(favorites.length > 0) {
					color = '#0faf27';
				}
			}
			chrome.browserAction.setBadgeText({text: text});
			chrome.browserAction.setBadgeBackgroundColor({ color: color})
		},
		loadFriends: function() {
			var app = this;
			return new Promise((resolve,reject) => {
				let getSettings = app.fetchSettings();
				let getFriends = app.outputMixerFollows();
		
				Promise.all([getSettings, getFriends]).then(values => {
					let favoriteFriends = values[0].generalOptions.favoriteFriends;
		
					let onlineFriends = values[1];
		
					//seperate favorites and non favorites
					let favoritesOnly = [], followingOnly = [];
					onlineFriends.forEach(f => {
						if(favoriteFriends.includes(f.token)) {
							favoritesOnly.push(f);
						} else {
							followingOnly.push(f);
						}
					});
		
					app.favorites = favoritesOnly;
					app.friends = followingOnly;
	
					app.friendsShown = [];
					app.addMoreFriendsToView();
					app.updateIconBadge();	

					resolve();
				}, () => { reject() });
			});
		},
		findMixerId: function() {
			return this.getMixerId();
		}
	},
	mounted: function() {
		var app = this;
		// When Vue is ready
		app.getMixerId().then(
			() => {
				//id found
				app.mixerUserFound = true;
			},
			() => {
				//no current user
				app.mixerUserFound = false;
			});

		app.loadFriends()
			.then(() =>{}, () => {})
			.then(() => {
				app.loadingMixerUser = false;
			});
	},
	created: function() {
		var app = this;
		bus.$on('friends-scrolled', function() {
			console.log('We found more friends!');
			app.addMoreFriendsToView();
		});

		bus.$on('favorites-updated', function() {
			console.log('New faves!');
			app.loadingMixerUser = true;

			app.loadFriends()
				.then(() =>{}, () => {})
				.then(() => {
					app.loadingMixerUser = false;
				});
		});
	}
});