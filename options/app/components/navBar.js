Vue.component('nav-bar', {
	template: `
		<nav class="navbar navbar-expand navbar-dark bg-dark">
			<a class="navbar-brand">
				<img src="/resources/images/elixr-light-128.png" width="30" height="30" alt="">
			</a>
			<div class="collapse navbar-collapse" id="navbarNav">
				<ul class="navbar-nav mr-auto">
					<li class="nav-item" class="clickable" :class="{active: onlineActive}" @click="changeTab('online')">
						<a class="nav-link">Who's Online <span class="badge badge-light" v-if="onlineCount > 0">{{onlineCount}}</span></a>
					</li>
					<li class="nav-item" class="clickable" :class="{active: optionsActive}" @click="changeTab('options')">
						<a class="nav-link">Options</a>
					</li>
				</ul>
				<ul class="navbar-nav flex-row">
					<li class="nav-item" class="clickable">
						<a class="nav-link" href="https://twitter.com/MixrElixr" target="_blank"><i class="fa fa-twitter" aria-hidden="true"></i></a>
					</li>
					<li class="nav-item" class="clickable">
						<a class="nav-link" href="https://github.com/ebiggz/MixrElixr" target="_blank"><i class="fa fa-github" aria-hidden="true"></i></a>
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