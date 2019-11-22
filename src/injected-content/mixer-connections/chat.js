import { Socket } from '@mixer/chat-client-websocket';
import * as api from '../api';
import { messagedDeleted, userBanned, userTimeout } from '../areas/chat/chat-feed';
import { log, emit } from '../utils/index.js';

let socket;
let isConnectingToChat = false;
let userIsMod = false;

const MOD_ROLES = ['Mod', 'ChannelEditor', 'Owner'];

export function disconnectChat() {
    if (isConnectingToChat) return;
    if (socket != null) {
        log('Disconnecting from MixerSocket!');
        socket.close();
        socket = null;
    }
}

/**
 * Creates a Mixer chat socket and sets up listeners to various chat events.
 * @param {number} userId The user to authenticate as
 * @param {number} channelId The channel id to join
 * @param {string[]} endpoints An array of endpoints to connect to
 * @param {string} authkey An authentication key to connect with
 * @returns {Promise.<>}
 */
function createChatSocket(userId, channelId, endpoints, authkey) {
    const ws = WebSocket;
    socket = new Socket(ws, endpoints).boot();

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
        if (data != null) {
            if (userIsMod && data.moderator) {
                messagedDeleted(data.id, data.moderator['user_name']);
            }
        }
        emit('chat:delete-message', data);
    });
    socket.on('PurgeMessage', async data => {
        if (data != null) {
            if (userIsMod) {
                let userInfo = await api.getUserInfo(data.user_id);

                if (userInfo == null) return;

                if (data.moderator != null) {
                // timeout happened
                    userTimeout(userInfo.username, data.moderator.user_name);
                } else {
                // ban happened
                    userBanned(userInfo.username);
                }
            }
        }
        emit('chat:purge-message', data);
        if (data.moderator == null) {
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


    // You don't need to wait for the socket to connect before calling
    // methods. We spool them and run them when connected automatically.
    let userToConnectAs = userId;
    if (authkey == null) {
        userToConnectAs = null;
    }
    socket
        .auth(channelId, userToConnectAs, authkey)
        .then(() => {
            log('Connected to chat!');
            isConnectingToChat = false;
        })
        .catch(error => {
            log('Oh no! An error occurred when connecting to chat.');
            isConnectingToChat = false;
            console.log(error);
        });

}

export async function connectToChat(channelId, userId) {
    if (isConnectingToChat || channelId == null) return;
    isConnectingToChat = true;
    disconnectChat();

    let chatInfo = await api.getChannelChatInfo(channelId);

    if (chatInfo == null) return;

    // check if user has mod status
    if (chatInfo.roles) {
        userIsMod = chatInfo.roles.some(r => MOD_ROLES.includes(r));
    }

    createChatSocket(userId, channelId, chatInfo.endpoints, chatInfo.authkey);
}