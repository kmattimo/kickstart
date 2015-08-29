'use strict';
// node modules
var path = require('path');
// node_modules modules
var browserify  = require("browserify");
var browserSync = require("browser-sync");
var bsreload = browserSync.reload;
var extend = require('lodash').extend;
var gulp = require('gulp');
var map = require('lodash').map;
var mergeStream = require('merge-stream');
var omit = require('lodash').omit;
var plugins = require('gulp-load-plugins')();
var source = require('vinyl-source-stream');
var watchify = require('watchify');
// kickstart modules
var assemble = require('kickstart-assemble');
// user project configuration
var config = require('./config.js');
// build time variable
var build = new Date().getTime();

// custom stream pipe error handler
function onError (err, cb) {
    plugins.util.beep();
    plugins.util.log(plugins.util.colors.red(err));

    if (typeof this.emit === 'function') this.emit('end');
};

// default task
gulp.task('default', ['build']);

// production build task
gulp.task('build:production', ['clean'], function (cb) {
    plugins.sequence(
        ['fonts', 'images', 'styles', 'scripts', 'copy:extras'],
        ['compile:docs'],
        done
    );
});

// development build task
gulp.task('build', ['clean'], function(done) {
    plugins.sequence(
        ['fonts', 'images', 'styles', 'scripts', 'copy:extras'],
        ['compile:docs'],
        ['browserSync', 'watch'],
        done
    );
});

// clean task
gulp.task('clean', function (done) {
    var del = require('del');

    del([ config.dest.base ], done);
});

// styles task
gulp.task('styles', function () {
    return gulp.src(config.src.styles)
        .pipe(plugins.plumber({ errorHandler: onError }))
        .pipe(plugins.sass(config.sass.settings))
        .pipe(plugins.cssUrlAdjuster({
            prepend: config.dest.images
        }))
        .pipe(plugins.if(!config.dev, plugins.combineMediaQueries()))
        .pipe(plugins.autoprefixer(config.sass.autoprefixer))
        .pipe(plugins.if(!config.dev, plugins.csso()))
        .pipe(gulp.dest(config.dest.styles))
        .pipe(plugins.if(config.dev, bsreload({ stream: true })));
});

// Concat the prism CSS to main CSS to save a request
gulp.task('concat-prism-css', function() {
  var concat = plugins.csso;

  return gulp.src([buildDir + 'style.css', buildDir + 'js/libs/prism.css'])
          .pipe(csso())
          .pipe(gulp.dest(buildDir));
});

// scripts task
gulp.task('scripts', function () {
    var browserifyTask = function () {
        var browserifyThis = function (bundleConfig) {
            if (config.dev) {
                extend(config.src.scriptBundles, watchify.args, { debug: true });
                bundleConfig = omit(bundleConfig, ['external', 'require']);
            }

            var b = browserify(bundleConfig);
            var bundle = function () {
                return b
                    .bundle()
                    .on('error', onError)
                    .pipe(source(bundleConfig.outputName))
                    .pipe(gulp.dest(bundleConfig.dest))
                    .pipe(plugins.if(config.dev, bsreload({ stream: true })));
            };

            if (config.dev) {
                b = watchify(b);
                b.on('update', bundle);
            } else {
                if (bundleConfig.require) b.require(bundleConfig.require);
                if (bundleConfig.external) b.external(bundleConfig.external);
            }

            return bundle();
        };

        return mergeStream.apply(gulp, map(config.scriptBundles, browserifyThis));
    }

    return browserifyTask();
});

// images task
gulp.task('images', function () {
    return gulp.src(config.src.images)
        .pipe(plugins.changed(config.dest.images))
        .pipe(plugins.if(!config.dev, plugins.imagemin(config.images)))
        .pipe(gulp.dest(config.dest.images))
        .pipe(plugins.if(config.dev, bsreload({ stream: true })));
});

// fonts task
gulp.task('fonts', function () {
    return gulp.src(config.src.fonts)
        .pipe(gulp.dest(config.dest.fonts));
});

// copy extra files task
gulp.task('copy:extras', function (done) {
    return gulp.src('./src/public/*.{ico,txt}')
        .pipe(gulp.dest(config.dest.base));
});

gulp.task('compile:docs', function(done) {
    var options = {
        assets: config.dest.assets,
        data: config.src.data,
        production: true,
        layout: 'default-layout',
        layouts: 'src/templates/views/layouts/*.{hbs,html}',
        partials: 'src/templates/views/partials/**/*.{hbs,html}',
        pages: config.src.pages,
        dest: config.dest.base
    };

    assemble.templates(options, done);
});

gulp.task('browserSync', function () {
    return browserSync(config.browserSync);
});

// watch task
gulp.task('watch', function () {
    var watch = plugins.watch;

    watch(config.src.docs, function () {
        plugins.sequence('compile:docs', function() {
            bsreload();
        });
    });
    watch(config.src.styles, function () {
        gulp.start('styles:app')
    });

    watch(config.src.images, function () {
        gulp.start('images:app')
    });
});

// test performance task
gulp.task('test:performance', function () {
    //TODO: write the performance tasks
});

// performance task entry point
gulp.task('perf', ['test:performance']);

// Clones down the Prism repo
gulp.task('clone-prism', function(done) {
    var git = require('gulp-git');

    git.clone('https://github.com/LeaVerou/prism.git',
        { args: buildDir + 'js/libs/prism' },
        function(err) {
            done();
        });
});

// Move the Prism CSS file out of its burried place
gulp.task('move-prism-css', function() {
  return gulp.src(buildDir + '/js/libs/prism/themes/prism.css')
    .pipe(minifyCss(minifyCssSettings))
    .pipe(gulp.dest(buildDir + '/js/libs/'));
});

// Concatenate and move the Prism JS files
gulp.task('move-prism-js', function() {
  var concat = require('gulp-concat');
  var base = buildDir + '/js/libs/prism/components/';
  var files = [];

  [
    'core', 'bash', 'markup', 'css', 'css-extras',
    'scss', 'javascript'
  ].forEach(function(item) {
    files.push(base + 'prism-' + item + '.min.js');
  });

  return gulp.src(files, { base: '.' })
    .pipe(concat('prism.js'))
    .pipe(gulp.dest(buildDir + '/js/libs/'));
});

// Remove the stuff from prism we never wanted
gulp.task('remove-prism', function() {
  var clean = require('gulp-clean');

  return gulp.src(buildDir + '/js/libs/prism', { read: false })
    .pipe(clean());
});

// Replace build IDs inside required PHP and JS files
gulp.task('replace-build-ids', function() {
  var replace = require('gulp-replace');

  return gulp.src([buildDir + '/**/*.php', buildDir + '/**/*.js'])
    .pipe(replace('{{ VERSION }}', build))
    .pipe(gulp.dest(buildDir));
});



