scriptCommunication = {
	methods: {
		getCurrentStreamerNameInOpenTab: function() {
			return new Promise((resolve) => {
				var currentStreamer = null;
				chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
					chrome.tabs.sendMessage(tabs[0].id, { query: 'currentStreamerName'}, function(response) {
						if(response != null) {
							resolve(response.streamerName);
						}
					});
				});
			});
		}
	}
};