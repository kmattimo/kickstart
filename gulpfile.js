'use strict';
//node modules
var path = require('path');

// node_modules modules
var _ = require('lodash');
var browserSync = require('browser-sync').create();
var bsreload = browserSync.reload;
var del = require('del');
var gulp = require('gulp');
var nodemon = require('nodemon');
var mergeStream = require('merge-stream');
var q = require('q');
var source = require('vinyl-source-stream');
var requireDir = require('require-dir');
var runSequence = require('run-sequence');
// var plugins = require('gulp-load-plugins');
// load gulp tasks from file
var tasks = requireDir('./tasks', { recurse: true });

// user project configuration
var config = require('./config.js');

var browserSyncLoadDelay = 750;


gulp.task('browserSync', function() {
    return browserSync(config.browserSync);
});


// global watch task - compile sass on change, reload browser on JS change
gulp.task('watch:templates', function() {
    //browsersync is configured to watch some files

    gulp.watch(config.src.styles, function() {
        gulp.start('styles:dev');
    });

    gulp.watch(config.src.data, function() {
        browserSync.reload();
    });

});

// SERVER - use express to compile handlebars and handle the requests
gulp.task('serve:templates', function() {
    nodemon({
        script: config.sitecorePrefix + '/app.js',
        ext: 'js',
        ignore: ['node_modules/', 'src/public/', 'gulpfile.js'],
        tasks: []
    }).on('restart', function() {
        setTimeout(function() {
            browserSync.reload();

        }, browserSyncLoadDelay);
    });
});

// production build task - minifies CSS
gulp.task('build:production', ['clean:styles'], function(done) {
    plugins.sequence(
        ['styles:release'],
        done
    );
});

gulp.task('clean:styles', tasks.cleanStyles);
//compiles SCSS to CSS
gulp.task('sass', tasks.sass);
gulp.task('autoprefix', tasks.autoprefixer);
gulp.task('minify-styles', tasks.minifyStyles);
// gulp.task('fonts', tasks.fonts);

gulp.task('styles:dev', function(done) {
    runSequence('clean:styles', 'sass', 'autoprefix', done);
});

gulp.task('styles:release', function(done) {
    runSequence('clean:styles', 'sass', 'autoprefix', 'minify-styles', done);
});

console.log(config.src.pages);

//The default task. Compiles CSS, runs express and uses browsersync to inject changes on the fly.
gulp.task('build:templates', ['clean:styles'], function() {
    runSequence(
        ['styles:dev' ],
        ['watch:templates', 'serve:templates'],
        function() {
            setTimeout(function() {
                browserSync.init({
                    proxy: 'localhost:3000',
                    port: '3030',
                    files: [
                        config.dest.styles + '/*.css',
                        config.src.scripts,
                        config.src.includes,
                        config.src.pages
                    ]
                });
            }, browserSyncLoadDelay);
        });
});

gulp.task('default', ['build:templates']);