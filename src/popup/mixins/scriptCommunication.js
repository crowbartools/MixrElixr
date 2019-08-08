global.scriptCommunication = {
  methods: {
    getCurrentStreamerNameInOpenTab: function() {
      return new Promise(resolve => {
        browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
          browser.tabs.sendMessage(tabs[0].id, { query: 'currentStramerName' }).then(response => {
            if (response != null) {
              return resolve(response.streamerName);
            }
            resolve('');
          });
        });
      });
    }
  }
};
