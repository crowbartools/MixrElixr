import state from '../state/';
import './areas/';
import './channel/';

import { constellation } from '../mixer/';

// start constellation connection for current user
constellation.start();

// when user updates, restart constellation
window.addEventListener('MixrElixr:current-user:changed', function () {
    constellation.stop();
    constellation.start();
});

state
    .settings()
    .then(settings => {

        // apply theme
        let theme = settings.sitewide.theme;
        if (theme != null && theme !== 'default') {
            document.body.setAttribute('data-elixr-theme', theme);
        }

        // listen for settings to change and apply theme
        window.addEventListener('MixrElixr:settings:changed', () => {
            let theme = state.settings.cached().sitewide.theme;
            if (theme == null || theme === 'default') {
                document.body.removeAttribute('data-elixr-theme');
            } else {
                document.body.setAttribute('data-elixr-theme', theme);
            }
        });
    });
