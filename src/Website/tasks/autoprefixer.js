var gulp = require('gulp');
var postcss = require('gulp-postcss');
var sourcemaps = require('gulp-sourcemaps');
var autoprefixer = require('autoprefixer');

var browserConfig = [
    'ie >= 8',
    'ie_mob >= 8',
    'ff >= 30',
    'chrome >= 32',
    'safari >= 6',
    'opera >= 23',
    'ios >= 6',
    'android 2.3',
    'android >= 4.3',
    'bb >= 10'
];


module.exports = function() {
    'use strict';

    return gulp.src('./dist/public/css/**/*.css')
        .pipe(sourcemaps.init())
        .pipe(postcss([autoprefixer({ browsers: browserConfig })]))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./dist/public/css'));
};