/*eslint-disable no-use-before-define*/

//import styles
import './scss/injected-styles.scss';

// import state manager early to ensure it's modules get to hook events first
import state from './state.js'; //eslint-disable-line no-unused-vars

// import jquery wrapper early so it can apply jQuery plugins
import $ from './plugins/jquery-wrapper.js';

import { waitForMixer, waitForElement } from './utils/wait-for.js';
import {
    debounce,
    log,
    escapeRegExp,
    determineMessageType,
    setupScrollGlueCheck,
    scrollChatIfGlued,
    scrollChatToBottom
} from './utils/index.js';

import * as api from './api';

// vue apps
import * as autocompleteAppBinder from './vue-apps/emote-autocomplete/emote-autocomplete-binder';
import * as slowChatTimerAppBinder from './vue-apps/slow-chat-timer/slow-chat-timer-binder';
import * as siteWide from './areas/sitewide/site-wide';
import * as chatFeed from './areas/chat/chat-feed';
import * as emoteHandler from './areas/chat/emotes/emote-handler';
import { handleEmoteModal } from './areas/chat/emotes/emote-modal-handler';
import * as chatApi from './mixer-connections/chat';

import browser, { storage } from './plugins/browser.js';

// Pre-emptively start to get the current user as retrieving such info doesn't depend on the page
state.user();

