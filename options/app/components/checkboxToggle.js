Vue.component('checkbox-toggle', {
	template: `
		<label style="display:flex">
			<label class="switch">
				<input type="checkbox" v-model.lazy="value" @change="valueUpdated"/>
				<span class="slider"></span>
			</label>
			{{label}}
		</label>
	`,
	props: ['value', 'label'],
	methods: {
		valueUpdated: function() {
			this.$emit('update:value', this.value);
			this.$emit('changed');
		}
	}
});