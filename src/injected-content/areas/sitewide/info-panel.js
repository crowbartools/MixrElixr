import $ from '../../plugins/jquery-wrapper.js';
import { waitForElement } from '../../utils/wait-for.js';
let panelCreated = false;

function formatSparks(count) {
    if (!count == null) return 0;
    return count.toLocaleString();
}

export async function removeInfoPanel() {
    $('#elixr-info-panel').remove();
}

export async function createInfoPanel(user) {
    panelCreated = false;
    removeInfoPanel();

    if (user == null) {
        return;
    }

    await waitForElement('b-nav-host [class*="right_"] [class^="chevron_"]');

    const accountButton = $('b-nav-host')
        .find("[class*='right_']")
        .children()
        .last();

    $(`
        <div id="elixr-info-panel">
            <div id="elixr-username">${user.username}</div>
            <div class="elixr-info-data">
                <div id="elixr-user-level">LVL ${user.level}</div>
                <div>
                    <img aria-label="spark" class="spark-coin" style="height: 14px;vertical-align: text-top;" src="_static/img/design/ui/spark-coin/spark-coin.svg">
                </div>     
                <div id="elixr-user-sparks">${formatSparks(user.sparks)}</div>
            </div>
        </div>
    `).insertBefore(accountButton);

    panelCreated = true;
}

export function updateInfo(user) {
    if (!panelCreated || user == null) return;
    if (user.sparks) {
        $('#elixr-user-sparks').text(formatSparks(user.sparks));
    }
    if (user.level) {
        $('#elixr-user-level').text(`LVL ${user.level}`);
    }
}
