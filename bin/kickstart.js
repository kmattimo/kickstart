#!/usr/bin/env node
'use strict';

// REQUIRES
// -------------------------------------------------
var
    ASQ             = require('asynquence'),
    path            = require('path'),
    fse             = require('node-fs-extra'),
    chalk           = require('chalk'),
    del             = require('del'),
    _               = require('lodash'),
    pkg             = require('../package.json'),
    config          = require(path.join(__dirname, 'kickstart.json')),
    Liftoff         = require('liftoff'),
    prompt          = require('inquirer').prompt,
    argv            = require('minimist')(process.argv.slice(2)),
    updateNotifier  = require('update-notifier'),
    ghdownload,
    gulp,
    gulpfile
;

// KICKSTART CONFIGURATION
// -------------------------------------------------
var cwd = process.cwd();
var tempDir = config.app.tmpDir;
var sourceDir=  path.join(cwd, config.app.sourceDir);

var includeBoilerplate;
var includeStyleguide;


// CLI CONFIGURATION
// -------------------------------------------------
var cli = new Liftoff({
    name: config.app.name
});


// CHECK FOR PACKAGE UPDATES
// -------------------------------------------------
var notifier = updateNotifier({
  packageName: pkg.name,
  packageVersion: pkg.version
});

if (notifier.update) {

  console.log(
    chalk.yellow('\n\n|----------------------------------------|\n') +
    chalk.white(' Kickstart update available: ') +
    chalk.green(notifier.update.latest) +
    chalk.grey(' (current: ' + notifier.update.current + ') ') +
    chalk.yellow('|\n|') +
    chalk.white(' Follow the instructions at:          ') +
    chalk.yellow('|\n|') +
    chalk.magenta(' http://kickstart.onenorth.com      ') +
    chalk.yellow('|\n') +
    chalk.yellow('|--------------------------------------------|\n')
  );
}


// LAUNCH CLI
// -------------------------------------------------
cli.launch({}, launcher);

function launcher(env) {

    var versionFlag = argv.v || argv.version,
        infoFlag = argv.i || argv.info || argv.h || argv.help,
        task = argv._,
        allowedTasks = config.app.tasks,
        numTasks = task.length;

    // version check
    // write out version info to console then exit
    if (versionFlag) {
        showHead(pkg);
        process.exit(0);
    }

    // make sure at a task was specified on the command line
    if (!numTasks) {
        showInfo(pkg);
        process.exit(0);
    }

    // you can't specify more than one task so warn the user and log out the
    // tasks that are available to run
    if (numTasks > 1) {
        console.log(chalk.red('\nOnly one task can be executed. Aborting.\n'));
        showAvailableTasks();
        process.exit(0);
    }

    // we're sure we have only one task
    task = task[0];

    // write out info if necessary
    if (infoFlag) {
        showInfo(pkg);
        process.exit(0);
    }

    // make sure requested task is a valid task
    if (_.indexOf(allowedTasks, task) < 0) {
        console.log(chalk.red('\nThe task specified "' + task + '"is not an available task. Aborting.\n'));
        showAvailableTasks();
        process.exit(0);
    }

    // change to the directory where kickstart was called
    if (process.cwd() !== env.cwd) {
        process.chdir(env.cwd);
        console.log(chalk.cyan('Working directory changed to', chalk.magenta(env.cwd)));
    }

    // Prompt for input then start gulp
    ASQ(prompting)
      .seq(install)
      .seq(copyFiles)
      .seq(setupGulp)
      .then(function() {
        gulp.start.apply(gulp, [task]);
      });
}


// PROMPTS
// -------------------------------------------------

/**
 * [presentQuestions description]
 * @param  {Function} done [description]
 * @return {[type]}        [description]
 */
function prompting(done) {
  var questions = config.questions;

  prompt(questions, function (answers) {
    var features = answers.features,
        installFeatures = {},

        hasFeature = function (feature) {
          return features.indexOf(feature) !== -1;
        };

    includeBoilerplate = hasFeature('includeBoilerplate');
    includeStyleguide = hasFeature('includeStyleguide');

    done();

  });

}


// INSTALLATION
// -------------------------------------------------
function install() {

  var sq = ASQ();
  // if we're supposed to include some additional assets
  // based on the answers provided to the prompt questions
  if (includeBoilerplate || includeStyleguide) {
    // lazy require ghdownload because its only now
    // that we can be it's needed
    ghdownload = require('github-download');

    if (includeBoilerplate && includeStyleguide) {
      // download all or either/or the templates and the guides from the
      // respective github repos into a '.tmp' folder, then
      // copy the files from the '.tmp' folder into their
      // respective final destination
      sq.seq(downloadBoilerplateFiles)
        .seq(downloadStyleguideFiles);
    } else if (includeBoilerplate) {
      sq.seq(downloadBoilerplateFiles);
    } else {
      sq.seq(downloadStyleguideFiles);
    }
  }
  return sq;
}

