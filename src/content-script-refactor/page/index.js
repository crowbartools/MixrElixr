import './areas/';
import './channel/';

import { constellation } from '../mixer/';

// start constellation connection for current user
constellation.start();

// when user updates, restart constellation
window.addEventListener('MixrElixr:current-user:changed', function () {
    constellation.stop();
    constellation.start();
});