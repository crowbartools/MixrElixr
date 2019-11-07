<template>
    <div class="settings-section">
        <div class="settings-section-header">
            <span class="title">Sitewide</span>
        </div>
        <div class="settings-section-settings" style="padding-bottom: 0;">
            <div class="option-wrapper">
                <span class="setting-subcategory" style="margin: 0;">Mixer Theme</span>
                <b-form-select v-model="theme" :options="themes" class="mb-3 option"></b-form-select>

                <checkbox-toggle
                    :value.sync="declutterTopBar"
                    @changed="saveSettings()"
                    label="Declutter The Top Navbar"
                    tooltip="Condense nav links, simplify other buttons"
                ></checkbox-toggle>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    mixins: [settingsStorage, friendFetcher],
    data() {
        let dataObj = {
            themes: [
                {
                    value: 'default',
                    text: 'Default'
                },
                {
                    value: 'elixr-dark',
                    text: 'Dark'
                },
                {
                    value: 'elixr-obsidian',
                    text: 'Obsidian'
                }
            ]
        };

        // apply our defaults
        let defaults = this.getDefaultOptions().generalOptions;

        // fill out our model
        Object.keys(defaults).forEach(k => {
            dataObj[k] = defaults[k];
        });

        return dataObj;
    },
    watch: {
        theme: function() {
            this.saveSettings();
        }
    },
    methods: {
        saveSettings: function() {
            const model = this.getModel();
            this.saveGeneralOptions(model);
        },
        loadSettings: function() {
            const app = this;
            this.fetchSettings().then(data => {
                app.setModel(data.generalOptions);
            });
        },
        setModel: function(options) {
            const app = this;
            Object.keys(options).forEach(k => {
                app[k] = options[k];
            });
        },
        getModel: function() {
            const app = this;

            const builtModel = {};
            const options = this.getDefaultOptions().generalOptions;

            Object.keys(options).forEach(k => {
                builtModel[k] = app[k];
            });

            return builtModel;
        }
    },
    mounted: function() {
        const app = this;

        app.loadSettings();
    }
};
</script>
