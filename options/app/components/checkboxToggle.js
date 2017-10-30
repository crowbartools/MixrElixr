Vue.component('checkbox-toggle', {
	template: `
		<label style="display:flex">
			<label class="switch">
				<input type="checkbox" v-model.lazy="value" @change="valueUpdated"/>
				<span class="slider"></span>
			</label>
			{{label}} <option-tooltip v-if="tooltip != null" :name="tooltipName" :title="tooltip" :type="tooltipType"></option-tooltip>
		</label>
	`,
	props: ['value', 'label', 'tooltip', 'tooltipType'],
	methods: {
		valueUpdated: function() {
			this.$emit('update:value', this.value);
			this.$emit('changed');
		}
	},
	computed: {
		tooltipName: function() {
			return this.label.replace(" ", "-").toLowerCase();
		}
	}
});