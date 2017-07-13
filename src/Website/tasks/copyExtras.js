// copy extra files task
var gulp = require('gulp');

module.exports = function() {
    return gulp.src('./src/public/*.{ico,txt}')
        .pipe(gulp.dest('./dist'));
};