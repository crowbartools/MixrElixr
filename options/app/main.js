new Vue({
	el: '#app',
	mixins: [friendFetcher],
	data: {
		activeTab: 'online',
		friends: []
	},
	methods: {
		updateActiveTab: function(tab) {
			console.log('tab changed: ' + tab);
			this.activeTab = tab;
			var container = this.$el.querySelector(".tabs-wrapper");
			container.scrollTo(0, 0);
		},
		fetchFriends: function() {
			console.log('getting friends');
			var app = this;
			app.outputMixerFollows()
				.then((res) => {
					console.log(res);
					this.friends = res;
				})
				.catch((err) => {
					app.friendsError(err);
				});
		}
	},
	mounted: function() {
		// When Vue is ready
		this.fetchFriends();
	}
});
