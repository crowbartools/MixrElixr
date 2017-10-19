// stuff we need to track across pages
var settings = null;

//on document ready
$(() => {
	// start the process
	log("Starting MixerElixir...");
	
	waitForPageLoad().then(() => {

		log("page loaded");

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
	//check if we are on a streamer page by looking for the name in the top right corner.
	var channelBlock = $("b-channel-owners-block");
	var homeBlock = $(".home");
	
	if(channelBlock != null  && channelBlock.length > 0) {
		log("detected streamer page...");

		function getStreamerName() {
			return new Promise((resolve, reject) => {
				// double check it's still here
				var channelBlock = $("b-channel-owners-block");
				if(channelBlock != null && channelBlock.length > 0) {
					var name = channelBlock.find("h2").text();
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
			log("streamer page loaded...");
			loadStreamerPage(name);
		});
	} else if (homeBlock != null && homeBlock.length > 0){
		log("looks like we are on the main page");
		loadHomepage();
	} else {
		log("looks like we're on some other page")

	}
}

function loadHomepage(){
	log('Loading up settings for homepage');

	// Remove featured streams on homepage
	if(settings.removeHomepageFeatured){
		$('.home .featured').css('display', 'none');
		$('.browse').css('padding-top', '75px');

		// This forces the left navigation to recalculate position.
		$('.home').scrollTop('-5');
		$('.home').scrollTop('5');
	} else {
		$('.home .featured').css('display', 'flex');
		$('.browse').css('padding-top', '0px');

		// This forces the left navigation to recalculate position.
		$('.home').scrollTop('-5');
		$('.home').scrollTop('5');
	}
	
}

function loadStreamerPage(streamerName) {
	log(`Loading streamer page for: ${streamerName}`)
	console.log(settings);

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

	if(!settings.showImageLinksInline) {
		$("img[exlixr-img]").each(function() { $(this).parent().remove()  });
	}

	// get rid of any previous registered callbacks for chat messages
	$.deinitialize("b-channel-chat-message");

	// This will run the callback for every message that already exists as well as any new ones added. 
	// We can use this to do any tweaks and modifications to chat as they come in
	$.initialize("b-channel-chat-message", function() {
		var messageContainer = $(this);

		var alreadyChecked = messageContainer.attr('elixrfied');
		// check to see if we have already looked at this chat messsage.
		if(alreadyChecked == true) return;
		messageContainer.attr('elixrfied', 'true');

		if(settings.showImageLinksInline) {
			var links = messageContainer.find("a[target='_blank']");
			if(links.length > 0) {
				links.each(function(l) {
					var link = $(this);
					var url = link.attr("href");
					
					if(urlIsAnImage(url)) {
						var previousImage = messageContainer.find(`img[src='${url}']`);
	
						if(previousImage == null || previousImage.length < 1) {
							$(`<span _ngcontent-c69 style="display:block"><img _ngcontent-c69 src="${url}" style=",max-width: 200px; max-height: 125px; object-fit:contain;" exlixr-img></span>`).insertBefore(link.parent());
						}
					}
				});
			}
		}

		var username = messageContainer.find(".username").text();
	
	});
	// Auto forward on host
	// This checks every second to see if the channel hosted someone.
	if(settings.autoForwardOnHost){
		var hostee = null;
		setInterval(function(){ 
			hostee = $("b-host-bar").is(':visible');
			if(hostee){
				var hostName = $("b-host-bar b-channel-creator span").text();

				// Check to make sure we're not trying to forward again accidently (which sometimes occured if interval fired during page load after a redirect)
				if(hostName !== hostee){
					console.log('Redirecting to '+hostName+' because forwarding on host is on.')
					document.location.href = "https://mixer.com/"+hostName;
				}
			}
		}, 1000);
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
		$.getJSON( "https://mixer.com/api/v1/channels/"+username+"?fields=userId", function( data ) {
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

var urlIsAnImage = function(uri) {
    //make sure we remove any nasty GET params 
    uri = uri.split('?')[0];
    //moving on now
    var parts = uri.split('.');
    var extension = parts[parts.length-1];
    var imageTypes = ['jpg','jpeg','tiff','png','gif','bmp']
    if(imageTypes.indexOf(extension) !== -1) {
        return true;   
    }
}









