import * as emoteHandler from './emote-handler';
import $ from '../../../plugins/jquery-wrapper.js';
import {
    updateChatTextfield,
    getCurrentChatChannelName,
    escapeHTML
} from '../../../utils/index.js';

import browser from '../../../plugins/browser.js';

function buildEmoteGroupSection(emoteGroup) {
    const customEmotesWrapper = $(
        `<div>
            <h3 class="elixrEmoteGroupHeader">${emoteGroup.name}</h3>
            <div class="elixrEmoteList"></div>
        </div>`
    );
    const emoteList = customEmotesWrapper.children('.elixrEmoteList');

    // loop through all emotes
    for (const emote of emoteGroup.emotes) {
        const emoteCode = escapeHTML(emote.code);
        emoteList.append(`
            <span class="elixr-emote-preview" style="display: inline-block; margin: 0 5px 10px 0;" emote-code="${emoteCode}">
                ${emoteHandler.getEmoteElement(emote, emoteGroup.providerName)}
            </span>`);
    }

    return customEmotesWrapper;
}

let waitForModalContainer = function(modal, counter = 0) {
    return new Promise((resolve, reject) => {
        if (counter >= 20) {
            return reject();
        }
        counter++;

        let emotesContainer = modal.find("[class*='container']");

        if (emotesContainer == null || emotesContainer.length < 1) {
            setTimeout(() => {
                resolve(waitForModalContainer(modal, counter));
            }, 100);
        } else {
            resolve(emotesContainer);
        }
    });
};

export function handleEmoteModal() {
    // get rid of any previous registered callbacks for chat modals
    $.deinitialize("[class*='modal']");

    $.initialize("[class*='modal']", async function() {
        let modal = $(this);

        if (emoteHandler.emotesAvailable) {
            waitForModalContainer(modal)
                .then(emotesContainer => {
                    let classes = emotesContainer.attr('class').split(/\s+/);

                    let isListModal = classes.some(c => {
                        return c.startsWith('listModal');
                    });

                    if (!isListModal) {
                        emotesContainer.addClass('mixer-emotes-wrapper');
                        emotesContainer.show();

                        if ($('.elixr-emote-tabs').length > 0) {
                            $('.elixr-emote-tabs').remove();
                        }

                        $(`
                            <div class="elixr-emote-tabs">
                                <div class="elixr-emote-tab elixr-tooltip mixer  elixr-tab-selected" title="Mixer Emotes">
                                    <img src="${browser.runtime.getURL('resources/images/MixerMerge_Dark.svg')}">
                                </div>
                                <div class="elixr-emote-tab elixr-tooltip elixr" title="MixrElixr Emotes">
                                    <img src="${browser.runtime.getURL('resources/images/elixr-light-128.png')}">
                                </div>
                            </div>
                        `).insertBefore(emotesContainer);

                        $('.elixr-emote-tab').off('click');
                        $('.elixr-emote-tab').on('click', function() {
                            let clickedTab = $(this);
                            if (!clickedTab.hasClass('elixr-tab-selected')) {
                                clickedTab.addClass('elixr-tab-selected');
                                let otherTabType = clickedTab.hasClass('elixr') ? 'mixer' : 'elixr';
                                $(`.${otherTabType}`).removeClass('elixr-tab-selected');
                                let elixrEmotes = $('.elixr-emotes-wrapper');
                                let mixerEmotes = $('.mixer-emotes-wrapper');
                                if (otherTabType === 'mixer') {
                                    mixerEmotes.hide();
                                    elixrEmotes.show();
                                } else {
                                    elixrEmotes.hide();
                                    mixerEmotes.show();
                                }
                            }
                        });

                        if ($('.elixr-emotes-wrapper').length > 0) {
                            $('.elixr-emotes-wrapper').remove();
                        }

                        let elixrEmotesContainer = $(`<div class="elixr-emotes-wrapper"></div>`);
                        elixrEmotesContainer.hide();

                        const chatChannelName = getCurrentChatChannelName();

                        const emoteGroups = emoteHandler.getAvailableEmoteGroups(chatChannelName);

                        for (const emoteGroup of emoteGroups) {
                            if (emoteGroup.emotes && emoteGroup.emotes.length > 0) {
                                const emoteGroupSection = buildEmoteGroupSection(emoteGroup);
                                elixrEmotesContainer.append(emoteGroupSection);
                            }
                        }

                        elixrEmotesContainer.insertBefore(emotesContainer);

                        $('.elixr-emote-preview').off('click');
                        $('.elixr-emote-preview').on('click', function() {
                            let emoteCode = $(this).attr('emote-code');
                            let chatTextarea = $('#chat-input').children('textarea');
                            let currentValue = chatTextarea.val();
                            let newValue = `${currentValue}${currentValue === '' ? ' ' : ''}${emoteCode} `;
                            updateChatTextfield(newValue);
                        });
                    }
                })
                .catch(() => {});
        }
    });
}
