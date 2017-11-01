Vue.component('inline-img-toggle', {
	template: `
		<span>
			<label style="display:flex">
				<label class="switch">
					<input type="checkbox" v-model.lazy="value" @change="toggleChanged"/>
					<span class="slider"></span>
				</label>
				Show Image Links Inline <option-tooltip v-if="value" name="inline-tt" :title="warningMsg" type="warning"></option-tooltip>
			</label>
			<b-modal id="inlineImgWarning"
					ref="inlineImgWarning"
					title="Warning"
					header-bg-variant="danger"
					header-text-variant="light"
					body-bg-variant="light"
					body-text-variant="dark"
					footer-bg-variant="light"
					footer-text-variant="dark"
					cancel-title="Nevermind"
					cancel-variant="link"
					ok-title="Confirm"
					@ok="handleConfirmation">
				<span>{{warningMsg}}</span>
				<br/><br/>
				<span>Don't worry though! If you use this feature, you can utilize the per-streamer options, user role permissions, and the user whitelist/blacklist to only show images from people you trust.</span>
				<br/><br/>
				<span>If you'd still like to use inline images, click <b>Confirm</b>.</span>
			</b-modal>
		</span>
	`,
	props: ['value'],
	data: function() {
		return {
			warningMsg: "Quick heads up: Malicious users could potentionally use inline images to capture your IP address. This is the same risk you take if you were to click a link and open it, but we just want to make sure you are aware before using inline images."
		}
	},
	watch: {
		value: function(newValue, oldValue) {
			//console.log(newValue);
		}
	},
	methods: {
		toggleChanged: function(newValue) {
			if(this.value) {
				this.value = false;
				this.$refs.inlineImgWarning.show();
			} else {
				this.valueUpdated();
			}
		},
		valueUpdated: function(val) {
			this.$emit('update:value', this.value);
			this.$emit('changed', this.value);
		},
		handleConfirmation: function() {
			this.value = true;
			this.valueUpdated();
		}
	}
});