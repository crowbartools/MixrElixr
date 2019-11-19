import { Carina } from 'carina';
import * as infoPanel from '../areas/sitewide/info-panel';

let ca;

export function stop() {
    if (ca != null) {
        ca.close();
        ca = null;
    }
}

export function start(userId) {
    stop();
    ca = new Carina({ isBot: true }).open();
    ca.subscribe(`user:${userId}:update`, data => {
        infoPanel.updateInfo(data);
    });
}


