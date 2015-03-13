'use strict';

// ###########################################################################
//   REQUIRES
// ###########################################################################
var
    browserify      = require("browserify"),
    browserSync     = require("browser-sync"),
    del             = require('del'),
    fs              = require('node-fs-extra'),
    gulp            = require('gulp'),
    gulpLoadPlugins = require('gulp-load-plugins'),
    path            = require('path'),
    prompt          = require('inquirer').prompt,
    q               = require('q'),
    runSequence     = require('run-sequence'),
    source          = require('vinyl-source-stream'),
    reload          = browserSync.reload,
    $               = gulpLoadPlugins(),
    compile,
    assembler;


// ###########################################################################
//   CONFIGURATION
// ###########################################################################
var config = fs.readJSONSync('./config.json');


// ###########################################################################
//   BASE PATHS
// ###########################################################################
var cwd = process.cwd();
var tmpDir = path.join(cwd, config.tempDir);
var sourceDir =  path.join(cwd, config.sourceDir);


// ###########################################################################
//   FLAGS
// ###########################################################################
var didAssemble = false;
var shouldServe = false;
var shouldOpen = false;


// ###########################################################################
//   INITIALIZATION
// ###########################################################################
gulp.task('init', ['prompt'], function (done) { done(null); });


// ###########################################################################
//   PROMPT
// ###########################################################################
gulp.task ('prompt', function() {

  var
    questions = [
      {
        type: 'confirm',
        name: 'serveFiles',
        message: 'Would you like to serve the files after setup is complete?',
        default: true
      },
      {
        type: 'confirm',
        name: 'openBrowser',
        message: 'Would you like to open a browser after setup is complete?',
        default: true,
        when: function (answers) { return !!answers.serveFiles; }
      }
    ];

  prompt(questions, function (answers) {
    shouldServe = answers.serveFiles;
    shouldOpen = answers.openBrowser;

    if (shouldServe) gulp.start('build');
    else process.exit(0);

  });

});


// ###########################################################################
//   CLEAN
// ###########################################################################
gulp.task('clean', function(done) {
  del([config.dest], done);
});

gulp.task('clean:tmp', function(done) {
  del([tmpDir], done);
});


// ###########################################################################
//   STYLES
// ###########################################################################
var taskStyles = function(config) {
  return gulp.src(config.source)
    .pipe($.plumber())
    .pipe($.sassGraph(config.loadPaths))
    .pipe($.sass({loadPath: config.loadPaths}))
    .pipe($.gulpif(!config.dev, combinemq()))
    .pipe($.autoprefix(config.browsers))
    .pipe($.gulpif(!config.dev, csso()))
    .pipe($.rename(config.destName))
    .pipe(gulp.dest(config.dest))
    .pipe($.gulpif(config.dev, reload({stream: true})));
}

gulp.task('styles:kickstart', function() {
  return taskStyles({
    dev: config.dev,
    source: config.src.styles.kickstart,
    loadPaths: config.styles.loadPaths,
    browsers: config.browsers,
    dest: config.dest + '/kickstart/styles',
    destName: 'kickstart',
  });

});

gulp.task('styles:toolkit', function() {
  return taskStyles({
    dev: config.dev,
    source: config.src.styles.toolkit,
    loadPaths: config.styles.loadPaths,
    browsers: config.browsers,
    dest: config.dest + '/toolkit/styles',
    destName: 'main',
  });

});

gulp.task('styles', ['styles:kickstart','styles:toolkit']);


// ###########################################################################
//   SCRIPTS
// ###########################################################################

gulp.task('scripts:kickstart', function() {
  return gulp.src(config.src.scripts.kickstart)
    .pipe(concat('kickstart.js'))
    .pipe($.gulpif(!config.dev, $.uglify()))
    .pipe(gulp.dest(config.dest + '/kickstart/scripts'));
});

gulp.task ('scripts:toolkit', function() {
  return browserify(config.src.scripts.toolkit)
    .bundle()
    .on('error', handleErrors)
    .pipe(source('toolkit.js'))
    .pipe(gulpif(!config.dev, streamify(uglify())))
    .pipe(gulp.dest(config.dest + '/toolkit/scripts'));
});

gulp.task('scripts', ['scripts:kickstart','scripts:toolkit']);


