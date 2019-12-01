import state from '../../../../state';
import $ from '../../../../util/jquery';

import { waitForElement } from '../../../../util/wait-for';

let infoPanel = $(`
        <div id="elixr-infopanel">
            <div id="elixr-infopanel-username"></div>
            <div class="elixr-infopanel-data">
                <div id="elixr-infopanel-level"></div>
                <div>
                    <img aria-label="spark" class="spark-coin" style="height: 14px;vertical-align: text-top;" src="_static/img/design/ui/spark-coin/spark-coin.svg">
                </div>     
                <div id="elixr-infopanel-sparks"></div>
            </div>
        </div>
    `),
    ipUsername = infoPanel.find('#elixr-infopanel-username'),
    ipLevel = infoPanel.find('#elixr-infopanel-level'),
    ipSparks = infoPanel.find('#elixr-infopanel-sparks');

function togglePanel() {
    let user = state.user.cached(),
        settings = state.settings.cached(),
        show = user != null && settings.sitewide.navbar.infoPanel;

    $(document.body).attr('data-elixr-showInfoPanel', show);
}

function updatePanel(user) {
    if (user == null) {
        togglePanel();
        ipUsername.text('');
        ipLevel.text('0');
        ipSparks.text('0');

    } else {
        if (user.username) {
            ipUsername.text(user.username);
        }
        ipLevel.text(user.level);
        ipSparks.text(user.sparks);
        togglePanel();
    }
}

// Wait for settings, user, and element to load
Promise.all(
    state.settings(),
    state.user(),
    waitForElement('b-nav-host [class*="right_"] [class^="chevron_"]')
).then(results => {

    // Insert info panel before the account button
    infoPanel.insertBefore(
        $('b-nav-host')
            .find('[class*="right_"]')
            .children()
            .last()
    );

    // Update panel based on current user
    updatePanel(results[1]);

    // Toggle panel based on settings settings change
    window.addEventListener('MixrElixr:settings:updated', togglePanel);

    // Update panel when the user login state changes
    window.addEventListener('MixrElixr:current-user:changed', data => {
        updatePanel(data.details);
    });

    // Update info panel when the user's sparks or level changes
    window.addEventListener('MixrElixr:current-user:update', data => {
        updatePanel(data.details);
    });
});