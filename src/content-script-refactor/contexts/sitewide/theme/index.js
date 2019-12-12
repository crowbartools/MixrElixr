import $ from '../../../utils/';

function toggleTheme(evt) {
    let settings = evt.details.settings;

    if (!settings || !settings.sitewide || !settings.sitewide.theme || settings.sitewide.theme === 'default') {
        $(document.body).removeAttr('data-elixr-theme');
    } else {
        $(document.body).attributes('data-elixr-theme', settings.stiewide.theme);
    }
}

window.addEventListener('MixrElixr:load:dom', toggleTheme);
window.addEventListener('MixerElixr:state:settings-changed', toggleTheme);