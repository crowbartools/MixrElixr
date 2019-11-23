import Vue from 'vue';
import AutocompleteApp from './emote-autocomplete';
import $ from '../../plugins/jquery-wrapper.js';
import { debounce, getCurrentChatChannelName } from '../../utils/index.js';
import { waitForElement } from '../../utils/wait-for.js';
import * as emoteHandler from '../../areas/chat/emotes/emote-handler';

let app = null;

function keydownListener(e) {
    const child = app.$children[0] || {};

    if (child.showMenu) {
        switch (e.which) {
        case 37: //left
            child.decrementSelectedEmote();
            e.preventDefault();
            e.stopPropagation();
            return false;
        case 38: // up
            child.decrementSelectedEmoteRow();
            e.preventDefault();
            e.stopPropagation();
            return false;
        case 39: // right
            child.incrementSelectedEmote();
            e.preventDefault();
            e.stopPropagation();
            return false;
        case 40: // down
            child.incrementSelectedEmoteRow();
            e.preventDefault();
            e.stopPropagation();
            return false;
        case 13: // enter
            child.query = '';
            break;
        case 9: // tab
            child.autocompleteSelectedEmote();
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            return false;
        }
    }
}

function keyupListener(e) {
    let child = app.$children[0] || {};

    if (e.which === 27) {
        //esc
        if (child.showMenu) {
            child.query = '';
            return;
        }
    }

    let query = '';

    let allText = $('#chat-input')
        .children('textarea')
        .val();
    if (allText && allText.trim().length > 0 && !allText.endsWith(' ')) {
        let words = allText.split(' ');
        if (words.length > 0) {
            let lastWord = words[words.length - 1];
            if (lastWord != null && lastWord.trim().length >= 3) {
                query = lastWord;
            }
        }
    }

    child.query = query;
}


export function bindEmoteAutocompleteApp(composerBlock, options) {
    //clean up any previous
    if ($('#elixr-emote-autocomplete').length > 0) {
        $('#elixr-emote-autocomplete').remove();
    }

    let keyupListenerFunc = debounce(keyupListener, 100);
    let keydownListenerFunc = keydownListener;

    $('#chat-input')
        .children('textarea')
        .off('keyup', keyupListenerFunc);

    $('#chat-input')
        .children('textarea')
        .off('keydown', keydownListenerFunc);

    if (options.enableEmoteAutocomplete === false) {
        return;
    }

    let emotes = [];
    if (emoteHandler.emotesAvailable) {
        const emoteGroups = emoteHandler.getAvailableEmoteGroups(getCurrentChatChannelName());
        for (const emoteGroup of emoteGroups) {
            emotes = emotes.concat(
                emoteGroup.emotes.map(e => {
                    return {
                        ...e,
                        groupId: emoteGroup.id
                    };
                })
            );
        }
    }

    composerBlock.prepend('<ul id="elixr-autocomplete-binder" role="listbox"></ul>');

    app = new Vue({
        el: '#elixr-autocomplete-binder',
        render: h => h(AutocompleteApp)
    });

    let child = app.$children[0] || {};

    child.emotes = emotes.sort(function(a, b) {
        const aCode = a.code.toLowerCase(),
            bCode = b.code.toLowerCase();

        if (aCode < bCode) {
            return -1;
        }
        if (aCode > bCode) {
            return 1;
        }
        return 0;
    });

    $('#chat-input')
        .children('textarea')
        .on('keyup', keyupListenerFunc);
    $('#chat-input')
        .children('textarea')
        .on('keydown', keydownListenerFunc);

    const chatSendBtnListener = function() {
        let child = app.$children[0] || {};
        child.query = '';
    };

    waitForElement("[class*='send_']").then(sendSpan => {
        let sendBtn = sendSpan
            .parent()
            .parent()
            .parent();
        sendBtn.off('click', chatSendBtnListener);
        sendBtn.on('click', chatSendBtnListener);
    });
}
