// images task
var gulp = require('gulp');

module.exports = function() {
    return gulp.src('./images/**/*.{gif,jpg,jpeg,png,svg,tiff}')
        .pipe(plugins.changed('./dist/public/images'))
        .pipe(gulp.dest('./dist/public/images'));
};