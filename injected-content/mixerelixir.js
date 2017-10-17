//on document ready
var settings = null;
$(() => {
	// start the process
	log("Starting MixerElixir...");

	loadSettings();
	
	// wait till we detect the Timecard page
	//waitForPageLoad();
	
	// listen for an event from the Options page. This fires everytime the user adds or removes a time entry
	chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
		if(!request.settingsUpdated) return;
		loadSettings();
	});
});

function loadSettings() {
	getSettings().then((savedSettings) => {
		settings = savedSettings;
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


function waitForPageLoad() {
	
	var correctPage = false;
	// Hacky ways to find if we are on the correct page. 
	var url = window.location.href;
	var pageTitle = $(".dijitTitlePaneTextNode").text();

	log("Waiting for Timecard page...");
	if(url.includes("MyTimecard")) {
		correctPage = true;
	} 
	else if(pageTitle === 'My Timecard'){
		// sometimes the url doesnt update, search for the title text
		correctPage = true;	
	}

	// we didnt find it, check again in a bit
	setTimeout(() => { waitForPageLoad() }, 1500);
}

/* Helpers */

function log(message) {
	console.log(`[ME: ${message}]`);
}









