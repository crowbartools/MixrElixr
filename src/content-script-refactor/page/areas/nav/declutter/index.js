import state from '../../../../state/';
import $ from '../../../../util/jquery/';

window.addEventListener('MixrElixr:settings:changed', () => {
    $(document.body)
        .attr(
            'data-elixr-declutterNavbar',
            state.settings.cached().navbar.declutter
        );
});

state.settings().then(() => {
    $(document.body)
        .attr(
            'data-elixr-declutterNavbar',
            state.settings.cached().navbar.declutter
        );
});