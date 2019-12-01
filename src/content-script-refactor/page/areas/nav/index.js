import state from '../../../state/';
import $ from '../../../util/jquery/';

import { waitForElement } from '../../../util/wait-for/';

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
    ipSparks = infoPanel.find('#elixr-infopanel-sparks'),
    acctButton;

function togglePanel() {
    let user = state.user.cached(),
        settings = state.settings.cached(),
        show = user != null && settings.sitewide.navbar.infoPanel;

    $(document.body).attr('data-elixr-showInfoPanel', show);
}

function updatePanel(user) {
    if (!user) {
        ipUsername.text('');
        ipLevel.text('0');
        ipSparks.text('0');
        $(document.body).attr('data-elixr-showInfoPanel', 'false');
    } else {
        if (user.username) {
            ipUsername.text(user.username);
        }
        ipLevel.text(user.level);
        ipSparks.text(user.sparks);
    }
    togglePanel();
}


Promise.all(
    state.settings(),
    state.user(),
    waitForElement('b-nav-host [class*="right_"] [class^="chevron_"]')
).then(results => {
    let user = results[1];

    acctButton = $('b-nav-host')
        .find('[class*="right_"]')
        .children()
        .last();

    infoPanel.insertBefore(acctButton);

    updatePanel(user);

    // only show the info panel if user is logged in and settings dictate the info panel should be shown
    window.addEventListener('MixrElixr:state:settings-updated', togglePanel);

    // update info panel on user changed
    window.addEventListener('MixrElixr:current-user:changed', data => {
        updatePanel(data.details);
    });

    // update info panel when the user's sparks or level changes
    window.addEventListener('MixrElixr:current-user:update', data => {
        updatePanel(data.details);
    });
});