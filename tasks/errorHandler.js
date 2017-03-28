// error handler
var util = require('gulp-util');

module.exports = function(err) {
    'use strict';
    util.beep();
    util.log(util.colors.red(err));

    if (typeof this.emit === 'function') {
        this.emit('end');
    }
};