function copyFiles() {
  var sq = ASQ();

  sq
    .val(function() {
      console.log(chalk.grey('Copying guplfile.js...'));
      fse.copySync(path.resolve(__dirname, '../gulpfile.js'), 'gulpfile.js');
    })
    .val(function() {
      console.log(chalk.grey('Copying config.json...'));
      fse.copySync(path.resolve(__dirname, '../config.json'), 'config.json');
    })
    .val(function() {
      if (includeStyleguide) {
        console.log(chalk.grey('Copying styleguide lib files...'));
        fse.copySync(path.resolve(__dirname, '../lib'), 'lib');
      }
    })

  return sq;

}

function setupGulp(done) {

  return ASQ(function (done) {
    // now require gulp + gulp plugins
    gulp = require('gulp');
    var gulpfile = require(path.join(path.dirname(fse.realpathSync(__filename)), '../gulpfile.js'));
    done(gulpfile);
  });
}

// TODO: Consolidate these downloads into one function that takes args

// DOWNLOAD FILES (OPTIONAL)
// -------------------------------------------------
/**
 * [downloadBoilerplateFiles description]
 * @param  {Function} done [description]
 * @return {[type]}        [description]
 */
function downloadBoilerplateFiles(done) {

  var app = config.app,
      boilerplate = config.files.boilerplate;

  console.log(chalk.grey('Downloading boilerplate files...'));

  return ASQ(function(done) {
    ghdownload(boilerplate, app.tempDir)
      .on('error', function (error) {
          console.log(chalk.red('✘ An error occurred. Aborting.'), error);
          process.exit(0);
      })
      .on('end', function() {
        console.log(chalk.green('✔ Download complete!\n') + chalk.grey('Cleaning up...'));

        fse.copy(app.tempDir, app.sourceDir, function (error) {
          if (error) {
              console.log(chalk.red('✘ Something went wrong. Please try again'), error);
              process.exit(0);
          } else {
              del([app.tempDir], done);
          }
        });
      });
  });
}

/**
 * [downloadStyleguideFiles description]
 * @param  {Function} done [description]
 * @return {[type]}        [description]
 */
function downloadStyleguideFiles(done) {
  var app = config.app,
      styleguide = config.files.styleguide;

  console.log(chalk.grey('Downloading styleguide files...'));

  return ASQ(function(done) {
    ghdownload(styleguide, app.tempDir)
      .on('error', function (error) {
          console.log(chalk.red('✘ An error occurred. Aborting.'), error);
          process.exit(0);
      })
      .on('end', function() {
        console.log(chalk.green('✔ Download complete!\n') + chalk.grey('Cleaning up...'));

        fse.copy(app.tempDir, app.sourceDir, function (error) {

            if (error) {
                console.log(chalk.red('✘ Something went wrong. Please try again.'), error);
                process.exit(0);
            } else {
                del([app.tempDir], done);
            }
        });
      });
  });
}


// HELPERS
// -------------------------------------------------
function showInfo (pkg) {
  showHead(pkg);
  showAvailableTasks();
}

function showHead (pkg) {
  console.log(
    chalk.blue.bold(
      '\n' +
       ' _  ___      _        _             _\n' +
       '| |/ (_)    | |      | |           | |\n' +
       '| \' / _  ___| | _____| |_ __ _ _ __| |_\n' +
       '|  < | |/ __| |/ / __| __/ _` | \'__| __|\n' +
       '| . \\| | (__|   <\___ \\ || (_| | |  | |_\n' +
       '|_|\\_\\\_|\\___|\_|\\\_\\\_\__/\\__\\__._|_|  \\\___|\n\n'
    ) +
    chalk.blue.inverse(' ☞ ' + config.app.website + ' ') +
    chalk.blue.inverse('                   ') +
    chalk.yellow.inverse(' v' + pkg.version + ' ') + '\n'
  );
}

function showAvailableTasks() {
  console.log(
    chalk.grey.underline('To start a new project, run:\n\n') +
    chalk.magenta.bold('kickstart init [args]') +
    chalk.grey(' or ') +
    chalk.magenta.bold('ks init [args]\n\n') +
    chalk.white('--base <source>') +
    chalk.grey('\t\tTo use a custom boilerplate file repo e.g., --base user/repo#branchname\n')
  );

  console.log(
    chalk.grey.underline('To build the project, run:\n\n') +
    chalk.magenta.bold('kickstart build [args]') +
    chalk.grey(' or ') +
    chalk.magenta.bold('ks build [args]\n\n') +
    chalk.white('--s, --serve') +
    chalk.grey('\t\tServe the files on a static address\n') +
    chalk.white('--o, --open') +
    chalk.grey('\t\tOpen the files in a browser for you (default Google Chrome)\n') +
    chalk.white('--p, --production') +
    chalk.grey('\tMake a production-ready build\n') +
    chalk.white('--t, --tunnel') +
    chalk.grey('\t\tTunnel your served files to the web (requires --serve)\n') +
    chalk.white('--verbose') +
    chalk.grey('\t\tShow extra information in the console while building\n')
  );

  console.log(
    chalk.grey.underline('For information about kickstart options, run:\n\n') +
    chalk.magenta.bold('kickstart [args]') +
    chalk.grey(' or ') +
    chalk.magenta.bold('ks [args]\n\n') +
    chalk.white('--i, --info,\n--h, --help') +
    chalk.grey('\t\tPrint out this message\n') +
    chalk.white('--v, --version') +
    chalk.grey('\t\tPrint out version\n')
  );
}

