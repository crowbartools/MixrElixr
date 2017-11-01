Vue.component('option-tooltip', {
	template: `
		<span>
			<i :id="name" class="fa e-tooltip" :class="iconType"></i>
			<b-tooltip :target="name" :title="title" :placement="placement" :triggers="triggers" no-fade="true"></b-tooltip>
		</span>
	`,
	props: ['name', 'title', 'placement', 'triggers', 'type'],
	computed: {
		iconType: function() {
			return this.type === 'warning' ? "fa-exclamation-circle" : "fa-question-circle";
		}
	}
});