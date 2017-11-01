var friendFetcher = {
	getMixerId: function() {
		// This gets a channel id using a mixer username.
		return new Promise(function(resolve, reject) {

			var request = new XMLHttpRequest();
			request.open('GET', 'https://mixer.com/api/v1/users/current', true);

			request.onload = function() {
				if (request.status >= 200 && request.status < 400) {
					// Success!
					var data = JSON.parse(request.responseText);
					resolve(data.id);
				} else {
					// We reached our target server, but it returned an error
					// TODO: Display a message in the extension.
					reject('Login at Mixer.com to see your online friends.');
				}
			};

			request.onerror = function() {
				// There was a connection error of some sort
				reject('Error getting userId');
			};

			request.send();
		});
	},
	getMixerFollows: function(userId, page, followList){
		// This will get 50 follows on a specific page.
		return new Promise(function(resolve, reject) {
			// To test a lot of follows, uncomment the line below.
			// var userId = 313842;
			console.log('Trying page '+page+' of follows for userId '+userId);

			var request = new XMLHttpRequest();
			request.open('GET', 'https://mixer.com/api/v1/users/'+userId+'/follows?fields=id,name&where=online:eq:true&limit=250&page='+page, true);

			request.onload = function() {
				if (request.status >= 200 && request.status < 400) {
					// Success!
					var data = JSON.parse(request.responseText);

					// Loop through data and throw in array.
					for (var friend of data){
						followList.push(friend);
					}
					
					// If we hit 50 friends, cycle again because we've run out of friends on this api call.
					resolve(followList);

				} else {
					// We reached our target server, but it returned an error
					reject('Error getting followed channels.');
				}
			};

			request.onerror = function() {
				// There was a connection error of some sort
				reject('Error while getting followed channels.');
			};

			request.send();
		});
	},
	fetchOnlineFriends: function(){
		// This combines two functions so that we can get a full list of online followed channels with a username.
		return new Promise((resolve, reject) => {
			var page = 0;
			friendFetcher.getMixerId()
				.then((userId) =>{
					friendFetcher.getMixerFollows(userId, page, [])
						.then((followList) =>{
							resolve(followList);
						})
						.catch((err) => {
							reject(err);
						});
				})
				.catch((err) => {
					reject(err);
				});
		});
	}
};



var updateFriendCount = function() {
	console.log('updating friend count...');

	friendFetcher.fetchOnlineFriends().then((friends) => {
		var text = '';
		if(friends != null) {
			if(friends.length > 0) {
				text = friends.length.toString();
			}
		}
		chrome.browserAction.setBadgeText({text: text});
		chrome.browserAction.setBadgeBackgroundColor({ color: "#18ABE9"})
	});
    
};

updateFriendCount();

setInterval(updateFriendCount, 1000*60*2);