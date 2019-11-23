import $ from '../../plugins/jquery-wrapper.js';
import { scrollChatIfGlued } from '../../utils/index.js';

let showModActions = true;
export function setup(options) {
    showModActions = options.showModActions !== false;
    if (showModActions) {
        $('.elixr-deleted-action').show();
        $('.elixr-mod-action-wrapper').show();
    } else {
        $('.elixr-deleted-action').hide();
        $('.elixr-mod-action-wrapper').hide();
    }
}

export function messagedDeleted(messageId, moderatorName) {
    if (!showModActions) return;

    let chatMessage = $(`[data-id='${messageId}']`).find("[class*='message_']");
    if (chatMessage == null || chatMessage.length < 1) return;

    //we already have a deleted message here... this shouldnt happen
    if (chatMessage.find('.elixr-deleted-action').length > 0) return;

    $(`
        <div class="elixr-deleted-action">
            <span class=" elixr-tooltip" title="MixrElixr: Deleted message mod action">(Deleted by ${moderatorName})</span>
        </div>
    `).appendTo(chatMessage);

    scrollChatIfGlued();
}

export function userBanned(username) {
    if (!showModActions) return;

    const chatContainer = $('[class*="scrollWrapper_"]');
    $(
        `<div class="elixr-mod-action-wrapper">
            <div class="elixr-mod-action-bubble elixr-tooltip" title="MixrElixr: Ban mod action">
                <span class="elixr-icon elixr-banned-icon"></span>
                <span><b>${username}</b> has been banned.</span>
            </div>
        </div>`
    ).appendTo(chatContainer);
}

export function userTimeout(username, modName) {
    if (!showModActions) return;

    const chatContainer = $('[class*="scrollWrapper_"]');
    $(
        `<div class="elixr-mod-action-wrapper" >
            <div class="elixr-mod-action-bubble elixr-tooltip" title="MixrElixr: Timeout mod action">
                <span class="elixr-icon elixr-timeout-icon"></span>
                <span><b>${username}</b> has been timed out by <b>${modName}</b>.</span>
            </div>
        </div>`
    ).appendTo(chatContainer);
}
