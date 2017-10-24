Vue.component('online-friend', {
	template: `
        <div class="mixerFriend">
            <div class="friendPreview" @mouseover="hover = true" @mouseleave="hover = false">
                <a v-bind:href="channelLink" target="_blank" class="friendLink">
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
							<i v-if="friend.interactive" class="fa fa-gamepad" title="Interactive"></i>
							<i v-if="friend.costreamId" class="fa fa-users" title="Costream"></i>
						</div>
                    </div>
					<div class="info-container">
						<div class="friendTitle" :title="channelTitle">{{friend.name}}</div>
                        <div class="friendGame">{{friend.type.name}}</div>                       
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