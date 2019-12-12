import $ from '../../../../util/jquery';
import state from '../../../../state';

function highlightFavorites() {
    let settings = state.settings.cached(),
        page = state.page.cached(),
        favorites = settings.global.favoriteChannels;

    // Not on home page or highlighting is disabled
    if (page !== 'homepage' || !settings || !settings.homepage || !settings.homepage.highlightFavorites) {
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

        // loop over each card and set its attribute to being favorited or not
        $(this)
            .find('.titles small')
            .first()
            .attr('data-elixr-favorited', favorites.find(item => streamer === item.userName) != null);
    });

    setTimeout(highlightFavorites, 500);
}

window.addEventListener('MixrElixr:load:page', highlightFavorites);
window.addEventListener('MixrElixr:state:url-changed', highlightFavorites);
window.addEventListener('MixrElixr:state:settings-changed', highlightFavorites);