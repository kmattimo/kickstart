'use strict';
//node modules
var path = require('path');

// node_modules modules
var _ = require('lodash');
var browserify = require('browserify');
var browserSync = require('browser-sync').create();
var bsreload = browserSync.reload;
var del = require('del');
var gulp = require('gulp');
var nodemon = require('nodemon');
var mergeStream = require('merge-stream');
var q = require('q');
var source = require('vinyl-source-stream');
var watchify = require('watchify');
var requireDir = require('require-dir');
var runSequence = require('run-sequence');

// load gulp tasks
var tasks = requireDir('./tasks', { recurse: true });

// user project configuration
var config = require('./config.js');

var browserSyncLoadDelay = 750;


// Move
gulp.task('moveFiles', function() {
    for (var i = config.src.moveFiles.length - 1; i >= 0; i--) {
        gulp.src(config.src.moveFiles[i])
            .pipe(gulp.dest(config.dest.moveFiles[i]));
    }
});

gulp.task('browserSync', function() {
    return browserSync(config.browserSync);
});

gulp.task('copy:js', function(done) {
    gulp.src(config.src.customScripts)
        .pipe(gulp.dest(config.dest.customScripts))
    done()
});

// watch task
gulp.task('watch', function() {

    plugins.watch(config.src.styles, function() {
        gulp.start('styles');
    });

    plugins.watch(config.src.images, function() {
        gulp.start('images');
    });

    plugins.watch(config.src.data, function() {
        gulp.start('copy:js');
    });

    plugins.watch(config.src.customScripts, function() {
        gulp.start('copy:js');
    });

    plugins.watch(config.src.data, function() {
        browserSync.reload();
    });

});

// test performance task
gulp.task('test:performance', function() {
    //TODO: write the performance tasks
});

// performance task entry point
gulp.task('perf', ['test:performance']);

// SERVER
gulp.task('serve', function() {
    nodemon({
        script: 'app.js',
        ext: 'js',
        ignore: ['node_modules/', 'dist/', 'src/public/', 'gulpfile.js'],
        tasks: []
    }).on('restart', function() {
        setTimeout(function() {
            browserSync.reload();

        }, browserSyncLoadDelay);
    });
});

// production build task
gulp.task('build:production', ['clean'], function(done) {
    plugins.sequence(
        ['fonts', 'images', 'styles', 'scripts', 'copy:extras'],
        done
    );
});

gulp.task('clean:styles', tasks.cleanStyles);
gulp.task('sass', tasks.sass);
gulp.task('autoprefix', tasks.autoprefixer);
gulp.task('minify-styles', tasks.minifyStyles);

gulp.task('styles:dev', function(done) {
    runSequence('clean:styles', 'sass', 'autoprefix', done);
});

gulp.task('styles:release', function(done) {
    runSequence('clean:styles', 'sass', 'autoprefix', 'minify-styles', done);
});


gulp.task('build', ['clean'], function() {
    runSequence(
        ['fonts', 'images', 'styles', 'scripts', 'copy:extras', 'moveFiles'],
        'copy:js', ['watch', 'serve'],
        function() {
            setTimeout(function() {
                browserSync.init({
                    proxy: 'localhost:3000',
                    port: '3030',
                    files: [
                        config.dest.styles + '/*.css',
                        config.dest.scripts + '/**/*.js',
                        config.src.includes,
                        config.src.pages
                    ]
                });
            }, browserSyncLoadDelay);
        });
});

gulp.task('default', ['build']);