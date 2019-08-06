Vue.component('streamer-override-dropdown', {
	template: `
        <span>
            <b-dropdown id="ddown1" v-bind:text="selected" variant="link" right class="m-md-2 white-link">
                <b-dropdown-item  @click="selectOverride('Global')">Global</b-dropdown-item>
                <b-dropdown-header id="header1">Streamer Overrides</b-dropdown-header>
				<b-dropdown-item aria-describedby="header1" v-for="name in overrideNames" @click="selectOverride(name)">{{name}}</b-dropdown-item>
				<b-dropdown-item v-if="overrideNames.length === 0" disabled>None</b-dropdown-item>
                <b-dropdown-divider></b-dropdown-divider>
				<b-dropdown-item @click="showModal">+ Add Streamer</b-dropdown-item>
				<b-dropdown-item @click="deleteOverride" v-if="selected !== 'Global'" style="color: red"><i class="fa fa-trash"></i> Delete {{selected}}</b-dropdown-item>
            </b-dropdown>
            <b-modal id="newOverrideModal"
					ref="newOverrideModal"
					size="sm"
					title="Enter Streamer Name"
					header-bg-variant="dark"
					header-text-variant="light"
					body-bg-variant="dark"
					body-text-variant="light"
					footer-bg-variant="dark"
					footer-text-variant="light"
                    @ok="handleOk"
                    @shown="clearName">
                <b-form-input type="text"
                            placeholder="Name"
                            v-model="newName" ref="nameInput" @keyup.native.enter="handleOk"></b-form-input>
                <span v-if="newNameError" style="color:red; margin-top: 10px;">Please enter a name!</span>
            </b-modal>
        </span>   
	`,
	mixins: [scriptCommunication],
	props: ['overrideNames', 'selected'],
	data: function() {
		return {
			newName: '',
			newNameError: false,
			selectedName: this.selected
		};
	},
	methods: {
		selectOverride: function(name) {
			this.$emit('override-selected', name);
		},
		clearName: function() {
			var app = this;

			app.newName = '';
			
			app.getCurrentStreamerNameInOpenTab().then((name) => {
				if(name != null) {
					// search for a matching override case insensitive
					var match = this.overrideNames.filter((o) => {
						return o.toLowerCase() === name.toLowerCase();
					});
		
					if(match.length < 1) {
						app.newName = name;
					}
				}
			});

			app.$refs.nameInput.focus();
		},
		deleteOverride: function() {
			this.$emit('override-deleted', this.selected);
		},
		showModal: function() {
			this.$refs.newOverrideModal.show();
		},
		handleOk: function(evt) {
			// Prevent modal from closing
			evt.preventDefault();
			if (!this.newName || this.newName.toLowerCase() === 'global') {
				this.newNameError = true;
			} else {
				this.handleSubmit();
			}
		},
		handleSubmit: function() {
			var nameCopy = JSON.parse(JSON.stringify(this.newName));
			this.$emit('override-added', nameCopy);

			this.clearName();
			this.$refs.newOverrideModal.hide();

			this.selectOverride(nameCopy);
		}
	}
});