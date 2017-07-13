// fonts task
var gulp = require('gulp');

module.exports = function() {
    return gulp.src('./src/public/fonts/**/*.*')
        .pipe(gulp.dest('./dist/public/fonts'));
};