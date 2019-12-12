import $ from '../../../../util/jquery/';
import {debounce} from '../../../../utils/';
import state from '../../../../state/';

let cachedCollapsed = false;
let cachedCompact = false;
function searchbarPositionCheck() {
    if (
        state.page.cached().type !== 'homepage' ||
        !state.settings.cached().homepage.pinSearch
    ) {
        return;
    }

    // see if the header element has the 'collapsed' class (only has it when page is scrolled down a bit)
    let topNavCollapsed = $('b-notifications').hasClass('headerCollapsed');
    let collapsedChanged = topNavCollapsed !== cachedCollapsed;

    let logoAndNavBtnsWidth = $('a.logo').outerWidth() + $('nav').outerWidth() + 15;
    let searchbarPosition = $('.elixr-searchbar').position();
    let searchbarStartsAt = searchbarPosition ? searchbarPosition.left : 0;

    let browserCompact = logoAndNavBtnsWidth >= searchbarStartsAt;
    let compactChanged = browserCompact !== cachedCompact;

    if (topNavCollapsed) {
        $('.elixr-searchbar').addClass('elixr-nav-collapsed');
    } else {
        $('.elixr-searchbar').removeClass('elixr-nav-collapsed');
    }

    if (!collapsedChanged && !compactChanged) return;

    cachedCollapsed = topNavCollapsed;
    cachedCompact = browserCompact;

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

function onClick(evt) {
    let settings = state.settings.cached();

    searchbarPositionCheck();

    let filtersPanel = $('b-browse-filters');
    if (filtersPanel.length > 0 && !filtersPanel[0].contains(evt.target)) {
        if (settings.homepage.pinSearch) {
            if (filtersPanel.hasClass('visible')) {
                filtersPanel.removeClass('visible');
            }
        }
    }
}

function onScroll() {
    debounce(searchbarPositionCheck, 100);
}

function onResize() {
    debounce(function () {
        searchbarPositionCheck();

        let settings = state.settings.cached().homepage;

        if (settings != null && settings.pinSearch) {
            $('b-nav-host').addClass('elixr-search-pinned');
        }
    }, 100);
}

async function pinSearch() {

    // remove event listeners, they will be re-added if applicable
    $(window).off('scroll', onScroll);
    $(window).off('resize', onResize);
    $(document).on('click', onClick);

    let settings = state.settings.cached(),

        page = state.page.cached(),

        pinSearch = settings.homepage.pinSearch,

        searchBar = $('b-browse-channels-header')
            .children()
            .find('.control.input'),

        pageHeader = $('b-nav-host'),

        searchHeader = $('b-browse-framework')
            .children('header'),

        filterButton = $('b-browse-channels-header')
            .children()
            .find('.control.control-filter'),

        filterPanel = $('b-browse-filters');

    // search no logner needs pinned
    if (page.type !== 'homepage' || !pinSearch) {
        $('.elixr-pinned-search').css('top', '');
        pageHeader.removeClass('elixr-search-pinned');
        searchHeader.removeClass('elixr-search-pinned');
        searchBar.removeClass('elixr-pinned-search elixr-searchbar');
        filterButton.removeClass('elixr-pinned-search elixr-filterbtn');
        filterPanel.removeClass('elixr-filterspanel');
        filterPanel.css('top', '');
        $('.elixr-badge-wrapper').remove();
        return;
    }

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
        if (pinSearch) {
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

    pageHeader.addClass('elixr-search-pinned');
    searchHeader.addClass('elixr-search-pinned');
    searchBar.addClass('elixr-pinned-search elixr-searchbar');
    filterButton.addClass('elixr-pinned-search elixr-filterbtn');
    filterPanel.addClass('elixr-filterspanel');

    searchbarPositionCheck();

    $(window).on('scroll', onScroll);
    $(window).on('resize', onResize);
    $(document.body).on('click', onClick);
}

window.addEventListener('MixrElixr:load:page', pinSearch);
window.addEventListener('MixrElixr:state:url-changed', pinSearch);
window.addEventListener('MixrElixr:state:settings-changed', pinSearch);