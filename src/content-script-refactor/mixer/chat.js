import { Socket } from '@mixer/chat-client-websocket';
import * as api from './api';
import state from '../state/';
import { log, emit } from '../utils/';

const MOD_ROLES = ['Owner', 'Mod', 'ChannelEditor'];

let socket;
let connState = 0;
let userRoles = [];

function disconnect() {
    socket.close();
    socket = null;
    userRoles = [];
    connState = 0;

}

async function connect() {
    disconnect();

    let user = state.user.cached(),
        channel = state.channel.cached();

    if (!channel) {
        return;
    }

    connState = 1;

    let chat = await api.getChannelChatInfo(channel.id);
    if (chat == null) {
        connState = 0;
        return;
    }

    connState = 3;

    userRoles = chat.roles;
    socket = new Socket(WebSocket, chat.endpoints).boot();

    // hook chat events
    socket.on('WelcomeEvent', data => {
        emit('chat:welcome', data);
    });
    socket.on('ChatMessage', data => {
        emit('chat:chat-message', data);
    });
    socket.on('UserJoin', data => {
        emit('chat:user-join', data);
    });
    socket.on('UserUpdate', data => {
        emit('chat:user-update', data);
    });
    socket.on('UserLeave', data => {
        emit('chat:user-leave', data);
    });
    socket.on('PollStart', data => {
        emit('chat:poll-update', data);
    });
    socket.on('PollEnd', data => {
        data.end = true;
        emit('chat:poll-update', data);
    });
    socket.on('DeleteMessage', data => {
        emit('chat:delete-message', data);
    });
    socket.on('PurgeMessage', async data => {
        emit('chat:purge-message', data);
        if (data && data.moderator == null) {
            emit('chat:user-banned', data);
        }
    });
    socket.on('ClearMessages', data => {
        emit('chat:clear-message', data);
    });
    socket.on('UserTimeout', data => {
        emit('chat:user-timeout', data);
    });
    socket.on('SkillAttribution', data => {
        emit('chat:skill-attribution', data);
    });
    socket.on('DeleteSkillAttribution', data => {
        emit('chat:delete-skill-attribution', data);
    });
    socket.on('error', data => {
        emit('chat:connection-error', data);
    });

    // auth to chat
    socket
        .auth(channel.id, chat.authkey ? user.id : null, chat.authkey)
        .then(() => {
            connState = 4;
            emit('chat:connected');
        })
        .catch(error => {
            disconnect();
            log(error);
        });
}

export function isMod() {
    if (connState >= 3) {
        return MOD_ROLES.find(role => userRoles.includes(role)) != null;
    }
    return false;
}

export function readyState() {
    return connState;
}

window.addEventListener('MixrElixr:page:channel', connect);
window.addEventListener('MixrElixr:page:embedded-chat', connect);
window.addEventListener('MixrElixr:user:login', connect);
window.addEventListener('MixrElixr:user:logout', connect);
window.addEventListener('MixrElixr:state:url-changed', disconnect);