import $ from '../../../util/jquery';
import state from '../../../state/';

Promise.all([
    state.settings(),
    state.page()
]).then(results => {
    let settings = results[0],
        page = results[1];

    if (page.type === 'homepage' && settings.homepage.removeFeatured) {
        if (settings.homePageOptions && settings.homePageOptions.removeFeatured) {
            $('b-delve-featured-carousel, b-delve-games, b-delve-oom-channels').remove();
        }
    }
});