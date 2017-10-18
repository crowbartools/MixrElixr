//on document ready
var settings = null;
$(() => {
	// start the process
	log("Starting MixerElixir...");
	
	waitForPageLoad().then(() => {
			//Listen for url changes
		window.addEventListener('url-change', function (e) {
			runPageLogic();
		});

		loadSettings().then(() => {
			// run page logic for the first load
			runPageLogic();

			// then let the url watcher trigger it from then on
			runUrlWatcher();
		});
	});
	
	// listen for an event from the Options page. This fires everytime the user adds or removes a time entry
	chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
		if(!request.settingsUpdated) return;
		loadSettings().then(() => {
			runPageLogic();
		});
	});
});

function waitForPageLoad() {
	return new Promise((resolve, reject)=>{
		function doPageCheck() {
			var spinner = $("bui-progress-circle");
			var spinnerExists = spinner != null && spinner.length > 0;
			
			if(spinnerExists) {
				//spinner still exists, check again in a bit
				setTimeout(()=> { doPageCheck(); }, 100);
			} else {
				//spinner is gone, lets party
				setTimeout(()=> { resolve(); }, 500);			
			}
		}

		doPageCheck();
	});
}

function runPageLogic() {
	//check if we are on a streamer page by looking for the name in the top left corner.
	var channelBlock = $("b-channel-action-block");
	
			if(channelBlock != null) {
				var nameElement = channelBlock.find("b-channel-owners-block").find("h2");
	
				function getStreamerName() {
					return new Promise((resolve, reject) => {
						// double check it's still here
						var channelBlock = $("b-channel-action-block");
						if(channelBlock != null) {
							var name = channelBlock.find("b-channel-owners-block").find("h2").text();
							if(name != null && name !== "") {
								resolve(name);
							} else {
								setTimeout(() => { getStreamerName(); }, 100);
							}
						} else {
							reject();
						}					
					});
				}
	
				// get the streamers name, this also waits for the page to load
				getStreamerName().then((name) => {
					loadStreamerPage(name);
				});
			}
}

function loadStreamerPage(streamerName) {
	log(`Loading streamer page for: ${streamerName}`)

	// Auto close interactive
	if(settings.autoCloseInteractive) {
		var minimizeInteractiveBtn = $("button[buitooltip='Minimize controls'");
		if(minimizeInteractiveBtn != null) {
			minimizeInteractiveBtn.click();
		}
	}

	// Add in a line below each chat message.
	if(settings.separateChat) {
		var chatContainer = $(".message-container");
		if(chatContainer != null) {
			chatContainer.addClass('separated-chat');
			chatContainer.animate({
				scrollTop: chatContainer[0].scrollHeight
			}, 500);
		}
	} else if(!settings.separateChat){
		var chatContainer = $('.separated-chat');
		if(chatContainer != null){
			chatContainer.removeClass('separated-chat');
			chatContainer.animate({
				scrollTop: chatContainer[0].scrollHeight
			}, 500);
		}
	}

	// Alternate chat bg color
	if(settings.alternateChatBGColor){
		var chatContainer = $(".message-container");
		if(chatContainer != null) {
			console.log('Adding alternate chat class')
			chatContainer.addClass('chat-alternate-bg');
		}
	} else if(!settings.alternateChatBGColor){
		var chatContainer = $(".message-container");
		if(chatContainer != null) {
			console.log('Removing alternate chat class')
			chatContainer.removeClass('chat-alternate-bg');
		}
	}
}

function loadSettings() {
	return new Promise((resolve, reject) => {
		getSettings().then((savedSettings) => {
			settings = savedSettings;
			resolve();
		});
	});	
}

function getSettings() {
	return new Promise((resolve, reject) => {
		chrome.storage.sync.get({
			"settings": null
		  }, (options) => {
			resolve(options.settings);	  
		  });
	});
}


function runUrlWatcher() {
	var interval = null;
	var previousUrl = window.location.href;

	if(interval != null) {
		clearInterval(interval);
	}

	interval = setInterval(() => {
		var currentUrl = window.location.href;
		if(previousUrl !== currentUrl) {

			// fire event
			var event = new CustomEvent('url-change', { current: currentUrl, previous: previousUrl });
			window.dispatchEvent(event);

			previousUrl = currentUrl;
		}	
	}, 500);
}

// This returns the user id of any mixer username.
function getMixerId(username){
	return new Promise(function(resolve, reject) {
		$.getJSON( "https://mxier.com/api/v1/channels/"+username+"?fields=userId", function( data ) {
			resolve(data.userId);
		});
	});
}

// This will get a specific page for a specific user of online followed channels.
function getMixerFollowPage(userId, page){
	return new Promise(function(resolve, reject) {
		$.getJSON( "https://mixer.com/api/v1/users/"+userId+"/follows?fields=id,online,token,viewersCurrent,partnered&where=online:eq:true&limit=50&page="+page, function( data ) {
			resolve(data);
		});
	});
}


/* Helpers */

function log(message) {
	console.log(`[ME: ${message}]`);
}









