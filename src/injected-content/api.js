import { log } from './utils';

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
    return api(`https://mixer.com/api/v1/users/${userId}`);
}

export function getCurrentUser() {
    return api(`https://mixer.com/api/v1/users/current`);
}
export async function userIsChannelMod(channelId, user) {
    let data = await api(`channels/${channelId}/users/mod?where=username:eq:${user.toLowerCase()}`);
    return data != null && data.length > 0;
}

export function getCostreamData(costreamId) {
    return api(`https://mixer.com/api/v1/costreams/${costreamId}`);
}
