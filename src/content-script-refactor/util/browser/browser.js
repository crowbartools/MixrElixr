import Bowser from 'bowser';

const browser = require('webextension-polyfill');
const storage = Bowser
    .getParser(window.navigator.userAgent)
    .satisfies({
        Linux: {
            Chrome: '>0'
        },
        'Chrome OS': {
            Chrome: '>0'
        }
    }) ? browser.storage.local : browser.storage.sync;

export default browser;
export { storage };