import '../utils/url-changed/';

// imported in reverse order from which they'll be settled
// so that modules that are needed later in the load cycle
// clear their state variables first in the url-changed event
import channel from './channel';
import page from './page';
import user from './user/';
import settings from './settings/';

export { channel, page, settings, user };