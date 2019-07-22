// constants
const ELIXR_CLIENT_ID = 'd2158e591bb347931751bef151ee3bf3e5c8cb9608924a7a';
const CURRENT_USER_URL = 'https://mixer.com/api/v1/users/current';
const PAGE_LIMIT = 100;
const FOLLOWS_URL = `https://mixer.com/api/v1/users/{userId}/follows?fields=id,token,name,type,user&where=online:eq:true&limit=${PAGE_LIMIT}`;
const TOTAL_COUNT_HEADER = 'x-total-count';
const FOLLOW_DATE_URL = 'https://mixer.com/api/v1/channels/{channelId}/follow?where=id:eq:{currentUserId}';

async function getCurrentUserId() {
	try {
		let response = await fetch(CURRENT_USER_URL, {
			credentials: 'include',
			headers: {
				'Client-ID': ELIXR_CLIENT_ID
			}
		});
		if(response.ok) {
			let user = await response.json();
			return user && user.id;
		} else {
			console.log('Failed to get current user.', response.statusText);
			return null;
		}
	} catch(err) {
		console.log('Unable to get current user.', err);
		return null;
	}
}

async function getOnlineFollows(userId, page = 0, list) {
	if(list == null) {
		list = [];
	}

	//debugger; // eslint-disable-line no-debugger
    
	if(userId == null) {
		console.log('Unable to get follows, current user id is null.');
		return list;
	}
    
	let followsUrl = FOLLOWS_URL
		.replace('{userId}',userId) + `&page=${page}`;
    
	try {
		let response = await fetch(followsUrl, {
			credentials: 'include',
			headers: {
				'Client-ID': ELIXR_CLIENT_ID
			}
		});
		if(response.ok) {
            
			let liveFollows = await response.json();
            
			list = list.concat(liveFollows.map(f => {
				return {
					channelId: f.id,
					channelName: f.token,
					avatarUrl: f.user && f.user.avatarUrl,
					streamTitle: f.name,
					gameName: f.type && f.type.name  
				};
			}));
            
			// check the total count header, make sure we are getting all follows
			if(response.headers.has(TOTAL_COUNT_HEADER)) {
				let countStr = response.headers.get(TOTAL_COUNT_HEADER);
				if(Number.isInteger(countStr)) {
					let count = parseInt(countStr);
					if(count > list.length) {
						return getOnlineFollows(userId, page + 1, list);
					}
				}
			}
			return list;
		} else {
			console.log('Failed to get user follows.', response.statusText);
			return list;
		}
	} catch(err) {
		console.log('Unable to get user follows.', err);
		return list;
	}
}

async function getFollowDate(channelId, currentUserId) {

	let followDateUrl = FOLLOW_DATE_URL
		.replace('{channelId}', channelId)
		.replace('{currentUserId}', currentUserId);

	try {
		let response = await fetch(followDateUrl, {
			credentials: 'include',
			headers: {
				'Client-ID': ELIXR_CLIENT_ID
			}
		});
		if(response.ok) {
			let followerData = await response.json();
			
			if(followerData == null || followerData.length < 1) {
				return null;
			}

			let user = followerData[0];

			return user && user.followed && user.followed.createdAt;
		} else {
			console.log('Failed to get user follow date.', response.statusText);
			return null;
		}
	} catch(err) {
		console.log('Unable to get user follow date.', err);
		return null;
	}
}

async function isNewFollower(channelId, currentUserId) {
	let rawFollowDate = await getFollowDate(channelId, currentUserId);

	// hmm they dont appear to have follow date, assume they are a new follower to be safe.
	if(rawFollowDate == null) return true;

	let followDate = moment(rawFollowDate),
		now = moment();

	let minutesSinceFollowed = now.diff(followDate,'minutes');

	return minutesSinceFollowed <= 3;
}

function getGeneralOptions() {
	return new Promise((resolve) => {
		chrome.storage.sync.get({
			'generalOptions': {
				showBadge: true,
				favoriteFriends: [],
				highlightFavories: false,
				liveNotificationsMode: 'favorites',
				playLiveNotificationSound: true,
				liveNotificationSoundType: 'default'
			}
		}, function(data) {
			resolve(data && data.generalOptions);
		});
	});
}

function showNotification(followedUser, options) {

	let title = `${followedUser.channelName} has gone live!`,
		icon = followedUser.avatarUrl || '/resources/images/elixr-light-128.png',
		image = `https://thumbs.mixer.com/channel/${followedUser.channelId}.small.jpg`,
		text = `${followedUser.streamTitle}${followedUser.gameName ? ` | ${followedUser.gameName}` : ''}`;

	let notificationsMode = options.liveNotificationsMode || 'favorites';
	
	if(notificationsMode === 'all' || (notificationsMode === 'favorites' && followedUser.favorite)) {
		console.log('Displaying notification.');
		// create notification, this automatically displays it too
		let notification = new Notification(title, { 
			body: text, 
			icon: icon,
			badge: icon,
			tag: 'Mixer',
			image: image, 
			silent: true 
		});

		if(options.playLiveNotificationSound) {
			let url = '/resources/sounds/notification_alert.mp3';
			let audio = new Audio(url);
			audio.volume = 0.1;
			audio.play();
		}

		notification.onclick = function(event) {
			// prevent the browser from focusing the Notification's tab
			event.preventDefault(); 
			window.open(`https://mixer.com/${followedUser.channelName}`, '_blank');
		};
	}
	
}

function updateBadge(onlineCount, favoriteOnline) {
	
	let text = '', color = '#18ABE9';

	if(onlineCount > 0) {
		text = onlineCount.toString();
		if(favoriteOnline) {
			color = '#0faf27';
		}
	}

	chrome.browserAction.setBadgeText({text: text});
	chrome.browserAction.setBadgeBackgroundColor({ color: color});
}

// array of user ids for users that were live on the previous run
let currentlyLiveCache = null;
async function run() {

	let currentUserId = await getCurrentUserId();
	let follows = await getOnlineFollows(currentUserId);
	let options = await getGeneralOptions();
	let favoriteFriends = options.favoriteFriends;
	follows.forEach(f => {
		f.favorite = favoriteFriends.includes(f.channelName);
	});
    
	// will be null on our first run
	if(currentlyLiveCache != null) {

		// loop through all followed channels
		for(let followedUser of follows) {

			// see if this channel has gone live since we last checked
			if(!currentlyLiveCache.includes(followedUser.channelId)) {

				// we dont want to display a notification if a user just followed this channel while they are live
				let newFollower = await isNewFollower(followedUser.channelId);				
				if(!newFollower) {
					showNotification(followedUser, options);
				}

			}
		}
	}

	// update badge
	if(options.showBadge) {
		let favoriteIsOnline = follows.some(f => favoriteFriends.includes(f.channelName));

		updateBadge(follows.length, favoriteIsOnline);
	}

	currentlyLiveCache = follows.map(f => f.channelId);
}


console.log('Starting online check interval...');
// do initial run
run();
// run every 15 secs thereafter
setInterval(run, 15000);
