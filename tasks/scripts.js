var gulp = require('gulp');
var gulpIf = require('gulp-if');
var watchify = require('watchify');
var _ = require('lodash');
var gulpIf = require('gulp-if');
var browserSync = require('browser-sync');
var mergeStream = require('merge-stream');

module.exports = function() {

    var browserifyTask = function() {

        var browserifyThis = function(bundleConfig) {
            if (config.dev) {
                _.extend(config.src.scriptBundles, watchify.args, { debug: true });

                bundleConfig = _.omit(bundleConfig, ['external', 'require']);
            }

            var b = browserify(bundleConfig);

            var bundle = function() {

                return b
                    .bundle()
                    .on('error', onError)
                    .pipe(source(bundleConfig.outputName))
                    .pipe(gulp.dest(bundleConfig.dest))
                    .pipe(gulpIf(config.dev, browserSync.reload({ stream: true })));
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

        return mergeStream.apply(gulp, _.map(config.scriptBundles, browserifyThis));

    }

    return browserifyTask();

};