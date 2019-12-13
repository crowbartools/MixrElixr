import { browser } from '../../utils';

export default function monitorCookie(cookieName, callback) {
    let cookieExists = false;
    browser.cookies.onChanged.addEventListener(evt => {
        let name = evt.cookie.name,
            cause = evt.cookie.onChangedCause,
            removed = evt.cookie.removed;

        if (
            // Cookie isn't the cookie being monitored
            name !== cookieName ||

            // Cookie is being overwritten; another onchange event will be emitted once that occurs
            (removed && cause === 'overwrite') ||

            // Update to cookie doesn't change tracked state
            (removed && !cookieExists) ||
            (!removed && cookieExists)
        ) {
            return;
        }

        // login state changed
        cookieExists = !removed;
        callback();
    });
}