// styles minification task
var gulp = require('gulp');
var csso = require('gulp-csso');
var rename = require('gulp-rename');
var sourcemaps = require('gulp-sourcemaps');

module.exports = function() {
    return gulp.src('./dist/public/css/*.css')
        .pipe(sourcemaps.init())
        .pipe(csso())
        .pipe(rename({ suffix: '.min' }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./dist/public/css'));
}