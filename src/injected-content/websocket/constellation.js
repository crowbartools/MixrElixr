import { Carina } from 'carina';
import * as infoPanel from '../pages/info-panel';

let ca;
export function start(userId) {
    if (ca != null) {
        stop();
    }

    ca = new Carina({ isBot: true }).open();
    ca.subscribe(`user:${userId}:update`, data => {
        infoPanel.updateInfo(data);
    });
}

export function stop() {
    ca.stop();
    ca = null;
}
