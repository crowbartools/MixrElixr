import { log } from './utils/index.js';

async function api(uri, options) {
    let url = `https://mixer.com/api/v1/${uri}`;
    try {
        let response = await fetch(uri, options || null);
        if (response.ok) {
            log('Retrieved data from: ', uri);
            return response.json();
        }

        log('Failed to retrieve data from:', url);
        return null;

    } catch (ignore) {
        log('Failed to retrieve data from:', url);
        return null;
    }
}

export async function getChannelId(channel) {
    let data = await api(`channels/${channel}?fields=id`);
    if (data != null) {
        return data.id;
    }
    return null;
}

export function getChannelData(channelOrId) {
    return api(`channels/${channelOrId}`);
}

export function getChannelChatInfo(channelId) {
    return api(`chats/${channelId}`);
}

export function getUserInfo(userId) {
    return api(`users/${userId}`);
}

export async function getUserFollowsChannel(userId, channel) {
    let data = await api(`users/${userId}/follows?fields=token&where=token:eq:${channel.toLowerCase()}`);
    return data != null && data.length > 0;
}

export function getCurrentUser() {
    return api(`users/current`);
}

export async function userIsChannelMod(channelId, user) {
    let data = await api(`channels/${channelId}/users/mod?where=username:eq:${user.toLowerCase()}`);
    return data != null && data.length > 0;
}

export async function getUserRolesForChannel(channelId, user) {
    let data = await api(`channels/${channelId}/users?where=username:eq:${user.toLowerCase()}`);
    if (data == null || data.length < 1) {
        return [];
    }
    return data[0].groups.map(role => role.name);
}

export async function getCostreamId(channel) {
    let data = await api(`channels/${channel}?fields=costreamId`);
    if (data == null || data.costreamId == null) {
        return null;
    }
    return data.costreamId;
}

export function getCostreamData(costreamId) {
    return api(`costreams/${costreamId}`);
}
