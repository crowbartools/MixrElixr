Vue.component('global-emotes-toggle', {
	template: `
		<span>
			<checkbox-toggle :value.sync="value" @changed="valueUpdated()" label="Show Global MixrElixr Emotes"></checkbox-toggle>
		</span>
	`,
	props: ['value'],
	methods: {
		valueUpdated: function() {
			this.$emit('update:value', this.value);
			this.$emit('changed', this.value);
		}
	}
});