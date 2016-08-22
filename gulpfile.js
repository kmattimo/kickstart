'use strict';
//node modules
var path = require('path');

// node_modules modules
var _ = require('lodash');
var browserifyInstances;
var browserify  = require("browserify");
var browserSync = require("browser-sync");
var bsreload = browserSync.reload;
var del = require('del');
var glob = require("glob")
var mergeStream = require('merge-stream');
var q = require('q');
var source = require('vinyl-source-stream');
var watchify = require('watchify');

// gulp modules
var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();

// kickstart modules
var assemble = require('kickstart-assemble');

// user project configuration
var config = require('./config.js');

// error handler
var onError = function (err, cb) {
    plugins.util.beep();
    plugins.util.log(plugins.util.colors.red(err));

    if (typeof this.emit === 'function') this.emit('end');
};

// clean task
gulp.task('clean', function (cb) {
    return del([
        config.dest.base,
        'styleguide'
    ], cb);
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

// scripts task
gulp.task('scripts', function () {
    var bundleConfig = {};
    var entries = glob.sync(config.scripts.entries);

    browserifyInstances = [];

    if (config.dev) {
        _.extend(bundleConfig, watchify.args, { debug: true });
        bundleConfig = _.omit(bundleConfig, ['external', 'require']);
    }

    var browserifyTask = function () {

        var browserifyThis = function (file) {
            bundleConfig.entries = file;

            var b = browserify(bundleConfig);
            browserifyInstances.push(b);

            var bundle = function () {

                return b
                    .bundle()
                    .on('error', onError)
                    .pipe(source(path.basename(file)))
                    .pipe(gulp.dest(config.scripts.dest))
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

        return mergeStream.apply(gulp, _.map(entries, browserifyThis));

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
gulp.task('copy:extras', function () {
    return gulp.src('./src/public/*.{ico,txt}')
        .pipe(gulp.dest(config.dest.base));
});

gulp.task('compile:templates', function(done) {
    var options = {
        assets: config.dest.assets,
        data: config.src.data,
        production: false,
        helpers: 'src/templates/helpers/**/*.js',
        layout: 'default-layout',
        layouts: 'src/templates/views/layouts/*.html',
        partials: {
            common: ['src/templates/views/partials/layout/**/*.{hbs,html}'],
            components: ['src/templates/views/partials/components/**/*.{hbs,html}'],
            modules: ['src/templates/views/partials/modules/**/*.{hbs,html}'],
            structures: ['src/templates/views/partials/structures/**/*.{hbs,html}'],
            templates: ['src/templates/views/partials/templates/**/*.{hbs,html}']
        },
        //partials: 'src/templates/views/partials/**/*.html',
        pages: 'src/templates/views/*.html',
        dest: config.dest.base
    };

    assemble.templates(options, done);
});

gulp.task('compile:styleguide', function(done) {
  var options = {
    assetPath: '/public', // relative to site root directory (not styleguide)
    data: config.src.data,
    // patterns: 'src/templates/views/partials/**/*.html',
    patterns: {
        component: 'src/templates/views/partials/components/**/*.{hbs,html}',
        module: 'src/templates/views/partials/modules/**/*.{hbs,html}',
        structure: 'src/templates/views/partials/structures/**/*.{hbs,html}',
        template: 'src/templates/views/partials/templates/**/*.{hbs,html}'
    },
    pages: 'src/templates/views/*.{hbs,html}',
    dest: 'styleguide'
  };

  assemble.styleguide(options, done);
});

gulp.task('browserSync', function () {
    return browserSync(config.browserSync);
});

// watch task
gulp.task('watch', function () {
    plugins.watch([config.src.pages, config.src.includes, config.src.data], function () {
        plugins.sequence('compile:templates', function() {
            bsreload();
        });
    });

    plugins.watch(config.src.styles, function () {
        gulp.start('styles')
    });

    plugins.watch(config.scripts.entries, {
            events: ['add', 'unlink']
        },
        function () {
            browserifyInstances.forEach(function (instance) {
                // If config.dev is true, there will be no watcher to close
                if (instance.close) {
                    instance.close();
                }

                gulp.start('scripts');
            });
        }
    );

    plugins.watch(config.src.images, function () {
        gulp.start('images')
    });
});

// test performance task
gulp.task('test:performance', function () {
    //TODO: write the performance tasks
});

// performance task entry point
gulp.task('perf', ['test:performance']);

// production build task
gulp.task('build:production', ['clean'], function (cb) {
    plugins.sequence(
        ['fonts', 'images', 'styles', 'scripts', 'copy:extras'],
        ['compile:templates'],
        done
    );
});

gulp.task('build', ['clean'], function(done) {
    plugins.sequence(
        ['fonts', 'images', 'styles', 'scripts', 'copy:extras'],
        ['compile:templates'],
        ['compile:styleguide'],
        ['browserSync', 'watch'],
        done
    );
});

gulp.task('default', ['build']);