// ###########################################################################
//   IMAGES
// ###########################################################################
// [1] lossless conversion to progressive
// [2] most effective according to OptiPNG
// [3a] don't remove the viewbox atribute from the SVG
// [3b] don't remove Useless Strokes and Fills
// [3c] don't remove Empty Attributes from the SVG
gulp.task ('images:kickstart', function() {
  return gulp.src(config.src.images.kickstart)
    .pipe(imagemin({
      progressive: true, // 1
      optimizationLevel: 3, // 2
      svgoPlugins: [
        { removeViewBox: false },               // 3a
        { removeUselessStrokeAndFill: false },  // 3b
        { removeEmptyAttrs: false }             // 3c
      ]
    }))
    .pipe(gulp.dest(config.dest + '/kickstart/images'))
});

gulp.task ('images:toolkit', ['favicon'], function() {
  return gulp.src(config.src.images.toolkit)
    .pipe(gulpif(!config.dev, imagemin({
      progressive: true,
      optimizationLevel: 3,
      svgoPlugins: [
        { removeViewBox: false },
        { removeUselessStrokeAndFill: false },
        { removeEmptyAttrs: false }
      ]
    })))
    .pipe(gulp.dest(config.dest + '/toolkit/images'));
});

gulp.task('images', ['images:kickstart','images:toolkit']);


// ###########################################################################
//   FONTS
// ###########################################################################
gulp.task ('fonts', function() {
  return gulp.src(config.src.fonts)
    .pipe(gulp.dest(config.dest + '/toolkit/fonts'));
});


// ###########################################################################
//   EXTRAS
// ###########################################################################
gulp.task ('favicon', function() {
  return gulp.src('./src/favicon.ico')
    .pipe(gulp.dest(config.dest));
});


// ###########################################################################
//   COLLATE
// ###########################################################################
gulp.task ('assemble', function() {
  var assembler = assembler || require('./lib/engine/assembler');
  var deferred, opts;

  if (didAssemble) { return null; }

  deferred = q.defer();

  opts = {
    base: path.join(sourceDir, config.patterns.source),
    dest: path.join(config.patterns.public , '/data/kickstart-data.json')
  };

  $.util.log($.util.colors.grey('Preparing to assemble templates...'));

  assembler(opts, deferred.resolve);

  didAssemble = true;

  return deferred.promise;
});


// ###########################################################################
//   BUILD
// ###########################################################################

gulp.task('build:kickstart', ['assemble'], function() {
  var compile = compile || require('./lib/engine/compile');
  var opts = {
    data: path.join(cwd, config.patterns.source, '/data/kickstart-data.json'),
    template: false
  };

  return gulp.src(path.join(cwd, config.patterns.source, '/**/*'))
    .pipe(compile(opts))
    .pipe(gulp.dest(config.patterns.public));
});

gulp.task('build:toolkit', ['assemble'], function() {
  var compile = compile || require('./lib/engine/compile');
  var opts = {
    data: config.patterns.source + '/data/kickstart-data.json',
    template: true
  };

  return gulp.src(config.patterns.source + '/**/*')
    .pipe(compile(opts))
    .pipe(gulp.dest(config.patterns.public));
});

gulp.task('build', ['build:kickstart', 'build:toolkit']);


// ###########################################################################
//   SERVE
// ###########################################################################
gulp.task ('browser-sync', function() {
  browserSync({
    server: {
      baseDir: config.dest
    },
    notify: false,
    logPrefix: 'KICKSTART'
  });
});


// ###########################################################################
//  WATCH
// ###########################################################################
gulp.task ('watch', ['browser-sync'], function() {
  gulp.watch('src/toolkit/**/*.{html,md}', ['build', reload]);
  gulp.watch('src/kickstart/styles/**/*.{sass,scss}', ['styles:kickstart']);
  gulp.watch('src/toolkit/assets/styles/**/*.{sass,scss}', ['styles:toolkit']);
  gulp.watch('src/kickstart/scripts/**/*.js', ['scripts:kickstart', reload]);
  gulp.watch('src/toolkit/assets/scripts/**/*.js', ['scripts:toolkit', reload]);
  gulp.watch(config.src.images.toolkit, ['images:toolkit', reload]);
});


// ###########################################################################
//   DEFAULT
// ###########################################################################
gulp.task ('default', ['clean'], function() {

  var
    tasks = [
        'styles',
        'scripts',
        'images',
        'fonts',
        'build'
    ];

    runSequence (tasks, function() {
      if (config.dev) {
        gulp.start('watch');
      }
    });
});


// ###########################################################################
//   HELPERS
// ###########################################################################
function handleErrors() {
  args = Array.prototype.slice.call(arguments);

  $.notify.onError({
    title: "Compile Error",
    message: "<%= error.message %>"
  }).apply(this, args);

  this.emit('end');
  return

}





