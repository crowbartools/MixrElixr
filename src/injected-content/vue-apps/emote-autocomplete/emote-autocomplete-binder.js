import Vue from "vue";
import AutocompleteApp from "./emote-autocomplete";
import { waitForElementAvailablity, debounce } from "../../utils";

let app = null;
export function bindEmoteAutocompleteApp(globalEmotesCache, channelEmotesCache, currentStreamerId) {

    //remove previous
    if ($("#me-emote-autocomplete").length > 0) {
        $("#me-emote-autocomplete").remove();
    }

    let globalEmotes = [];
    if (globalEmotesCache && globalEmotesCache.emotes) {
        globalEmotes = Object.values(globalEmotesCache.emotes);
        globalEmotes.forEach(e => e.global = true);
    }

    let channelEmotes = [];
    if (channelEmotesCache && channelEmotesCache.emotes) {
        channelEmotes = Object.values(channelEmotesCache.emotes);
        channelEmotes.forEach(e => e.global = false);
    }

    $("[class*='webComposerBlock']").prepend('<ul id="me-autocomplete-binder" role="listbox"></ul>');

    app = new Vue({
        el: '#me-autocomplete-binder',
        render: h => h(AutocompleteApp)
    });

    let child = app.$children[0] || {};

    child.emotes = globalEmotes.concat(channelEmotes).sort(function(a, b) {
        const aName = a.name.toLowerCase(),
            bName = b.name.toLowerCase();

        if (aName < bName) { return -1; }
        if (aName > bName) { return 1; }
        return 0;
    });

    child.currentStreamerId = currentStreamerId;

    let keyupListenerFunc = debounce(keyupListener, 100);
    let keydownListenerFunc = keydownListener;

    $("#chat-input").children("textarea").off("keyup", keyupListenerFunc);
    $("#chat-input").children("textarea").on("keyup", keyupListenerFunc);

    $("#chat-input").children("textarea").off("keydown", keydownListenerFunc);
    $("#chat-input").children("textarea").on("keydown", keydownListenerFunc);

    const chatSendBtnListener = function() {
        let child = app.$children[0] || {};
        child.query = "";
    };

    waitForElementAvailablity("[class*='send_']").then((sendSpan) => {
        let sendBtn = sendSpan.parent().parent().parent();
        sendBtn.off("click", chatSendBtnListener);
        sendBtn.on("click", chatSendBtnListener);
    });
}

function keydownListener(e) {
    let child = app.$children[0] || {};

    switch (e.which) {
        case 37: //left
        case 38: // up
            if (child.showMenu) {
                child.decrementSelectedEmote();
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
            break;
        case 39: // right
        case 40: // down
            if (child.showMenu) {
                child.incrementSelectedEmote();
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
            break;
        case 13: // enter
            if (child.showMenu) {
                child.query = "";
            }
            break;
        case 9: // tab
            if (child.showMenu) {
                child.autocompleteSelectedEmote();
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                return false;
            }
            break;

    }
}

function keyupListener(e) {

    let child = app.$children[0] || {};

    if (e.which === 27) { //esc
        if (child.showMenu) {
            child.query = "";
            return;
        }
    }

    let query = "";

    let allText = $("#chat-input").children("textarea").val();
    if (allText && allText.trim().length > 0 && !allText.endsWith(" ")) {
        let words = allText.split(" ");
        if (words.length > 0) {
            let lastWord = words[words.length - 1];
            if (lastWord != null && lastWord.trim().length > 1) {
                query = lastWord;
            }
        }
    }


    child.query = query;
}