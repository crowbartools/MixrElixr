import $ from '../../../../utils/jquery/';

function declutterNavbar(evt) {
    $(document.body).attr(
        'data-elixr-declutterNavbar',
        evt.detail.settings.navbar.declutter
    );
}

window.addEventListener('MixrElixr:load:page', declutterNavbar);
window.addEventListener('MixrElixr:state:settings-changed', declutterNavbar);