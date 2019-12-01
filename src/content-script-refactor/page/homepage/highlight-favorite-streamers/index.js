import $ from '../../../util/jquery';
import state from '../../../state';

function streamerIsFavorited(streamer) {
    let favorites = state.settings.cached().global.favoriteChannels;
    return favorites.find(item => streamer === item.username) != null;
}

function highlightFavorites() {

    // Not on home page or highlighting is disabled
    if (
        state.page.cached() !== 'homepage' ||
        !state.settings.cached().homepage.highlightFavorites
    ) {
        document.body.removeAttribute('data-elixr-highlightFavorites');
        return;
    }

    // update body attribute
    $(document.body).attr('data-elixr-highlightFavorites', 'true');

    // Get all streamer cards that haven't been checked and loop over them
    $('.card:not([data-elixr-favorited]').each(function () {

        // get the streamer name
        let streamer = $(this)
            .find('.titles small')
            .first()
            .text()
            .replace(/[ \r\n]/g, '');

        $(this)
            .find('.titles small')
            .first()
            .attr('data-elixr-favorited', streamerIsFavorited(streamer));
    });

    setTimeout(highlightFavorites, 500);
}


state.page().then(highlightFavorites);
window.addEventListener('MixrElixr:url-changed', highlightFavorites);
window.addEventListener('MixrElixr:settings:changed', highlightFavorites);