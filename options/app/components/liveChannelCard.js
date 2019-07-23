Vue.component('live-channel-card', {
	template: `
		<div class="me-card">
		
			<a v-bind:href="channelLink" target="_blank">

				<span class="sr-only">{{friend.token}}</span>
				<span class="sr-only"> streaming {{channelGame}}</span>
				<span class="sr-only">{{friend.viewersCurrent}} viewers </span>

				<div aria-hidden="true" class="thumbnail">
					<img v-bind:src="channelImgUrl" @error="channelImgFail">
					<div class="liveAndViewers">
						<div class="viewersBadge">
							<i class="fa fa-eye" aria-hidden="true" style="margin-right:5px;"></i>{{friend.viewersCurrent}} 
						</div>
					</div>
				</div>

				<div aria-hidden="true" class="footer">
					<div class="channel-avatar" size="52" style="width: 52px; height: 52px;">
						<img alt="Channel Badge" v-bind:src="channelAvatarUrl" style="width: 52px; height: 52px;">
					</div>
					<div class="titles">
						<h2>
							<div class="truncated-text">
								<div class="wrapper" aria-label="{{channelTitle}}"> {{channelTitle}} </div>
							</div>
						</h2>
						<small> {{friend.token}} </small>
						<small>
							<div class="truncated-text">
								<div class="wrapper" aria-label="{{channelGame}}"> {{channelGame}} </div>
							</div>
						</small>
					</div>
				</div>

			</a>
        </div>
	`,
	props: ['friend', 'favorite'],
	data: function() {
		return {
			hover: false,
			videoReady: false
		};
	},
	computed: {
		channelImgUrl: function() {
			return `https://thumbs.mixer.com/channel/${this.friend.id}.small.jpg`;
		},
		channelVidUrl: function() {
			return `https://thumbs.mixer.com/channel/${this.friend.id}.m4v`;
		},
		channelAvatarUrl: function() {
			return `https://mixer.com/api/v1/users/${this.friend.user.id}/avatar?w=64&h=64`;
		},
		channelLink: function(){
			return `https://mixer.com/${this.friend.token}`;
		},
		channelTitle: function(){
			return this.friend.name;
		},
		channelGame: function(){
			if(this.friend.type == null) return '';
			return this.friend.type.name;
		}
	},
	methods: {
		addOrRemoveFavorite: function(event) {
			if(event) event.preventDefault();
			if(this.favorite) {
				this.$emit('remove-favorite', this.friend.token);
			} else {
				this.$emit('add-favorite', this.friend.token);
			}
		},
		channelImgFail: function(e) {
			console.log('FAILED', e);
			e.target.style.display='none';
		}
	}
});