// on document ready
$(() => {
    // stuff we need to track across pages
    let settings = null;
    let cache = {};
    let initialPageLoad = true;
    let theaterMode = false;

    const ElementSelector = {
        CHAT_CONTAINER: "[class*='ChatMessages']",
        CHAT_MESSAGE: "div[class*='message_']"
    };

    // start the process
    log('Starting MixrElixr...');

    async function runPageLogic() {

        // get current user and apply site-wide settings
        let user = await state.user();
        if (!initialPageLoad) {
            siteWide.apply(settings, user);
        }

        // deduce page and get channel details
        let [page, channel] = await Promise.all([state.page(), state.channel()]);

        try {
            chatApi.disconnectChat();
        } catch (err) {
            console.log('failed to disconnet from chat!', err);
        }

        // check we if we are an embeded chat window
        if (page.type === 'embedded-chat') {
            if (channel != null) {
                let channelOptions = getStreamerOptionsForStreamer(channel.token);
                await emoteHandler.setup(channel, channelOptions);

                try {
                    chatApi.connectToChat(channel.id, user && user.id);
                } catch (err) {
                    console.log('failed to connect to chat!', err);
                }

                waitForElement(ElementSelector.CHAT_CONTAINER).then(() => {
                    applyChatSettings(channel.token);
                });
            }

        // channel page
        } else if (page.type === 'channel') {
            waitForElement("[class*='chatContainer']").then(() => {
                $("[class*='chatContainer']").addClass('elixr-chat-container');
            });

            if (channel) {
                let channelOptions = getStreamerOptionsForStreamer(channel.token);
                await emoteHandler.setup(channel, channelOptions);

                try {
                    chatApi.connectToChat(channel.id, user && user.id);
                } catch (err) {
                    console.log('failed to connect to chat!', err);
                }

                let slowChatCooldown = channel.preferences['channel:slowchat'];
                cache.slowChatCooldown = slowChatCooldown;
                log(`Set slow chat cooldown to: ${slowChatCooldown}`);

                waitForElement(ElementSelector.CHAT_CONTAINER).then(() => {
                    log('loading streamer page options...');
                    loadStreamerPage(channel.token);
                });
            }
        } else if (page.type === 'homepage') {
            log('looks like we are on the main page');
            loadHomepage();
        } else {
            loadOtherPage();
            log("looks like we're on some other page");
        }
    }

    async function loadHomepage() {
        log('Loading up settings for homepage');

        // If the user desires to have favorites highlighted:
        if (settings.generalOptions.highlightFavorites) {
            // clear the loop so were aren't trying to run it constantly!
            if (cache.highlightLoop != null) {
                clearInterval(cache.highlightLoop);
            }

            // Lets keep checking to see if we find any new favorites
            cache.highlightLoop = setInterval(function() {
                // Checking all streamer cards of non-favorites:
                $('.card:not(".favoriteFriend")').each(function() {
                    // Which streamer did we find
                    let streamer = $(this)
                        .find('.titles small')
                        .first()
                        .text()
                        .trim()
                        .replace(/ /g, '')
                        .replace(/\r?\n|\r/g, '');
                    if (streamerIsFavorited(streamer)) {
                        // If streamer is a favorite, let's highlight the window
                        $(this)
                            .find('.titles small')
                            .first()
                            .addClass('favoriteUsername');
                        $(this).addClass('favoriteFriend');
                    } else {
                        $(this)
                            .find('.titles small')
                            .first()
                            .removeClass('favoriteUsername');
                        $(this).removeClass('favoriteFriend');
                    }
                });
            }, 500);
        } else {
            log('Highlighting Favorites is off');
            // If highlights are off, then let's remove any active highlights.
            $('.card.favoriteFriend').removeClass('favoriteFriend');

            // clear the loop so were aren't trying to run it constantly!
            if (cache.highlightLoop != null) {
                clearInterval(cache.highlightLoop);
            }
        }

        // handle searchbar
        const pinSearchBar =
            settings.homePageOptions.pinSearchToTop == null || settings.homePageOptions.pinSearchToTop === true;

        let searchBar = $('b-browse-channels-header')
            .children()
            .find('.control.input');
        let pageHeader = $('b-nav-host');

        let searchHeader = $('b-browse-framework').children('header');

        let filterButton = $('b-browse-channels-header')
            .children()
            .find('.control.control-filter');

        let filterPanel = $('b-browse-filters');

        // add or remove our css classes
        if (pinSearchBar) {
            // remove button text from language dropdown
            $('.language-button')
                .children('span')
                .text('');
            // remove button text from filter button
            let filterText = $('.control-filter')
                .children('.bui-btn')
                .children('span')
                .contents()
                .filter(function() {
                    return this.nodeType === 3;
                })
                .eq(1);
            filterText.replaceWith('');

            // block click events on filter button, handle show/hide of filter panel on our own
            let filterBtnHandler = () => {
                if (pinSearchBar) {
                    let filtersPanel = $('b-browse-filters');
                    if (filtersPanel.hasClass('visible')) {
                        filtersPanel.removeClass('visible');
                    } else {
                        filtersPanel.addClass('visible');
                    }
                    return false;
                }
                return true;
            };
            $('.control-filter')
                .children('.bui-btn')
                .off('click');
            $('.control-filter')
                .children('.bui-btn')
                .on('click', filterBtnHandler);

            pageHeader.addClass('searchPinned');
            searchHeader.addClass('searchPinned');
            searchBar.addClass('elixr-pinned-search elixr-searchbar');
            filterButton.addClass('elixr-pinned-search elixr-filterbtn');
            filterPanel.addClass('elixr-filterspanel');
        } else {
            $('.elixr-pinned-search').css('top', '');
            pageHeader.removeClass('searchPinned');
            searchHeader.removeClass('searchPinned');
            searchBar.removeClass('elixr-pinned-search elixr-searchbar');
            filterButton.removeClass('elixr-pinned-search elixr-filterbtn');
            filterPanel.removeClass('elixr-filterspanel');
            filterPanel.css('top', '');
            $('.elixr-badge-wrapper').remove();
        }

        // do initial searchbar position check on load
        searchbarPositionCheck();

        // do checks when page scrolled
        $(window).scroll(
            debounce(function() {
                searchbarPositionCheck();
            }, 1)
        );

        // do checks when page resized
        $(window).on(
            'resize',
            debounce(function() {
                searchbarPositionCheck();

                if (pinSearchBar) {
                    setTimeout(() => {
                        let pageHeaderCheck = $('b-nav-host');
                        pageHeaderCheck.addClass('searchPinned');
                    }, 250);
                }
            }, 100)
        );

        // do checks when a click happens anywhere in main doc
        $(document).click(async function (event) {
            let page = await state.page();
            if (page && page.type === 'homepage') {
                searchbarPositionCheck();

                let filtersPanel = $('b-browse-filters');
                if (filtersPanel.length > 0 && !filtersPanel[0].contains(event.target)) {
                    if (pinSearchBar) {
                        if (filtersPanel.hasClass('visible')) {
                            filtersPanel.removeClass('visible');
                        }
                    }
                }
            }
        });

        // Remove featured streams on homepage
        waitForElement('b-delve-featured-carousel').then(() => {
            if (settings.homePageOptions && settings.homePageOptions.removeFeatured) {
                $('b-delve-featured-carousel, b-delve-games, b-delve-oom-channels').remove();
            }
            log('Homepage carousel is loaded.');
        });

        initialPageLoad = false;
    }

    let hideTimeout;
    let infoBarShown = false;
    function hideInfoBar() {
        if (theaterMode) {
            $('b-channel-info-bar > .info-bar').css('opacity', '0');
            infoBarShown = false;
        }
    }

    // theater mode listeners
    let infoBarShowHide = debounce(function() {
        if (theaterMode) {
            if (!infoBarShown) {
                $('b-channel-info-bar > .info-bar').css('opacity', '1');
                infoBarShown = true;
            }
            clearTimeout(hideTimeout);
            hideTimeout = setTimeout(hideInfoBar, 3000);
        }
    }, 50);

    function loadOtherPage() {
        log('Loading up other page settings.');
        // If the user desires to have favorites highlighted:
        if (settings.generalOptions.highlightFavorites) {
            // clear the loop so were aren't trying to run it constantly!
            if (cache.highlightLoop != null) {
                clearInterval(cache.highlightLoop);
            }

            // Lets keep checking to see if we find any new favorites
            cache.highlightLoop = setInterval(function() {
                // Checking all streamer cards of non-favorites:
                $('.card:not(".favoriteFriend")').each(function() {
                    // Which streamer did we find
                    let streamer = $(this)
                        .find('.titles small')
                        .first()
                        .text()
                        .trim()
                        .replace(/ /g, '')
                        .replace(/\r?\n|\r/g, '');
                    if (streamerIsFavorited(streamer)) {
                        // If streamer is a favorite, let's highlight the window
                        $(this)
                            .find('.titles small')
                            .first()
                            .addClass('favoriteUsername');
                        $(this).addClass('favoriteFriend');
                    } else {
                        $(this)
                            .find('.titles small')
                            .first()
                            .removeClass('favoriteUsername');
                        $(this).removeClass('favoriteFriend');
                    }
                });
            }, 500);
        } else {
            log('Highlighting Favorites is off');
            // If highlights are off, then let's remove any active highlights.
            $('.card.favoriteFriend').removeClass('favoriteFriend');

            // clear the loop so were aren't trying to run it constantly!
            if (cache.highlightLoop != null) {
                clearInterval(cache.highlightLoop);
            }
        }

        initialPageLoad = false;
    }

    async function loadStreamerPage(streamerName) {
        log(`Loading streamer page for: ${streamerName}`);

        if (!settings.streamerPageOptions) {
            log('No streamer page settings saved.');
            return;
        }

        let options = settings.streamerPageOptions.global || {};

        // override the options if there is streamer specific options available
        let overrides = settings.streamerPageOptions.overrides;
        if (overrides != null) {
            let overrideKeys = Object.keys(overrides);
            for (let i = 0; i < overrideKeys.length; i++) {
                let key = overrideKeys[i];
                if (key.toLowerCase() === streamerName.toLowerCase()) {
                    log(`found override options for ${streamerName}`);
                    options = overrides[key];
                }
                break;
            }
        }

        waitForElement('.stage').then(() => {
            if (options.largerVideo === false) {
                $('.stage').removeClass('elixr-video-stage');
            } else {
                $('.stage').addClass('elixr-video-stage');
            }
        });

        // Auto Close Costreams
        if (options.autoCloseCostreams && initialPageLoad) {
            let costreamPage = detectCostreams();
            if (costreamPage) {
                log('Costream detected. Waiting for profiles to load');
                await closeCostreams(streamerName);
            } else {
                log('No costream detected');
            }
        }

        // Auto Mute Stream
        if (options.autoMute && initialPageLoad) {
            triggerAutomute();
        }

        $('.channel-page').on('mousemove', function() {
            infoBarShowHide();
        });

        if (settings.generalOptions.highlightFavorites) {
            // Let's get the Costream ID via API call
            let costreamID = api.getCostreamId(streamerName);
            costreamID.then(result => {
                if (result == null) {
                    // If result is null, then this is not a costream.
                    log(streamerName + ' is not costreaming.');

                    // Let's if we are following this streamer
                    let isFollowed = streamerIsFollowed(streamerName);

                    // Once we get some info back from the API
                    isFollowed.then(result => {
                        if (result.isFollowed) {
                            // Which streamer is this?
                            let streamer = result.streamerName;

                            // If the streamer is followed,
                            // Let's show the favorite button, but it's state is based on whether streamed is faved.
                            addFavoriteButton(streamer, streamerIsFavorited(streamer));
                        } else {
                            // User doesn't follow the streamer.

                            // If not followed but is favorited, favorite status should be removed automatically.
                            if (streamerIsFavorited(streamerName)) {
                                syncFavorites(removeFavorite(streamerName));
                            }

                            // We should also attach an event to the follow button that will make the favorite button appear when a streamer is followed.
                            $('bui-icon[icon="heart-full"]')
                                .closest('div.bui-btn-raised')
                                .click(function() {
                                    // log('Now following current streamer!');
                                    addFavoriteButton(streamerName, streamerIsFavorited(streamerName));

                                    // Remove the action from the follow button.
                                    $('bui-icon[icon="heart-full"]')
                                        .closest('div.bui-btn-raised')
                                        .off('click');
                                });
                        }
                    });
                } else {
                    // If result has value, then this is a co-stream.
                    log(streamerName + ' is currently costreaming.');

                    // Let's see who is part of this co-stream collective.
                    let costreamers = getCostreamers(result);
                    costreamers.then(result => {
                        log('Costreamers: ' + result);
                        costreamers = result;
                        // Let's check each co-streamer
                        $.each(costreamers, function(i) {
                            // This is the current co-streamer.
                            let currentStreamer = costreamers[i];

                            // Check to see if this streamer is followed.
                            let isFollowed = streamerIsFollowed(currentStreamer);

                            isFollowed.then(result => {
                                // Let's see which streamer we checked
                                let streamer = result.streamerName;

                                if (result.isFollowed) {
                                    // The streamer is followed, so let's create the favorite button.
                                    addFavoriteButton(streamer, streamerIsFavorited(streamer), true);
                                } else {
                                    // The current streamer is not followed
                                    // log("Costreamer '" + streamer+"' is not followed.");

                                    // If not followed but is favorited, favorite status should be removed automatically.
                                    if (streamerIsFavorited(streamer)) {
                                        syncFavorites(removeFavorite(streamer));
                                    }

                                    // We need to find the follow button for this streamer.
                                    let followButtonElement = $('a.avatar-block[href="/' + streamer + '"]')
                                        .siblings('div.owner-block')
                                        .find('div.bui-btn');

                                    // We should also attach an event to the follow button that will make the favorite button appear when a streamer is followed.
                                    followButtonElement.click(function() {
                                        // Find out which streamer's follow button we are hitting.
                                        let thisStreamer = $(this)
                                            .parents('div.head')
                                            .find('a.avatar-block')
                                            .attr('href')
                                            .substr(1);

                                        // Add a favorite button for this streamer
                                        addFavoriteButton(thisStreamer, streamerIsFavorited(thisStreamer), true);

                                        // remove event from the follow button.
                                        followButtonElement.off('click');
                                    });
                                }
                            });
                        });
                    });
                }
            });
        } else {
            log("Highlights not active. So we don't do this.");
            $('div.owner-block h2:first-of-type').removeClass('favoriteUsername');
            $('.elixr-favorite-btn').removeClass('faved');
        }

        // Auto close interactive
        if (options.autoCloseInteractive && initialPageLoad) {
            waitForElement('.toggle-interactive')
                .then(() => {
                    let minimizeInteractiveBtn = $('.toggle-interactive');

                    if (minimizeInteractiveBtn != null && minimizeInteractiveBtn.hasClass('open')) {
                        let hideInteractiveTries = 0;

                        let hideInteractiveInterval = setInterval(function() {
                            // click the hide button
                            minimizeInteractiveBtn.click();

                            setTimeout(() => {
                                // get a fresh copy of the toggle button, this will reflect any changes in the DOM that
                                // happenedafter we clicked it
                                let updatedBtn = $('.toggle-interactive');

                                // this will be true if there is a costream and multiple streamers in the costream have
                                // interactive on
                                if (detectCostreams() && updatedBtn.length === 0) {
                                    log('Pressed the toggle interactive button successfully.');
                                    clearInterval(hideInteractiveInterval);

                                    // wait half a sec
                                    setTimeout(() => {
                                        // click X close button
                                        $('[icon="MixerBan"]').click();
                                        log('Pressed the close interactive button.');
                                    }, 200);

                                // this will be true if theres no costreamer or only one streamer in costream has interactive on
                                } else if (updatedBtn.length !== 0 && !updatedBtn.hasClass('open')) {
                                    log('Hid the interactive panel successfully.');
                                    clearInterval(hideInteractiveInterval);
                                } else if (hideInteractiveTries < 10) {
                                    hideInteractiveTries++;
                                    log('Cant find interactive hide button. Trying again.');
                                } else {
                                    clearInterval(hideInteractiveInterval);
                                    log('Tried to hide interactive for 10 seconds and failed.');
                                }
                            }, 100);
                        }, 1000);
                    }
                })
                .catch(() => {
                    log('Couldnt find interactive, streamer might not have it running.');
                });
        }

        // Host Loop
        // This checks every second to see if the channel hosted someone.
        if (options.autoForwardOnHost || options.autoMuteOnHost) {
            if (cache.hostLoop != null) {
                clearInterval(cache.hostLoop);
            }

            cache.hostLoop = setInterval(function() {
                let updatedOptions = getStreamerOptionsForStreamer(streamerName);

                let hosting = $('.host-name').is(':visible');
                if (hosting) {
                    let hostName = $('.hostee span')
                        .text()
                        .trim();

                    // Auto forward the person on host.
                    if (updatedOptions.autoForwardOnHost && hostName !== streamerName) {
                        // Check to make sure we're not trying to forward again accidently (which sometimes occured if interval fired during page load after a redirect)
                        log('Redirecting to ' + hostName + ' because forwarding on host is on.');
                        document.location.href = 'https://mixer.com/' + hostName;
                    }

                    // Auto mute when a stream hosts someone.
                    if (updatedOptions.autoMuteOnHost && streamerName !== cache.mutedHost) {
                        triggerAutomute();
                        cache.mutedHost = streamerName;
                    }
                }
            }, 1000);
        }

        // streamer online/offline check
        if (cache.onlineInterval != null) {
            clearInterval(cache.onlineInterval);
        }

        cache.onlineInterval = setInterval(function() {
            let offlineMessage = $('.offline-message');

            let streamerOnline = offlineMessage != null && offlineMessage.length > 0;

            if (cache.streamerOnlineStatus == null) {
                cache.streamerOnlineStatus = streamerOnline;
            } else {
                let onlineStatusChanged = cache.streamerOnlineStatus !== streamerOnline;
                if (onlineStatusChanged) {
                    // turn off theater mode of streamer went offline
                    if (!streamerOnline && theaterModeEnabled()) {
                        toggleTheaterMode();
                    }
                }
                cache.streamerOnlineStatus = streamerOnline;
            }
        }, 1000);

        // add theater mode btn
        // wait for video controls to load
        waitForElement('.spectre-player').then(() => {
            let findFullscreenBtn = () => {
                log('attempting to create theater mode button...');

                // copy the fullscreen button so we can make it into the theater btn
                let fullscreenBtn;

                let icons = $('i.material-icons');
                icons.each(function() {
                    let icon = $(this);
                    if (icon.text() === 'fullscreen') {
                        fullscreenBtn = icon.parent().parent();
                    }
                });

                if (fullscreenBtn == null || fullscreenBtn.length < 1) {
                    log('Couldnt find fullscreen button... trying again in a bit.');
                    setTimeout(() => findFullscreenBtn(), 250);
                    return;
                }

                const currentTheaterButton = $('[theater-mode-btn-container]');
                if (currentTheaterButton != null && currentTheaterButton.length > 0) {
                    log('Theater mode btn already exists.');
                    return;
                }

                log('Found fullscreen button!');
                let theaterBtn = fullscreenBtn.clone();

                // add an attr for us to check for it later
                theaterBtn.attr('theater-mode-btn-container', '');

                // change the icon
                theaterBtn.find('i').text('event_seat');

                // change tooltip text
                theaterBtn.find('span').text('MixrElixr: Theater Mode');

                // add click handler
                theaterBtn.on('click', function() {
                    toggleTheaterMode();
                });

                theaterBtn.insertBefore(fullscreenBtn);
            };

            setTimeout(() => {
                findFullscreenBtn();
            }, 250);
        });

        let urlParams = new URLSearchParams(window.location.search);
        if (!urlParams.has('clip')) {
            waitForElement('[class*="chatContainer_"]').then(chatContainer => {
                if (options.lightsOutTheaterMode) {
                    chatContainer.addClass('elixr-lights-out');
                } else {
                    chatContainer.removeClass('elixr-lights-out');
                }
            });
        }
        if (options.autoTheater && initialPageLoad && !urlParams.has('clip')) {
            toggleTheaterMode();
        }

        waitForElement(ElementSelector.CHAT_CONTAINER).then(() => {
            applyChatSettings(streamerName);
        });
    }

    function theaterModeEnabled() {
        return $('body').hasClass('theaterMode');
    }

    function toggleTheaterMode() {
        let theaterElements = $(
            'body,b-desktop-header, .channel-info-container, b-skills-button-host-component, b-nav-host > div, b-channel-info-bar,.profile-header,.profile-blocks, b-notifications,.channel-page,b-desktop-header,.chat,.stage.aspect-16-9'
        );
        if (theaterElements.hasClass('theaterMode')) {
            theaterMode = false;
            clearTimeout(hideTimeout);
            infoBarShown = true;
            $('b-channel-info-bar > .info-bar').css('opacity', '1');
            theaterElements.removeClass('theaterMode');
            $('.stage').addClass('elixr-video-stage');

            $('.elixr-chat-container').removeClass('theaterMode');

            if ($('#elixr-quick-host-button').length > 0) {
                $('#elixr-quick-host-button').remove();
            }

            // hacky way to toggle "position: relative" on and off to force the chat element to rerender with proper positioning
            setTimeout(() => {
                $('.chat').addClass('relative');
                setTimeout(() => {
                    $('.chat').removeClass('relative');
                }, 25);
            }, 25);

            let stage = $('addedBuiAr');
            if (stage != null && stage.length > 0) {
                stage.removeClass('addedBuiAr');
                stage.removeClass('bui-arContent');
                $('.stage').removeClass('aspect-16-9');
            }

            $.toast().reset('all');
        } else {
            const isLive = $('.offline-message').length < 1;
            if (isLive) {
                theaterMode = true;

                let minimizeInteractiveBtn = $('.hide-interactive');
                if (minimizeInteractiveBtn != null) {
                    let isHideBtn = $('.icon-indeterminate_check_box');
                    if (isHideBtn != null && isHideBtn.length > 0) {
                        minimizeInteractiveBtn.click();
                    }
                }

                if ($('#elixr-quick-host-button').length > 0) {
                    $('#elixr-quick-host-button').remove();
                }

                const currentViewerCount = $('b-channel-info-bar').find('.viewers.layout-row');
                $(`
          <div id="elixr-quick-host-button">
            <div>Host</div>
          </div>
        `).insertAfter(currentViewerCount);

                const onQuickHostClick = function() {
                    $('b-channel-owners-block')
                        .find('.menu-btn')
                        .click();
                    $('b-host-target-button')
                        .children('button')
                        .click();
                };

                $('#elixr-quick-host-button').off('click', onQuickHostClick);
                $('#elixr-quick-host-button').on('click', onQuickHostClick);

                setTimeout(() => {
                    theaterElements.addClass('theaterMode');

                    $.toast({
                        text: 'Press <span style="font-weight:bold;">ESC</span> at any time to exit.',
                        heading: 'Theater Mode Enabled',
                        showHideTransition: 'fade',
                        allowToastClose: true,
                        hideAfter: 3000,
                        stack: false,
                        position: 'top-center',
                        bgColor: '#151C29',
                        textColor: '#fff',
                        textAlign: 'center',
                        loader: true,
                        loaderBg: '#1FBAED'
                    });
                }, 1);

                $('b-stage').addClass('bui-arContent addedBuiAr');
                $('.stage').addClass('aspect-16-9 theaterMode');
                $('.stage').removeClass('elixr-video-stage');
                $('.elixr-chat-container').addClass('theaterMode');
            }
        }
    }

    function closeCostreams(streamerName) {
        return new Promise(async resolve => {
            if (streamerName == null) return resolve();

            log('Closing feeds for everyone except ' + streamerName);

            const profileSelector = '.costream-rollout .profile';

            $.deinitialize(profileSelector);
            $.initialize(profileSelector, function() {
                let streamerFeed = $(this);
                let text = streamerFeed.text();
                if (text && text.trim() !== streamerName.trim()) {
                    let closeBtn = streamerFeed
                        .siblings()
                        .eq(0)
                        .children()[2];
                    if (closeBtn) {
                        closeBtn.click();
                    }
                }
            });

            resolve();
        });
    }

    function detectCostreams() {
        if ($('.costream-avatars').length > 0) {
            return true;
        }
        return false;
    }

    async function applyChatSettings(streamerName) {
        if (!settings.streamerPageOptions) {
            log('No streamer page settings saved.');
            return;
        }

        let userIsMod = await state.user.isMod();

        log('Applying chat settings...');

        let options = getStreamerOptionsForStreamer(streamerName);

        chatFeed.setup(options);

        $('#elixr-chat-styles').remove();

        $('body').prepend(`
            <style id="elixr-chat-styles">
                ${options.showWhoDeletedMessage !== false ? `
                    b-chat-client-host-component div[class*="deleted_"] {
                        text-decoration: none !important;
                    }
                    b-chat-client-host-component div[class*="deleted_"] > div[class*="messageContent_"] {
                        text-decoration: line-through;
                        padding-bottom: 0 !important;
                    }` : ''}
                ${options.useCustomFontSize ? `
                    b-chat-client-host-component div[class*="messageContent"] {
                        font-size: ${options.textSize}px;
                        line-height: ${options.textSize + 9}px;
                    }` : ''}
                ${options.hideChatAvatars ? `               
                    b-chat-client-host-component img[class*="ChatAvatar"] {
                        display: none;
                    }
                    b-chat-client-host-component div[class*="messageContent"] {
                        margin-left: 4px;
                    }` : ''}
                ${options.hideChannelProgression ? `               
                    b-chat-client-host-component div[class*="messageContent"] span[class*="badge"] {
                        display: none;
                    }` : ''}
                ${options.hideSkillEffects ? `               
                    #skills-chat-wrapper, b-skill-mobile-execution-host {
                        display: none !important;
                    }` : ''}
                ${options.hideEmberMessages ? `               
                    b-chat-client-host-component div[class*="stickerMessage_"] {
                        display: none;
                    }` : ''}
                b-use-app-btn-host {
                    display: none !important;
                }
            </style>
        `);

        // add custom css class to chat message container so its easier for us to query
        $(ElementSelector.CHAT_CONTAINER)
            .children()
            .addClass('elixr-chat-container');

        setupScrollGlueCheck();

        // Mention BG Color
        if (options.mentionChatBGColor) {
            let chatContainer = $('.elixr-chat-container');
            if (chatContainer != null && chatContainer.length > 0) {
                chatContainer.addClass('chat-mention-bg');
            }
        } else if (!options.mentionChatBGColor) {
            let chatContainer = $('.elixr-chat-container');
            if (chatContainer != null && chatContainer.length > 0) {
                chatContainer.removeClass('chat-mention-bg');
            }
        }

        // Keyword BG Color
        if (options.keywords && options.keywords.length > 0) {
            let chatContainer = $('.elixr-chat-container');
            if (chatContainer != null && chatContainer.length > 0) {
                chatContainer.addClass('chat-keyword-bg');
            }
        } else {
            let chatContainer = $('.elixr-chat-container');
            if (chatContainer != null && chatContainer.length > 0) {
                chatContainer.removeClass('chat-keyword-bg');
            }
        }

        // Remove prev Inline Image Links, they will be readded later if needed
        $('img[elixr-img]').each(function() {
            $(this)
                .parent()
                .parent()
                .remove();
        });
        let chatContainer = $('.elixr-chat-container');
        chatContainer.scrollTop(chatContainer[0].scrollHeight);

        // remove all prev custom timestamps if feature is turned off
        if (!options.timestampAllMessages) {
            $('.elixrTime').remove();
        }

        if (options.hideChatHeaders) {
            $('.transcluded-section').hide();
        } else {
            $('.transcluded-section').show();
        }

        const isMobileMode = $('b-channel-mobile-page-wrapper').length > 0;
        const composerBlockSelecter = isMobileMode
            ? "[class*='mobileWebComposerBlock']"
            : "[class*='webComposerBlock']";
        waitForElement(composerBlockSelecter).then(composerBlock => {
            // bind custom emote auto complete app
            autocompleteAppBinder.bindEmoteAutocompleteApp(composerBlock, options);

            // bind slow chat app
            if (cache.slowChatCooldown >= 2000 && !userIsMod && options.showSlowChatCooldownTimer !== false) {
                slowChatTimerAppBinder.bindSlowChatTimerApp(composerBlock, cache.slowChatCooldown);
            }
        });

        handleEmoteModal();

        // get rid of any previous registered callbacks for chat messages
        $.deinitialize(ElementSelector.CHAT_MESSAGE);

        // This will run the callback for every message that already exists as well as any new ones added.
        // We can use this to do any tweaks and modifications to chat as they come in
        // message__
        $.initialize(ElementSelector.CHAT_MESSAGE, async function() {
            let messageContainer = $(this);

            const messageType = determineMessageType(messageContainer);

            let shouldHide = false;
            switch (messageType) {
            case 'ember-donation':
                shouldHide = options.hideEmberMessages;
                break;
            case 'sticker':
                shouldHide = options.hideStickers;
                break;
            case 'skill-used':
                shouldHide = options.hideSkillMessages;
                break;
            case 'regular-message':
            default:
                break;
            }

            if (shouldHide) {
                messageContainer.parent().hide();
                return;
            }

            if (messageType !== 'regular-message') {
                messageContainer.parent().show();
            }

            let alreadyChecked = messageContainer.attr('elixrfied');

            // check to see if we have already looked at this chat messsage.
            if (alreadyChecked) {
                return;
            }

            messageContainer.attr('elixrfied', 'true');

            // Give chat messages a chat message class for easier targeting.
            messageContainer.addClass('chat-message');

            let messageAuthor = messageContainer
                .find("[class*='username']")
                .text()
                .trim()
                .split(' ')[0]; // we do this to cut out the progression level

            let user = await state.user();

            if (user != null) {
                if (messageType === 'regular-message' && messageAuthor === user.username && !user.isMod()) {
                    slowChatTimerAppBinder.messageDetected();
                }
            }

            if (options.ignoredUsers && options.ignoredUsers.includes(messageAuthor)) {
                messageContainer.hide();
            } else {
                if (!messageContainer.is(':visible')) {
                    messageContainer.show();
                }
            }

            // Give any message with a mention of our user a class.
            let messageText = messageContainer
                .find('span:not([class])')
                .text()
                .toLowerCase()
                .trim();

            let userTagged = messageContainer
                .find('.tagComponent')
                .text()
                .toLowerCase()
                .trim()
                .replace('@', '');

            if (user != null) {
                let userLowerCase = user.username.toLowerCase();

                let userRegex = new RegExp(`\\b${escapeRegExp(userLowerCase)}\\b`, 'i');
                if (userRegex.test(messageText) || userRegex.test(userTagged)) {
                    messageContainer.addClass('user-mentioned');
                }
            }

            let chatChannelName = null;
            let chatTabs = $('b-channel-chat-tabs');
            if (chatTabs != null && chatTabs.length > 0) {
                let selectedTab = chatTabs.find('.selected');
                if (selectedTab != null && selectedTab.length > 0) {
                    chatChannelName = selectedTab.text().trim();
                }
            }

            emoteHandler.handleEmotes(messageContainer, chatChannelName);

            // highlight keywords
            if (options.keywords && options.keywords.length > 0) {
                options.keywords.forEach(w => {
                    let keywordRegex = new RegExp(`\\b${escapeRegExp(w)}\\b`, 'i');
                    if (keywordRegex.test(messageText)) {
                        messageContainer.addClass('keyword-mentioned');
                    }
                });
            }

            if (!userIsMod || options.enableHideKeywordsWhenMod) {
                // Add class on hide keyword mention.
                if (options.hideKeywords != null && options.hideKeywords.length > 0) {
                    messageContainer.find('span:not([class])').each(function() {
                        let component = $(this);

                        let text = component.text();

                        function generateReplaceText(count) {
                            let buffer = '';

                            for (let i = 0; i < count; i++) {
                                buffer += '*';
                            }

                            return buffer;
                        }

                        options.hideKeywords.forEach(w => {
                            let keywordRegex = new RegExp(`\\b${escapeRegExp(w)}\\b`, 'ig');

                            let hideStyle = options.hideStyle || 'blur';

                            if (hideStyle === 'remove') {
                                if (keywordRegex.test(messageText)) {
                                    messageContainer.addClass('hide-word-mentioned hide-remove');
                                }
                            } else {
                                text = text.replace(keywordRegex, match => {
                                    log('found match: ' + match + ' style: ' + hideStyle);
                                    let text = null;
                                    if (hideStyle === 'asterisk') {
                                        let replaced = generateReplaceText(match.length);
                                        text = `<span title="${match}">${replaced}</span>`;
                                    } else if (hideStyle === 'blur') {
                                        text = `<span class="hide-word-mentioned hide-blur">${match}</span>`;
                                    }
                                    return text;
                                });

                                component.html(text);
                            }
                        });
                    });
                }
            }

            // Timestamps on each message
            if (options.timestampAllMessages) {
                let parent = messageContainer;

                // check that the current message doesnt already have a native or custom timestamp
                let msgAlreadyHasStamp =
                    parent.parent().find("[class*='timeStamp']").length > 0 || parent.find('.elixrTime').length > 0;

                // should we add a timestamp?
                if (!msgAlreadyHasStamp) {
                    let timeOptions = { hour12: true, hour: '2-digit', minute: '2-digit' };
                    let time = new Date().toLocaleString([], timeOptions);

                    let timeStampTemplate = `
						<div class="elixrTime">
								<span>${time}</span>
						</div>
					`;

                    parent.append(timeStampTemplate);
                }
            }

            if (options.showImagesInline) {
                let userBlacklisted = false;
                if (options.inlineImgBlacklistedUsers != null && options.inlineImgBlacklistedUsers.length > 0) {
                    userBlacklisted = options.inlineImgBlacklistedUsers.includes(messageAuthor);
                }

                if (!userBlacklisted) {
                    let links = messageContainer.find("a[target='_blank']");
                    let channel = await state.channel();

                    if (links.length > 0) {
                        links.each(async function() {
                            let link = $(this);
                            let url = link.attr('href');

                            if (urlIsAnImage(url)) {
                                let lowestPermittedRoleRank = getUserRoleRank(options.lowestUserRoleLinks);
                                let rolePermitted = false;

                                // Get the author roles in an array.
                                api.getUserRolesForChannel(channel.id, messageAuthor).then(roles => {
                                    // Check to make sure the correct role is in the user array.

                                    if (channel.token === messageAuthor) {
                                        roles.push('Owner');
                                    }

                                    for (let role of roles) {
                                        let roleRank = getUserRoleRank(role);
                                        if (roleRank <= lowestPermittedRoleRank) {
                                            rolePermitted = true;
                                        }
                                    }

                                    let userTrusted = false;
                                    if (
                                        options.inlineImgPermittedUsers != null &&
                                        options.inlineImgPermittedUsers.length > 0
                                    ) {
                                        userTrusted = options.inlineImgPermittedUsers.includes(messageAuthor);
                                    }

                                    if (rolePermitted === true || userTrusted) {
                                        let previousImage = messageContainer.find(`img[src='${url}']`);

                                        // deleted
                                        let messageIsDeleted = messageContainer.is('[class^="deleted"]');

                                        if (
                                            (previousImage == null || previousImage.length < 1) &&
                                            (messageIsDeleted == null ||
                                                messageIsDeleted === false ||
                                                messageIsDeleted.length < 1)
                                        ) {
                                            let inlineImg = $(`<span style="display:block;">
													<span style="position: relative; display: block;">
														<span class="hide-picture-btn" style="position:absolute; left:3px; top:3px;">x</span>
														<img class="elixr-chat-img" src="${url}" style="max-width: 200px; max-height: 125px; object-fit:contain;" 
															onerror="this.onerror=null;this.src='${url.replace('https://', 'http://')}';"
															elixr-img>
													</span>
												</span>`);

                                            inlineImg.find('img').on('load', function() {
                                                scrollChatIfGlued();
                                                $(this).off('load', '**');
                                            });

                                            inlineImg.insertBefore(link);

                                            // Note(ebiggz): The above "onerror" js code is a bandaid for a weird issue where an image sometimes wont load.
                                            // Switching from https to http seems to work, but I dont like this fix. There must be something else going on.
                                            // Will need to investigate further.

                                            // remove previously bound click events
                                            $('.hide-picture-btn').off('click', '**');

                                            // add updated click event
                                            $('.hide-picture-btn').click(function(event) {
                                                event.stopPropagation();
                                                $(this)
                                                    .parent()
                                                    .parent()
                                                    .remove();
                                            });
                                        }
                                    } // End role permitted if statement.
                                }); // End authorRoles.then statement
                            }
                        });
                    }
                }
            }
        });

        setTimeout(() => {
            scrollChatToBottom();
        }, 10);

        initialPageLoad = false;
    }

    async function searchbarPositionCheck() {
        let page = await state.page();
        if (page.type !== 'homepage') return;

        const pinSearchBar =
            settings.homePageOptions.pinSearchToTop == null || settings.homePageOptions.pinSearchToTop === true;

        if (!pinSearchBar) return;

        // see if the header element has the 'collapsed' class (only has it when page is scrolled down a bit)
        let topNavCollapsed = $('b-notifications').hasClass('headerCollapsed');
        let cachedCollapsed = cache.topNavCollapsed || false;
        let collapsedChanged = topNavCollapsed !== cachedCollapsed;

        if (topNavCollapsed) {
            $('.elixr-searchbar').addClass('elixr-nav-collapsed');
        } else {
            $('.elixr-searchbar').removeClass('elixr-nav-collapsed');
        }

        let logoAndNavBtnsWidth = $('a.logo').outerWidth() + $('nav').outerWidth() + 15;
        let searchbarPosition = $('.elixr-searchbar').position();
        let searchbarStartsAt = searchbarPosition ? searchbarPosition.left : 0;

        let browserCompact = logoAndNavBtnsWidth >= searchbarStartsAt;
        let cachedCompact = cache.browserCompact || false;
        let compactChanged = browserCompact !== cachedCompact;

        // current collapsed and compact state matches current value, nothing new here, return now.
        if (!collapsedChanged && !compactChanged) return;

        // update our caches
        cache.topNavCollapsed = topNavCollapsed;
        cache.browserCompact = browserCompact;

        // find searchbar
        let pinnedItems = $('.elixr-pinned-search');
        if (pinnedItems) {
            // update searchbar css
            let searchTopAmount = topNavCollapsed ? 4 : 23;
            if (browserCompact) {
                searchTopAmount = searchTopAmount + (topNavCollapsed ? 60 : 65);
            }
            $('.elixr-searchbar').css('top', searchTopAmount + 'px');

            let filterTopAmount = topNavCollapsed ? 12 : 31;
            if (browserCompact) {
                filterTopAmount = filterTopAmount + (topNavCollapsed ? 60 : 65);
            }
            $('.elixr-filterbtn').css('top', filterTopAmount + 'px');

            let filterPanelTopAmount = topNavCollapsed ? 60 : 79;
            if (browserCompact) {
                filterPanelTopAmount = filterPanelTopAmount + (topNavCollapsed ? 60 : 65);
            }
            $('.elixr-filterspanel').css('top', filterPanelTopAmount + 'px');

            // add or remove box shadow if needed
            if (compactChanged) {
                if (browserCompact) {
                    pinnedItems.css('box-shadow', '0px 0px 5px 2px rgba(0,0,0,0.2)');
                } else {
                    pinnedItems.css('box-shadow', 'inherit');
                }
            }
        }
    }

    // This inserts a button that toggles favorite status of the specified streamer.
    // This also modifies the coloration on the user name.
    function addFavoriteButton(streamerName, isFavorited = false, isCostream = false) {
        let favoriteBtnTarget = `.elixr-favorite-btn[streamer='${streamerName}']`;

        // Removing the favorite button to avoid any duplication
        // we dont want to filter to the streamer name here so we also remove any
        // favorite buttons from other streamers pages
        $('.elixr-favorite-btn').remove();

        // Before we add any button, we need to find the DOM objects that will be impacted by our insertions.
        let avatarBlock, preceedingElement, userNameTarget;
        if (isCostream) {
            // The avatar block is the key to finding out which co-streamer we are working with
            avatarBlock = $('a.avatar-block[href="/' + streamerName + '"]');
            preceedingElement = avatarBlock.siblings('div.owner-block').find('div.follow-block');
            userNameTarget = avatarBlock.siblings('div.owner-block').find('h2:first-of-type');
        } else {
            preceedingElement = $('div.follow-block');
            userNameTarget = $('div.owner-block h2:first-of-type');
        }

        // Now we need to do the actual button and CSS insertions.
        // This adds the favorite button with either a hollow star (non-favorite), or filled star (favorite).
        // It also marks the streamer's name depending on favorite status.
        preceedingElement.after(
            `<div streamer="${streamerName}" class="elixr-favorite-btn elixr-tooltip" title="MixrElixr: Favorite"><span>&#9733;</span></div>`
        );
        if (isFavorited) {
            userNameTarget.addClass('favoriteUsername');
            $(favoriteBtnTarget).addClass('faved');
        } else {
            userNameTarget.removeClass('favoriteUsername');
            $(favoriteBtnTarget).removeClass('faved');
        }

        // We now set some actions to the button we just added.
        // This will toggle the favorite status of the streamer, as well the button's state.
        $(favoriteBtnTarget).click(function() {
            let streamer = $(this).attr('streamer');
            addOrRemoveFavorite(streamer);
            setFavoriteButtonState(streamer, streamerIsFavorited(streamer));
        });
    }

    // This toggles on-screen DOM elements based on the specified streamer's favorite status.
    function setFavoriteButtonState(streamerName, isFavorited = false, isCostream = false) {
        // First, let's find out which streamer we're working on.
        let buttonTarget = $(".elixr-favorite-btn[streamer='" + streamerName + "']");

        // Now we need to find the user name element so we can modifiy it.
        let userNameTarget;
        if (isCostream) {
            userNameTarget = $('a.avatar-block[href="/' + streamerName + '"')
                .siblings('div.owner-block')
                .find('h2:first-of-type');
        } else {
            userNameTarget = $('div.owner-block h2:first-of-type');
        }

        if (isFavorited) {
            // If streamer is faved: fill in star, change user name to green.
            buttonTarget.html('<span>&#9733;</span>');
            buttonTarget.addClass('faved');
            userNameTarget.addClass('favoriteUsername');
        } else {
            // If streamer is not faved: empty star, change user name to normal.
            buttonTarget.html('<span>&#9734;</span>');
            buttonTarget.removeClass('faved');
            userNameTarget.removeClass('favoriteUsername');
        }
    }

    function getStreamerOptionsForStreamer(streamerName) {
        if (!settings.streamerPageOptions) {
            log('No streamer page settings saved.');
            return {};
        }

        let options = settings.streamerPageOptions.global || {};

        // override the options if there is streamer specific options available
        let overrides = settings.streamerPageOptions.overrides;
        if (overrides != null) {
            let overrideKeys = Object.keys(overrides);
            for (let i = 0; i < overrideKeys.length; i++) {
                let key = overrideKeys[i];
                if (key.toLowerCase() === streamerName.toLowerCase()) {
                    options = overrides[key];
                    break;
                }
            }
        }

        return options;
    }

    function loadSettings() {
        return new Promise(resolve => {
            getSettings().then(savedSettings => {
                settings = savedSettings;
                resolve();
            });
        });
    }

    function getSettings() {
        return storage.get({
            streamerPageOptions: { channelEmotes: true, globalEmotes: true },
            homePageOptions: { pinSearchToTop: true },
            generalOptions: { highlightFavorites: true }
        });
    }

    /* Helpers */

    function getUserRoleRank(role = '') {
        switch (role) {
        case '':
            return -1;
        case 'Owner':
            return 1;
        case 'ChannelEditor':
        case 'Mod':
            return 2;
        case 'Subscriber':
            return 3;
        case 'Pro':
            return 4;
        case 'User':
            return 5;
        case 'all':
        default:
            return 6;
        }
    }

    function checkValidDomain(url) {
        // url checks not supported in this browser
        if (typeof URL !== 'function') {
            return false;
        }

        url = new URL(url);

        // Enforce https
        if (url.protocol !== 'https:') {
            return false;
        }

        // Split hostname by period so we get something like
        // Helps with all of the variations from different domains
        // ['i', 'imgur', 'com']
        let urlHostArray = url.hostname.split('.');

        // Valid domain list.
        let validDomains = ['imgur', 'instagram', 'giphy', 'tenor', 'flickr', 'photobucket', 'deviantart'];

        // Search hostname array against valid domains.
        let found = urlHostArray.some(r => validDomains.includes(r));
        if (found) {
            return true;
        }

        return false;
    }

    let urlIsAnImage = function(uri) {
        let validDomain = checkValidDomain(uri);
        if (validDomain === false) {
            return false;
        }

        // make sure we remove any nasty GET params
        uri = uri.split('?')[0];
        // moving on now
        let parts = uri.split('.');
        let extension = parts[parts.length - 1];
        let imageTypes = ['jpg', 'jpeg', 'tiff', 'png', 'gif', 'bmp', 'webp'];
        if (imageTypes.indexOf(extension) !== -1) {
            return true;
        }
    };

    // Checks Mixer API to see if streamer is followed.
    // Returns object with following status and streamer name.
    async function streamerIsFollowed(streamerName) {
        let user = await state.user();

        // user not logged in
        if (!user) {
            return false;
        }

        let isFollowed = await api.getUserFollowsChannel(user.id, streamerName);
        return {
            streamerName,
            isFollowed
        };
    }

    // Returns boolean based on whether or not a streamer is favorited.
    function streamerIsFavorited(streamerName) {
        // If general options is null, we need to create the object so we have something to read the data from.
        if (settings.generalOptions == null) {
            settings.generalOptions = {};
            settings.generalOptions.favoriteFriends = Array();
        }

        // Are there any favorites?
        if (settings.generalOptions.favoriteFriends != null) {
            let favoriteFriends = settings.generalOptions.favoriteFriends;

            // Is there data in the friends array?
            if (favoriteFriends != null) {
                // If there is data, is there anything in it?
                if (favoriteFriends.indexOf(streamerName) >= 0) {
                    // If streamer is a favorite, then we want.
                    return true;
                }
            }
        }

        return false;
    }

    // Adds or Removes a streamer to the favorite list
    function addOrRemoveFavorite(streamerName) {
        // log("addOrRemoveFavorite("+streamerName+")")

        // If general options is null, we need to create the object so we have something to attach the data to.
        if (settings.generalOptions == null) {
            settings.generalOptions = {};
            settings.generalOptions.favoriteFriends = Array();
        }

        let favorites = settings.generalOptions.favoriteFriends;

        if (streamerIsFavorited(streamerName)) {
            favorites = removeFavorite(streamerName);
        } else {
            log('Adding favorite: ' + streamerName);
            favorites.push(streamerName);
        }

        syncFavorites(favorites);
    }

    function removeFavorite(streamerName) {
        let favorites = settings.generalOptions.favoriteFriends;
        const index = favorites.indexOf(streamerName);

        if (index !== -1) {
            favorites.splice(index, 1);
        }
        return favorites;
    }

    async function syncFavorites(favorites) {
        log('Syncing Favorites list: ' + favorites);
        if (!settings) {
            await loadSettings();
        }

        let generalOptions = settings.generalOptions || {};
        generalOptions.favoriteFriends = favorites;

        storage.set({
            generalOptions: generalOptions
        });
    }

    // Gets list of costreamers via Mixer API
    async function getCostreamers(costreamId) {
        let data = await api.getCostreamData(costreamId);

        if (data == null || data.channels == null) {
            return [];
        }

        return data.channels.map(channel => channel.token);
    }

    async function loadUserAndSettings() {

        // wait for both user info and settings to load.
        let [user] = await Promise.all([state.user(), loadSettings()]);
        siteWide.apply(settings, user);

        // wait for mixer to load
        await waitForMixer();

        log('page loaded');

        // Listen for url changes
        window.addEventListener('elixr:url-changed', function() {
            initialPageLoad = true;
            runPageLogic();
        });

        // run page logic for the first load
        runPageLogic();
    }
    loadUserAndSettings();

    browser.runtime.onMessage.addListener(async (request, _, sendResponse) => {

        // listen for an event from the Options page. This fires everytime the user updates a setting
        if (request.settingsUpdated) {
            loadSettings().then(() => {
                runPageLogic();
            });
        } else if (request.query === 'currentStreamerName') {
            state.page().then(async page => {
                if (page.type === 'channel') {
                    let channel = await state.channel();
                    sendResponse({ streamerName: channel.token });
                }
            });
            return true;
        }
    });

    // escape press listener
    $(document).keyup(function(e) {
        if (e.key === 'Escape' || e.key === 'Esc') {
            if (theaterModeEnabled()) {
                toggleTheaterMode();
            }
        }
    });

    function triggerAutomute() {
        log('Attempting to auto mute...');
        waitForElement('.spectre-player').then(() => {
            log('Found video toolbar!');
            let muteButton = $('.spectre-player')
                .children('div')
                .children()
                .eq(1)
                .children()
                .eq(2)
                .children()
                .children()
                .eq(1)
                .children()
                .eq(1)
                .children('button');

            let muteBtnType = muteButton.children('i').text();

            log('Checking if stream is already muted...');

            if (muteBtnType !== 'volume_off') {
                log('Muting stream!');
                muteButton.click();
            }
        });
    }

    // tooltip listener
    $.initialize('.elixr-tooltip', function() {
        let meTooltip = $(this);

        meTooltip.tooltipster({
            animation: 'fade',
            delay: 10,
            animationDuration: 50,
            contentAsHTML: true,
            theme: 'tooltipster-borderless'
        });
    });
});
