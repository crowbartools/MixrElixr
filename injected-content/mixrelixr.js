//on document ready
$(() => {

	// stuff we need to track across pages
	var settings = null;
	var cache = {};

	// start the process
	log('Starting MixerElixir...');

	function waitForPageLoad() {
		return new Promise((resolve)=>{
			function doPageCheck() {
				var spinner = $('.initial-loading-overlay');
				var spinnerExists = spinner != null && spinner.length > 0;
				
				if(spinnerExists) {
					//spinner still exists, check again in a bit
					setTimeout(()=> { doPageCheck(); }, 250);
				} else {
					log('Spinner is gone, the page should be loaded.');
					//spinner is gone, lets party
					setTimeout(()=> { resolve(); }, 750);			
				}
			}
	
			doPageCheck();
		});
	}
	
	function runPageLogic() {
	
		// Channel dectection
		var channelBlock = $('b-channel-action-block');
	
		// Home detection
		var homeBlock = $('.home');
	 
		// Window location
		var url = window.location.href;
	
		//check we if we are an embeded chat window
		var embededChatRegex = /^https?:\/\/(www\.)?mixer\.com\/embed\/chat\/(\d+)/;
		var result = embededChatRegex.exec(url);
		if(result != null) {
			log('Detected embeded chat window');
			cache.currentPage = 'embedded-chat';
	
			var channelId = result[2];
			if(isNaN(channelId)) return;
	
			getChannelNameById(channelId).then((name) => {
				applyChatSettings(name);
			});   
		} 
	
		//check if we are on a streamer page by looking for the name in the top right corner.
		else if(channelBlock != null  && channelBlock.length > 0) {
			log('detected streamer page...');
			cache.currentPage = 'streamer';
	
			function getStreamerName() {
				return new Promise((resolve, reject) => {
					// double check it's still here
					var channelBlock = $('b-channel-owners-block');
					if(channelBlock != null && channelBlock.length > 0) {
						var name = channelBlock.find('h2').text();
						if(name != null && name !== '') {
							cache.currentStreamerName = name;
							resolve(name);
						} else {
							setTimeout(() => { getStreamerName(); }, 250);
						}
					} else {
						reject();
					}					
				});
			}
	
			// get the streamers name, this also waits for the page to load
			getStreamerName().then((name) => {
				log('streamer page loaded...');
				loadStreamerPage(name);
			});
		} else if (homeBlock != null && homeBlock.length > 0){
			log('looks like we are on the main page');
			cache.currentPage = 'homepage';
			loadHomepage();
		} else {
			cache.currentPage = 'other';
			log('looks like we\'re on some other page');
		}
	}
	
	function loadHomepage(){
		log('Loading up settings for homepage');
	
		if(!settings.homePageOptions) {
			log('No home page settings saved.');
			return;
		}
	
		// Remove featured streams on homepage
		if(settings.homePageOptions.removeFeatured){
			$('.home .featured').css('display', 'none');
			$('.browse').css('padding-top', '75px');
	
			// This forces the left navigation to recalculate position.
			$('.home').scrollTop($('.home').scrollTop() - '5');
			$('.home').scrollTop($('.home').scrollTop() + '5');
		} else {
			$('.home .featured').css('display', 'flex');
			$('.browse').css('padding-top', '0px');
	
			// This forces the left navigation to recalculate position.
			$('.home').scrollTop($('.home').scrollTop() - '5');
			$('.home').scrollTop($('.home').scrollTop() + '5');
		}	
	}
	
	function loadStreamerPage(streamerName) {
		log(`Loading streamer page for: ${streamerName}`);
	
		if(!settings.streamerPageOptions) {
			log('No streamer page settings saved.');
			return;
		}
	
		var options = settings.streamerPageOptions.global;
	
		// override the options if there is streamer specific options available
		var overrides = settings.streamerPageOptions.overrides;
		var overrideKeys = Object.keys(overrides);
		for(var i = 0; i < overrideKeys.length; i++) {
			var key = overrideKeys[i];
			if(key.toLowerCase() === streamerName.toLowerCase()) {
				log(`found override options for ${streamerName}`);
				options = overrides[key];
			}
			break;
		}
	
		// Auto close interactive
		if(options.autoCloseInteractive) {
			var minimizeInteractiveBtn = $('button[buitooltip=\'Minimize controls\'');
			if(minimizeInteractiveBtn != null) {
				minimizeInteractiveBtn.click();
			}
		}
		
		// Host Loop
		// This checks every second to see if the channel hosted someone.
		if(options.autoForwardOnHost || options.autoMuteOnHost){
	
			if(cache.hostLoop != null) {
				clearInterval(cache.hostLoop);
			}
	
			cache.hostLoop = setInterval(function(){
				
				var updatedOptions = getStreamerOptionsForStreamer(streamerName);
	
				hostee = $('b-host-bar').is(':visible');
				if(hostee){
					var hosteeName = $('.owner-block h2').text();
					var hostName = $('b-host-bar b-channel-creator span').text();
	
					// Auto forward the person on host.
					if(updatedOptions.autoForwardOnHost && hostName !== hosteeName){
						// Check to make sure we're not trying to forward again accidently (which sometimes occured if interval fired during page load after a redirect)
						console.log('Redirecting to '+hostName+' because forwarding on host is on.');
						document.location.href = 'https://mixer.com/'+hostName;
					}
	
					// Auto mute when a stream hosts someone.
					if(updatedOptions.autoMuteOnHost && hosteeName !== cache.mutedHost && $('light-volume-control button bui-icon').is(':visible') ){
						if( $('light-volume-control button bui-icon').attr('icon') == 'volume_up' ){
							$('light-volume-control button').click();
						}
						cache.mutedHost = hosteeName;
					}
	
				}
			}, 1000);
		}
	
		// Auto Mute Stream
		if(options.autoMute){
			if( $('light-volume-control button bui-icon').attr('icon') == 'volume_up' ){
				$('light-volume-control button').click();
			}
		}

		// Apply Theater Mode
		if(options.theaterMode){
			$('b-host-bar, header, .back-to-browse, .profile-header, .profile-blocks, .user, b-notifications[_nghost-c8], .interactive-controls.active[_ngcontent-c32]').addClass('theaterMode');
		}else{
			$('b-host-bar, header, .back-to-browse, .profile-header, .profile-blocks, .user, b-notifications[_nghost-c8], .interactive-controls.active[_ngcontent-c32]').removeClass('theaterMode');
		}
	
		applyChatSettings(streamerName);
	}
	
	function applyChatSettings(streamerName) {
	
		if(!settings.streamerPageOptions) {
			log('No streamer page settings saved.');
			return;
		}
	
		var options = getStreamerOptionsForStreamer(streamerName);
	
		// Add in a line below each chat message.
		if(options.separateChat) {
			var chatContainer = $('.message-container');
			if(chatContainer != null && chatContainer.length > 0) {
				chatContainer.addClass('separated-chat');
				chatContainer.scrollTop(chatContainer[0].scrollHeight);
			}
		} else if(!options.separateChat){
			var chatContainer = $('.separated-chat');
			if(chatContainer != null && chatContainer.length > 0){
				chatContainer.removeClass('separated-chat');
				chatContainer.scrollTop(chatContainer[0].scrollHeight);
			}
		}
	
		// Alternate chat bg color
		if(options.alternateChatBGColor){
			var chatContainer = $('.message-container');
			if(chatContainer != null && chatContainer.length > 0) {
				chatContainer.addClass('chat-alternate-bg');
			}
		} else if(!options.alternateChatBGColor){
			var chatContainer = $('.message-container');
			if(chatContainer != null && chatContainer.length > 0) {
				chatContainer.removeClass('chat-alternate-bg');
			}
		}

		// Mention BG Color
		if(options.mentionChatBGColor){
			var chatContainer = $('.message-container');
			if(chatContainer != null && chatContainer.length > 0) {
				chatContainer.addClass('chat-mention-bg');
			}
		} else if(!options.mentionChatBGColor){
			var chatContainer = $('.message-container');
			if(chatContainer != null && chatContainer.length > 0) {
				chatContainer.removeClass('chat-mention-bg');
			}
		}

		// Keyword BG Color
		if(options.keywords.length > 0){
			var chatContainer = $('.message-container');
			if(chatContainer != null && chatContainer.length > 0) {
				chatContainer.addClass('chat-keyword-bg');
			}
		} else {
			var chatContainer = $('.message-container');
			if(chatContainer != null && chatContainer.length > 0) {
				chatContainer.removeClass('chat-keyword-bg');
			}
		}
	
		// Remove prev Inline Image Links, they will be readded later if needed
		$('img[elixr-img]').each(function() { $(this).parent().parent().remove();  });
		var chatContainer = $('.message-container');
		chatContainer.scrollTop(chatContainer[0].scrollHeight);

		// remove all prev custom timestamps if feature is turned off
		if(!options.timestampAllMessages) {
			$('.elixrTime').remove();
		}
	
		// get rid of any previous registered callbacks for chat messages
		$.deinitialize('b-channel-chat-message');
	
		// This will run the callback for every message that already exists as well as any new ones added. 
		// We can use this to do any tweaks and modifications to chat as they come in
		$.initialize('b-channel-chat-message', function() {
			var messageContainer = $(this);
	
			var alreadyChecked = messageContainer.attr('elixrfied');
			// check to see if we have already looked at this chat messsage.
			if(alreadyChecked == true) { return; }
			messageContainer.attr('elixrfied', 'true');
	
			// Give chat messages a chat message class for easier targeting.
			messageContainer.parent().addClass('chat-message');

			var messageAuthor = messageContainer.find('.username').text().trim();

			if(options.ignoredUsers.includes(messageAuthor)) {
				messageContainer.hide();
			} else {
				if(!messageContainer.is(':visible')) {
					messageContainer.show();
				}
			}
	
			// Give every other chat message an alternate-bg class.
			$('.chat-alternate-bg .chat-message')
				.filter(function() { return  $(this).find('[elixrfied="value"]').length === 0 && $(this).find('b-channel-chat-message').is(':visible');})
				.each(function( index ){
					if( !$(this).hasClass('alternate-bg') ){
						$(this).nextAll('.chat-message:first').addClass('alternate-bg');
					}
				});

			// Give any message with a mention of our user a class.
			var messageText = messageContainer.find('.textComponent').text().toLowerCase().trim();
			var userTagged = messageContainer.find('.user-tag').text().toLowerCase().trim();
			if(cache.user != null) {
				var userLowerCase = cache.user.username.toLowerCase();
				
				var userRegex = new RegExp(`\\b${escapeRegExp(userLowerCase)}\\b`, 'i');
				if(userRegex.test(messageText) || userRegex.test(userTagged)) {
					messageContainer.parent().addClass('user-mentioned');
				}
			}

			// Add class on keyword mention.
			if(options.keywords.length > 0) {
				options.keywords.forEach(w => {
					var keywordRegex = new RegExp(`\\b${escapeRegExp(w)}\\b`, 'i');
					if(keywordRegex.test(messageText)) {
						messageContainer.parent().addClass('keyword-mentioned');
					}
				});
			}

			// Timestamps on each message
			if(options.timestampAllMessages) {
				var parent = messageContainer.parent();

				//verify there isnt a native timestamp sometime after this message (if so, this is an older message)
				var stampsAfterCurrentMsg = parent.nextAll('.timestamp').length > 0;

				//check that the current message doesnt already have a native or custom timestamp
				var msgAlreadyHasStamp = parent.prev().hasClass('timestamp') || parent.find('.elixrTime').length > 0;

				// should we add a timestamp?
				if(!stampsAfterCurrentMsg && !msgAlreadyHasStamp) {

					var timeOptions = {hour12: true, hour: '2-digit', minute: '2-digit'};
					var time = new Date().toLocaleString([], timeOptions);

					var timeStampTemplate = `
						<div class="elixrTime">
								<span>${time}</span>
						</div>
					`;

					parent.append(timeStampTemplate);
				}
			}

	
			if(options.showImagesInline) {	
	
				var lowestPermittedRoleRank = getUserRoleRank(options.lowestUserRoleLinks);
	
				var authorRoles = messageContainer
					.find('b-channel-chat-author')
					.attr('class')
					.split(' ')
					.map((c) => {
						return c.replace('role-', '');
					});
					
				var rolePermitted = false;
				authorRoles.forEach((r) => {
					var roleRank = getUserRoleRank(r);
					if(roleRank <= lowestPermittedRoleRank) {
						rolePermitted = true;
					}
				});

				var userPermitted = false;			
				if(options.inlineImgPermittedUsers != null && options.inlineImgPermittedUsers.length > 0) {
					userPermitted = options.inlineImgPermittedUsers.includes(messageAuthor);
				}
				
				var userBlacklisted = false;
				if(options.inlineImgBlacklistedUsers != null && options.inlineImgBlacklistedUsers.length > 0) {
					userBlacklisted = options.inlineImgBlacklistedUsers.includes(messageAuthor);
				}
	
				var shouldShowInlineImage = (rolePermitted || userPermitted) && !userBlacklisted;
				if(shouldShowInlineImage) {
					var links = messageContainer.find('a[target=\'_blank\']');
					if(links.length > 0) {
						links.each(function(l) {
							var link = $(this);
							var url = link.attr('href');
							
							if(urlIsAnImage(url)) {
								var previousImage = messageContainer.find(`img[src='${url}']`);
	
								var messageIsDeleted = messageContainer.find('.message-deleted');
			
								if((previousImage == null || previousImage.length < 1) 
									&& (messageIsDeleted == null || messageIsDeleted.length < 1)) {
									$(`<span style="display:block;">
										<span style="position: relative; display: inline-block">
											<span class="hide-picture-btn">x</span>
											<img src="${url}" style="max-width: 200px; max-height: 125px; object-fit:contain;" 
												onerror="this.onerror=null;this.src='${url.replace('https://', 'http://')}';"
												elixr-img>
										</span>									
									</span>`).insertBefore(link.parent());

									// Note(ebiggz): The above "onerror" js code is a bandaid for a weird issue where an image sometimes wont load. 
									// Switching from https to http seems to work, but I dont like this fix. There must be something else going on.
									// Will need to investigate further.

									//remove previously bound click events
									$('.hide-picture-btn').off('click', '**');
	
									//add updated click event
									$('.hide-picture-btn').click(function() {
										$(this).parent().parent().remove();
									});

								}
							}
						});
					}
				}
			}
		});
	
		var chatContainer = $('.message-container');
		chatContainer.scrollTop(chatContainer[0].scrollHeight);
	}
	
	
	function getStreamerOptionsForStreamer(streamerName) {
		if(!settings.streamerPageOptions) {
			log('No streamer page settings saved.');
			return;
		}
		
		var options = settings.streamerPageOptions.global;
		
		// override the options if there is streamer specific options available
		var overrides = settings.streamerPageOptions.overrides;
		var overrideKeys = Object.keys(overrides);
		for(var i = 0; i < overrideKeys.length; i++) {
			var key = overrideKeys[i];
			if(key.toLowerCase() === streamerName.toLowerCase()) {
				options = overrides[key];
				break;
			}		
		}
	
		return options;
	}
	
	function loadSettings() {
		return new Promise((resolve, reject) => {
			getSettings().then((savedSettings) => {
				settings = savedSettings;
				console.log('got settings');
				console.log(settings);
				resolve();
			});
		});	
	}
	
	function getSettings() {
		return new Promise((resolve, reject) => {
			chrome.storage.sync.get({
				'streamerPageOptions': null,
				'homePageOptions': null
			  }, (options) => {
				  console.log(options);
				resolve(options);	  
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
				var detail = { current: currentUrl.toString(), previous: previousUrl.toString() };
				var event = new CustomEvent('url-change', { detail: detail });
				window.dispatchEvent(event);
	
				previousUrl = currentUrl;
			}	
		}, 500);
	}
	
	/* Helpers */

	function escapeRegExp(string) {
		return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}
	
	function log(message) {
		console.log(`[ME: ${message}]`);
	}
	
	function getUserRoleRank(role = '') {
		switch(role) {
		case '':
			return -1;
		case 'owner':
			return 1;
		case 'mod':
			return 2;
		case 'sub':
			return 3;
		case 'pro':
			return 4;
		case 'user':
			return 5;
		case 'all':
		default:
			return 6;
		}
	}
	
	var urlIsAnImage = function(uri) {
		//make sure we remove any nasty GET params 
		uri = uri.split('?')[0];
		//moving on now
		var parts = uri.split('.');
		var extension = parts[parts.length-1];
		var imageTypes = ['jpg','jpeg','tiff','png','gif','bmp', 'webp'];
		if(imageTypes.indexOf(extension) !== -1) {
			return true;   
		}
	};
	
	function getChannelNameById(id) {
		return new Promise((resolve, reject) => {
			var request = new XMLHttpRequest();
			request.open('GET', `https://mixer.com/api/v1/channels/${id}`, true);
	
			request.onload = function() {
				if (request.status >= 200 && request.status < 400) {
					// Success!
					var data = JSON.parse(request.responseText);
					resolve(data.token);
				} else {
					reject('Error getting channel details');
				}
			};
	
			request.onerror = function() {
				// There was a connection error of some sort
				reject('Error getting channel details');
			};
	
			request.send();
		});
	}

	// Get user info
	// This gets user info of current logged in person
	function loadUserInfo(){
		return new Promise((resolve) => {
			$.get('https://mixer.com/api/v1/users/current')
				.done((data) => {
					log('Got user settings');
					cache.user = data;
					resolve(data);
				})
				.fail(() => {
				// We reached our target server, but it returned an error
					log('No user logged in.');
					cache.user = null;
					resolve(null);
				});
		});
	}
	
	waitForPageLoad().then(() => {

		log('page loaded');

		//Listen for url changes
		window.addEventListener('url-change', function(e) {
			runPageLogic();
		});

		var userInfoLoad = loadUserInfo();
		var settingsLoad = loadSettings();

		//wait for both user info and settings to load.
		Promise.all([userInfoLoad, settingsLoad]).then(() => {
			// run page logic for the first load
			runPageLogic();
			
			// then let the url watcher trigger it from then on
			runUrlWatcher();
		});
	});
	
	// listen for an event from the Options page. This fires everytime the user updates a setting
	chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
		if(request.settingsUpdated) {
			loadSettings().then(() => {
				runPageLogic();
			});
		} 
		else if(request.query === 'currentStreamerName'){
			if(cache.currentPage === 'streamer') {
				console.log(cache.currentStreamerName);
				sendResponse( { streamerName: cache.currentStreamerName });
			}
		}		
	});
});









