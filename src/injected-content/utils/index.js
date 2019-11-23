import $ from '../../plugins/jquery-wrapper.js';
import * as simulant from 'simulant';

// moved but left to keep the lint-man happy
export function log(...message) {
    console.log('[MixrElixr]', ...message);
}


export function determineMessageType(message) {

    if (message.find("div[class*='sticker_']").length > 0) {
        return 'sticker';
    }

    if (message.find("img[class*='skillIcon_']").length > 0) {
        return 'skill-used';
    }

    return 'regular-message';
}

export function updateChatTextfield(newString) {
    let textAreaElement = $('#chat-input').children('textarea');

    simulant.fire(textAreaElement[0], simulant('focus'));
    textAreaElement.val(newString);
    simulant.fire(textAreaElement[0], simulant('input'));
    simulant.fire(textAreaElement[0], simulant('change'));
    simulant.fire(textAreaElement[0], simulant('blur'));
}

export function scrollChatToBottom() {
    let chatContainer = $('.elixr-chat-container');
    if (chatContainer == null || chatContainer.length < 1) return;
    chatContainer.scrollTop(chatContainer[0].scrollHeight);
    log('Scrolling to bottom!');
}

let chatScrollGlued = true;
export function scrollChatIfGlued() {
    if (chatScrollGlued) {
        scrollChatToBottom();
    }
}

export function setupScrollGlueCheck() {
    let updateScrollGlue = debounce(function() {
        let chatContainer = $('.elixr-chat-container');

        let current = chatContainer.scrollTop();
        let height = chatContainer[0].scrollHeight - chatContainer.height();
        let percent = (current / height) * 100;

        let minimumPercent = 99;

        if (percent >= minimumPercent) {
            chatScrollGlued = true;
        } else {
            chatScrollGlued = false;
        }
    }, 100);

    $('.elixr-chat-container').off('scroll', updateScrollGlue);
    $('.elixr-chat-container').on('scroll', updateScrollGlue);
}

// when viewing a channel thats hosting another channel, this will return the name of the channel that
// the chat feed is set to
export function getCurrentChatChannelName() {
    let chatChannelName = null;
    let chatTabs = $('b-channel-chat-tabs');
    if (chatTabs != null && chatTabs.length > 0) {
        let selectedTab = chatTabs.find('.selected');
        if (selectedTab != null && selectedTab.length > 0) {
            chatChannelName = selectedTab.text().trim();
        }
    }
    return chatChannelName;
}
