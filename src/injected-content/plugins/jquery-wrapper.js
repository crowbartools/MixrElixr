// import jQuery and set it as a global
import jQuery from 'jQuery';

// require jQuery plugins so they initialize
require('tooltipster');
require('jquery-modal');
require('jquery-toast-plugin');
require('./jquery.initialize.js');

// remove jQuery from global
jQuery.noConflict(true);

// export jQuery now that plugins have initialized
export default jQuery;