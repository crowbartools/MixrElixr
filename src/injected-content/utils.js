export function log(message) {
    console.log(`[MixrElixr] ${message}`);
}

export function waitForElementAvailablity(selector) {

    log(`Waiting for element '${selector}'...`);

    let promise = new Promise(resolve => {
        $.deinitialize(selector);

        $.initialize(selector, function() {
            log(`Found element '${selector}'!`);
            $.deinitialize(selector);
            resolve($(this));
        });
    });

    return promise;
}

export function debounce(func, wait, immediate) {
    let timeout;

    return function executedFunction() {
        let context = this;
        let args = arguments;

        let later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };

        let callNow = immediate && !timeout;

        clearTimeout(timeout);

        timeout = setTimeout(later, wait);

        if (callNow) func.apply(context, args);
    };
}

export function escapeHTML(unsafeText) {
    let div = document.createElement('div');
    div.innerText = unsafeText;
    return div.innerHTML.replace(/"/g, '&quot;');
}

export function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
}

export function determineMessageType(message) {
    /*if (message.find("span[class*='stickerMessage_']").length > 0) {
        return "ember-donation";
    }*/

    if (message.find("div[class*='sticker_']").length > 0) {
        return "sticker";
    }

    if (message.find("img[class*='skillIcon_']").length > 0) {
        return "skill-used";
    }

    return "regular-message";
}

export function updateChatTextfield(newString) {

    //remove prev
    if ($("#chatTextUpdate").length > 0) {
        $("#chatTextUpdate").remove();
    }

    let scrpt = document.createElement('script');

    scrpt.setAttribute("id", "chatTextUpdate");

    scrpt.innerText = `
        console.log("Elixr: Starting chat text update...");

        var meChatTextArea = document.getElementById("chat-input").childNodes[0];

        var nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
        nativeInputValueSetter.call(meChatTextArea, "${newString}");

        var meInputEvent = new Event('input', { bubbles: true });
        meInputEvent.simulated = true;
        meChatTextArea.dispatchEvent(meInputEvent);

        console.log("Elixr: Finished chat text update.");          
    `;

    document.head.appendChild(scrpt);
}