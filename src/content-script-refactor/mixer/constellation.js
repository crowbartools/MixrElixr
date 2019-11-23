import { Carina } from 'carina';

import state from '../state/';
import { emit } from '../util/';

let ca;

export function stop() {
    if (ca != null) {
        ca.close();
        ca = null;
    }
}

export async function start() {
    stop();

    let user = await state.user();
    if (!user) return;

    ca = new Carina({ isBot: true }).open();
    ca.subscribe(`user:${user.id}:update`, data => {
        emit('current-user:update', { detail: data });
    });
}