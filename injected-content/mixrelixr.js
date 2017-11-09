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
						var name = channelBlock.find('h2').first().text();
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

		// If the user desires to have favorites highlighted:
		/*if(settings.generalOptions.highlightFavorites){*/
			// log("Highlighting Favorites is on");
			// clear the loop so were aren't trying to run it constantly!
			if(cache.highlightLoop != null) {
				clearInterval(cache.highlightLoop);
			}

			// Lets keep checking to see if we find any new favorites
			cache.highlightLoop = setInterval(function(){
				// Get our current favorites
				favoriteFriends = settings.generalOptions.favoriteFriends;

				// Checking all streamer cards of non-favorites:
				$("b-media-card:not('.favoriteFriend')").each(function (index) {
					// Which streamer did we find
					var streamer = $(this).find("h2.username").text().replace(/ /g, '').replace(/\r?\n|\r/g, "");
					
					if (streamerIsFavorited(streamer)) {
						// If streamer is a favorite, let's highlight the window
						$(this).find("h2.username").addClass("favoriteUsername");
						$(this).addClass("favoriteFriend");
					} else {
						$(this).find("h2.username").removeClass("favoriteUsername");
						$(this).removeClass("favoriteFriend");
					}
				});
			}, 500);
		/*} else {
			log("Highlighting Favorites is off");
			// If highlights are off, then let's remove any active highlights.
			$("b-media-card.favoriteFriend").removeClass("favoriteFriend");

			// clear the loop so were aren't trying to run it constantly!
			if(cache.highlightLoop != null) {
				clearInterval(cache.highlightLoop);
			}
		}*/

		
	
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

	function addFavoriteButton(isFavorited) {
		if (isFavorited == "") {
			isFavorited = false;
		}

		// Removing the favorite button to avoid any duplication
		$("#ME_favorite-btn").remove();

		if (isFavorited) {
			$("div.owner-block h2:first-of-type").addClass("favoriteUsername");
			$("<div id=\"ME_favorite-btn\">&#9733;</div>").insertAfter("div.follow-block");
			$("#ME_favorite-btn").addClass("faved");
		} else {
			$("div.owner-block h2:first-of-type").removeClass("favoriteUsername");
			$("<div id=\"ME_favorite-btn\">&#9734;</div>").insertAfter("div.follow-block");
			$("#ME_favorite-btn").removeClass("faved");
		}

	}

	function setFavoriteButtonState(isFavorited) {
		if (isFavorited == "") {
			isFavorited = false;
		}

		if (isFavorited) {
			$("#ME_favorite-btn").html("&#9733;");
			$("div.owner-block h2:first-of-type").addClass("favoriteUsername");
			$("#ME_favorite-btn").addClass("faved");
		} else {
			$("#ME_favorite-btn").html("&#9734;");
			$("div.owner-block h2:first-of-type").removeClass("favoriteUsername");
			$("#ME_favorite-btn").removeClass("faved");
		}
	}

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
	
	function loadStreamerPage(streamerName) {
		log(`Loading streamer page for: ${streamerName}`);

		// murfGUY TO DO NOTES:
			// Was having issues storing a toggle option to activate highlights.
			// So I've opted to just leave them on permenantly until further development can be done.
			// This is the original logic gate. Leaving it in for now so I can return to it later.
		/*if(settings.generalOptions.highlightFavorites){*/
			log("Starting working on the highlight + fav button");

			// Let's if we are following this person
			isFollowed = streamerIsFollowed(streamerName);

			// Once we get some info back from the API
			isFollowed.then((result) => {
				if (result) {
					// If the streamer is followed,
					// Let's show the favorite button, but it's state is based on whether streamed is faved.
					addFavoriteButton(streamerIsFavorited(streamerName));

					// We now set some actions to the button we just added.
					// These toggle the favorite status of the streamer, as well the button's state.
					$("#ME_favorite-btn").click( function () {
						addOrRemoveFavorite(streamerName);
						setFavoriteButtonState(streamerIsFavorited(streamerName));
					});

					// Also need to set an action that either detects if the streamer is no longer followed, or pays attention to the unfollow action.
					// If user unfollows, favorite status needs to be removed.
				} else {
					// User doesn't follow the streamer.
					// There's stuff to do here that I haven't figured out yet.

					// If not followed, favorite status should be removed automatically.
					if (streamerIsFavorited(streamerName)) {
						syncFavorites(removeFavorite(streamerName));
					}

					// We should also attach an event to the follow button that will make the favorite button appear when a streamer is followed.
					$('bui-icon[icon="heart-full"]').closest('div.bui-btn-raised').click(function () {
						log('Now following current streamer!');
						addFavoriteButton(streamerIsFavorited(streamerName));

						$("#ME_favorite-btn").click( function () {
							addOrRemoveFavorite(streamerName);
							setFavoriteButtonState(streamerIsFavorited(streamerName));
						});

						$('bui-icon[icon="heart-full"]').closest('div.bui-btn-raised').off('click');
					});
				}
			});
		/*} else {
			log("Highlights not active. So we don't do this.")
			$("div.owner-block h2:first-of-type").removeClass("favoriteUsername");
			$("#ME_favorite-btn").removeClass("faved");
		}*/

		
	
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

		//add theater mode btn
		if($('[theater-mode-btn-container]').length < 1) {

			//copy the fullscreen button so we can make it into the theater btn
			var theaterBtn = $('.toolbar').children().last().clone();

			//add an attr for us to check for it later
			theaterBtn.attr('theater-mode-btn-container', '');
			theaterBtn.attr('title', 'Theater Mode');

			//change the icon
			theaterBtn.find('span.set-material').text('event_seat');

			//add click handler
			theaterBtn.on('click', function() {
				toggleTheaterMode();
			});
			theaterBtn.insertBefore($('.toolbar').children().last());
		}
	
		applyChatSettings(streamerName);
	}

	function toggleTheaterMode() {
		var theaterElements = 
			$('header,.back-to-browse,.profile-header,.profile-blocks,.user,b-notifications,.channel-page,aside');
		if(theaterElements.hasClass('theaterMode')) {
			theaterElements.removeClass('theaterMode');
		} else {
			theaterElements.addClass('theaterMode');
		}
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

									var inlineImg = 
										$(`<span style="display:block;">
											<span style="position: relative; display: inline-block">
												<span class="hide-picture-btn">x</span>
												<img src="${url}" style="max-width: 200px; max-height: 125px; object-fit:contain;" 
													onerror="this.onerror=null;this.src='${url.replace('https://', 'http://')}';"
													elixr-img>
											</span>									
										</span>`);

									inlineImg.find('img').on('load', function() {										
										scrollChatToBottom();
										$(this).off('load', '**');
									});
									
									inlineImg.insertBefore(link.parent());

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
	
		scrollChatToBottom();
	}

	function scrollChatToBottom() {
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
		log("getSettings()");
		return new Promise((resolve, reject) => {
			chrome.storage.sync.get({
				'streamerPageOptions': null,
				'homePageOptions': null,
				'generalOptions': null
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

	function streamerIsFollowed(streamerName) {
		return new Promise((resolve, reject) => {
			// get id and do something with it
			if (cache.user != null) {
				var userId = cache.user.id;
				//log("current userID: " + userId);
				//log(`https://mixer.com/api/v1/users/${userId}/follows?fields=token&where=token:eq:${streamerName}`);

				var request = new XMLHttpRequest();
				request.open('GET', `https://mixer.com/api/v1/users/${userId}/follows?fields=token&where=token:eq:${streamerName}`, true);
		
				request.onload = function() {
					if (request.status >= 200 && request.status < 400) {
						// Success!
						//var data = JSON.parse(request.responseText);
						var data = JSON.parse(request.responseText);
						console.log(data);

						if (data.length > 0) {
							log(`${streamerName} is followed`)
							resolve(true);
						} else {
							log(`${streamerName} is not followed`)
							resolve(false);
						}
						//if (data.)
						//resolve(true);
					} else {
						var data = JSON.parse(request.responseText);
						console.log(data);
						reject(false);
					}
				};
		
				request.onerror = function() {
					// There was a connection error of some sort
					reject(false);
				};
		
				request.send();
			
			} else {
				reject(false);
			}
		});
	}

	// Returns boolean based on whether or not a streamer is favorited.
	function streamerIsFavorited(streamerName) {
		favoriteFriends = settings.generalOptions.favoriteFriends;

		// Is there data in the friends array?
		if (favoriteFriends != null) {
			// If there is data, is there anything in it?
			if (favoriteFriends.indexOf(streamerName) >= 0) {
				// If streamer is a favorite, then we want.
				return true;
			}
		}
		return false;
	}

	// Adds or Removes a streamer to the favorite list
	function addOrRemoveFavorite(streamerName) {
		favorites = settings.generalOptions.favoriteFriends;

		if (streamerIsFavorited(streamerName)) {
			favorites = removeFavorite(streamerName)
		} else {
			log("Adding favorite: "+streamerName);
			favorites.push(streamerName);
		}

		syncFavorites(favorites);
	}

	function removeFavorite(streamerName) {
		log("Removing favorite: "+streamerName);
		favorites = settings.generalOptions.favoriteFriends;
		const index = favorites.indexOf(streamerName);

		if (index !== -1) {
			favorites.splice(index, 1);
		}
		return favorites;
	}

	function syncFavorites(favorites) {
		log("Syncing Favorites list: "+favorites)
		chrome.storage.sync.set({
			'generalOptions': {
				favoriteFriends: favorites
			}
		}, () => {});
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