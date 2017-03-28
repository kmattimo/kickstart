var gulp = require('gulp');
var sass = require('gulp-sass');
var plumber = require('gulp-plumber');
var cssUrlAdjuster = require('gulp-css-url-adjuster');
var browserSync = require('browser-sync');
var errorHandler = require(__dirname + '/errorHandler');

module.exports = function() {
    'use strict';
    return gulp.src('./src/public/scss/home.scss')
        .pipe(plumber({ errorHandler: errorHandler }))
        .pipe(sass({
            indentedSyntax: false, // true enables .sass indented syntax
            imagesPath: 'public/images' // used by the image-url helper
        }))
        .pipe(cssUrlAdjuster({
            prepend: '/public/images'
        }))
        .pipe(gulp.dest('./dist/public/css'));
};