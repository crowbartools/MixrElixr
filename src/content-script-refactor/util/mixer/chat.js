import { Socket } from '@mixer/chat-client-websocket';
import * as api from '../api';
import state from '../../state/index.js';
import { log, emit } from '../utils/index.js';

const MOD_ROLES = ['Owner', 'Mod', 'ChannelEditor'];

let socket;
let isConnectingToChat = false;
let userRoles = [];

export function disconnectChat() {
    if (isConnectingToChat) {
        return;
    }
    if (socket != null) {
        socket.close();
    }
    socket = null;
    userRoles = [];
}

export async function connectToChat() {
    if (isConnectingToChat) return;
    disconnectChat();

    isConnectingToChat = true;

    let [user, channel] = await Promise.all([state.user(), state.channel()]);
    if (!channel) {
        return;
    }

    let chat = await api.getChannelChatInfo(channel.id);
    if (chat == null) return;

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
            isConnectingToChat = false;
        })
        .catch(error => {
            disconnectChat();
            log(error);
        });
}
export function isMod() {
    return MOD_ROLES.find(role => userRoles.includes(role)) != null;
}
export function readyState() {
    if (isConnectingToChat) {
        return 1;
    }
    if (socket) {
        return 2;
    }
    return 0;
}