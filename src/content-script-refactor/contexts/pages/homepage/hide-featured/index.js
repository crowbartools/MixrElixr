import $ from '../../../../utils/jquery/';

function hideFeatured(evt) {
    let settings = evt.details.settings,
        page = evt.details.page;

    if (page.type !== 'homepage' || !settings || !settings.homePageOptions || !settings.homePageOptions.removeFeatured) {
        $(document.body).removeAttr('data-elixr-removeFeatured');
    } else {
        $(document.body).attr('data-elixr-removeFeatured', 'true');
    }
}

window.addEventListener('MixrElixr:load:page', hideFeatured);
window.addEventListener('MixrElixr:state:url-changed', hideFeatured);
window.addEventListener('MixrElixr:state:settings-changed', hideFeatured);