Vue.component('edittable-list', {
	template: `
		<div>
			<multiselect v-model="value" 
						 :tag-placeholder="tagPlaceholder" 
						 :placeholder="placeholder"
						 :options="options" 
						 :multiple="true" 
						 :taggable="true"
						 @tag="addEntry"
						 @select="addEntry"
						 @remove="modelUpdated"
						 :block-keys="['Delete']"></multiselect>
		</div>
	`,
	props: ['value', 'options', 'tagPlaceholder', 'placeholder'],
	data: function() {
		return {
			viewers: [],
			blockedKeys: ['Delete']
		};
	},
	methods: {
		addEntry: function(entry) {
			if(this.value.includes(entry)) return;
			this.value.push(entry);
			this.modelUpdated();
		},
		removeEntry: function(entry) {
			this.value = this.value.filter(e => e != entry);
			this.modelUpdated();
		},
		modelUpdated: function() {
			this.$emit('update:value', this.value);
			this.$emit('changed');
		}
	}
});