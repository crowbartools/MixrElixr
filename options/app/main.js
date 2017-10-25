new Vue({
	el: '#app',
	mixins: [friendFetcher],
	data: {
		activeTab: 'online',
		friends: [],
		friendsShown: []
	},
	methods: {
		updateActiveTab: function(tab) {
			console.log('tab changed: ' + tab);
			this.activeTab = tab;
			var container = this.$el.querySelector(".tabs-wrapper");
			container.scrollTo(0, 0);
		},
		fetchFriends: function() {
			console.log('Making some friends...');
			return new Promise((resolve, reject) => {
				var app = this;
				app.outputMixerFollows()
					.then((res) => {
						console.log(res);
						this.friends = res;
						resolve(true);
					})
					.catch((err) => {
						app.friendsError(err);
						reject(false);
					});
			});
		},
		friendPost: function(){
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
		friendScroller: function(){
			// If we scroll 80% through our current friends, add some more.
			if(this.activeTab == "online"){
				var obj = this.$el.querySelector('.tabs-wrapper');
				var percent = (obj.scrollHeight - obj.offsetHeight) * .8;
				if( obj.scrollTop >= percent ){
					console.log('We found more friends!');
					this.friendPost();
				}
			}
		}
	},
	mounted: function() {
		// When Vue is ready
		this.fetchFriends()
			.then((res) =>{
				this.friendPost();
			})
	}
});
