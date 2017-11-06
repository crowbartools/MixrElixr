Vue.component('online-friends-list', {
	template: `
	<div>
		<div v-if="!loadingMixerUser && mixerUserFound"">

			<div class="online-type-title">Favorites <b-badge style="background-color:#0faf27;">{{favorites.length}}</b-badge></div>
			<div class="muted online-list-message" v-if="!loadingMixerUser && mixerUserFound && favorites.length === 0 && savedFavoritesList.length !== 0">
				No one is currently streaming :(
			</div>
			<div class="muted online-list-message" v-if="!loadingMixerUser && mixerUserFound && savedFavoritesList.length === 0">
				No favorites set. Click the <i class="fa fa-star-o" aria-hidden="true"></i> on a streamer to add your first one!
			</div>
			<div class="online-friends-wrap" style="margin-bottom: 15px;">
				<online-friend	v-for="friend in favorites" :friend="friend" :favorite="true" @remove-favorite="favoriteRemoved"></online-friend>
			</div>

			<div class="online-type-title">Following <b-badge style="background-color:#18ABE9;">{{friends.length}}</b-badge></div>
			<div class="muted online-list-message" v-if="!loadingMixerUser && mixerUserFound && friends.length === 0">
				No one is currently streaming :(
			</div>
			<div class="online-friends-wrap">
				<online-friend	v-for="friend in friendsShown" :friend="friend" :favorite="false" @add-favorite="favoriteAdded"></online-friend>
			</div>

		</div>	
		<div v-if="!loadingMixerUser && !mixerUserFound">
			To view your online friends go to <a href="https://mixer.com" target="_blank">Mixer.com</a> and log in.
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
			savedFavoritesList: [],
			loadingMixerUser: true,
			mixerUserFound: false,
			showBadge: true
		};
	},
	methods: {
		addMoreFriendsToView: function(){
			// This grabs the next 10 friends and shows them.
			var size = 10;
			var friends = this.friends;
			var friendsShown = this.friendsShown;
			var friendsEnd = friendsShown.length + size;

			var newFriends = friends.slice( friendsShown.length, friendsEnd);
			for(let person in newFriends){
				friendsShown.push( newFriends[person]);
			}
		},
		updateIconBadge: function() {
			var text = '', color = '#18ABE9';
			var friends = this.friends, favorites = this.favorites;
			if(this.showBadge && friends != null && favorites != null) {
				let onlineCount = friends.length + favorites.length;
				if(onlineCount > 0) {
					text = onlineCount.toString();
				}
				if(favorites.length > 0) {
					color = '#0faf27';
				}
			}
			chrome.browserAction.setBadgeText({text: text});
			chrome.browserAction.setBadgeBackgroundColor({ color: color});
		},
		loadFriends: function() {
			var app = this;
			return new Promise((resolve,reject) => {
				let getSettings = app.fetchSettings();
				let getFriends = app.outputMixerFollows();
		
				Promise.all([getSettings, getFriends]).then(values => {
					let favoriteFriends = values[0].generalOptions.favoriteFriends;

					app.savedFavoritesList = favoriteFriends;

					app.showBadge = values[0].generalOptions.showBadge;
		
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
				}, () => { reject(); });
			});
		},
		findMixerId: function() {
			return this.getMixerId();
		},
		favoriteAdded: function(name) {
			this.updateFavorite(name, true, true);
		},
		favoriteRemoved: function(name) {
			this.updateFavorite(name, false, true);
		},
		updateFavorite: function(name, isAdd, shouldSave) {
			var app = this;
			if(isAdd) {
				app.savedFavoritesList = app.savedFavoritesList.concat([name]);

				let friendFind = app.friends.filter(f => f.token === name);
				if(friendFind != null && friendFind.length > 0) {
					let friend = friendFind[0];
					app.favorites = app.favorites.concat([friend]).sort((a, b) => b.viewersCurrent - a.viewersCurrent);
					app.friends = app.friends.filter(f => f.id != friend.id);

					//reset friends shown array
					app.friendsShown = [];
					app.addMoreFriendsToView();
				}				
			} else {
				app.savedFavoritesList = app.savedFavoritesList.filter(n => n !== name);

				let friendFind = app.favorites.filter(f => f.token === name);
				if(friendFind != null && friendFind.length > 0) {
					let friend = friendFind[0];
					app.friends = app.friends.concat([friend]).sort((a, b) => b.viewersCurrent - a.viewersCurrent);
					app.favorites = app.favorites.filter(f => f.id != friend.id);

					//reset friends shown array
					app.friendsShown = [];
					app.addMoreFriendsToView();
				}
			}
			

			app.updateIconBadge();

			if(shouldSave) {
				app.saveGeneralOptions({
					favoriteFriends: app.savedFavoritesList
				});
				bus.$emit('favorites-updated', app.savedFavoritesList);
			}
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

		bus.$on('remove-favorite', function(name) {
			app.updateFavorite(name, false, false);
		});

		bus.$on('add-favorite', function(name) {
			app.updateFavorite(name, true, false);
		});

		bus.$on('badge-change', function(showBadge) {
			app.showBadge = showBadge;
			app.updateIconBadge();
		});
	}
});