/*
    parse HTML and Markdown files to build JSON data
 */
'use strict';

// node
var extend          = require('util')._extend,
    fs              = require('node-fs-extra'),
    mkpath          = require('mkpath'),
    path            = require('path'),

// node_modules
    beautifyHtml    = require('js-beautify').html,
    cheerio         = require('cheerio'),
    diveSync        = require('diveSync'),
    gutil           = require('gulp-util'),
    handlebars      = require('handlebars'),
    he              = require('html-entities').AllHtmlEntities,
    junk            = require('junk'),

// kickstart libs
    utils           = require('../utils/utils'),
    snippet         = require('./snippet'),
    Pattern         = require('./pattern'),
    PatternCategory = require('./pattern-category'),
    PatternCrawler  = require('./pattern-crawler'),
    patternBuilder  = require('./pattern-builder'),
    PatternMgr      = require('./pattern-manager'),
    Renderer        = require('./renderer');

var baseDir,
    beautifyOptions,
    buildMenu,
    data,
    parse,
    patternCategories,
    registerItemHelper,
    registerMenuHelper;

// TODO: Revisit this baseDir path
baseDir = 'source/templates/';

beautifyOptions = {
    'indent,_size': 1,
    'indent_char': ' ',
    'indent_with_tabs': true
};


/**
 * convert items to helpers so we can use them in other files
    uses cheerio to load and parse snippets
 * @param  {[type]} item [description]
 * @return {[type]}      [description]
 * registerHelper is used instead of registerPartial because we want to be
 * able to modify the partial content before we make it available as a partial
 * through handlebars, and you can't pass a function to handlebars.registerPartial,
 * so you can't modify the content before it becomes a registered partial
 */
registerItemHelper = function (item) {

    try {
        handlebars.registerHelper(item.id, function() {
            var helperClasses = (typeof arguments[0] === 'string') ? arguments[0]: '';
            var $ = cheerio.load(item.content);

            $('*').first().addClass(helperClasses);

            return new handlebars.SafeString($.html());
        });

    } catch ( err ) {
        gutil.log(gutil.colors.red('ERROR PROCESSING: ', item));
        gutil.log(gutil.colors.red('ERROR: ', err.message));
    }
};


/**
 * Repeat a block n-number of times based on content directives
    see: http://handlebarsjs.com/block_helpers.html
 * @param  {Int} repeatTimes The number of times a block should be repeated
 * @param  {Object} block Object containing the HTML to render
 * @return {Object} An object representing all of the blocks (HTML) to render
 */
handlebars.registerHelper('iterate', function (repeatTimes, block) {
    var blocks = '',
        data;

    for (var i = 0; i < repeatTimes; i++) {
        if (block.data) {
            data = handlebars.createFrame(block.data || {});
            data.index = i;
        }
        blocks += block.fn(i, {data: data});
    }

    return blocks;

});


/**
 * Parse a directory of files and convert pattern snippet HTML files
 *  into Handlebars helpers, and Markdown files into notes related to the
 *  pattern snippet item
 *
 * @param  {String} dir A directory containing pattern snippets
 *
 * NOTE: This function needs to be refactored and simplified
 */
parse = function (dir) {
    var currDir = path.join(baseDir, dir);

    if (!fs.existsSync(currDir)) { return; }

    // create key if it doesn't exist
    if (!data[dir]) {
        data[dir] = {};
    }

    // get all the non-junk directories and files from the directory
    var raw = fs.readdirSync(currDir).filter(junk.not);
    var rawFiles, fileNames, childDirs, uniqueFileItems;
    var template, content, notes;

    // iterate files and replace the file extension with empty string
    var fileNames = raw.map(function (e, i) {
        return e.replace(path.extname(e), '');
    });

    // eliminate duplicate file names
    var items = fileNames.filter(function (e, i, a) {
        return a.indexOf(e) === i;
    });

    // ex: this will be the top level folders inside the components folder

    for (var i = 0, len = items.length; i < len; i++) {
        var item = {};
        var snips;

        item.id = items[i];
        item.name = utils.titleCase(util.spaceCase(item.id));
        fileName = path.join(currDir, items[i], '.html');

        try {
            // read the file contents
            content = fs.readFileSync(fileName, 'utf8').replace(/(\s*(\r?\n))+$/, '');

            // parse the file contents for yaml front matter
            var result = utils.readYaml(content);

            // loop through all keys and create property & value off of item object
            Object.keys(result).forEach(function (key) {
                item[key] = result[key];
            });

            // parse the content for HTML snippets
            snips = snippet(result.content);

            // now that we have all the snippets, loop over each one and create
            // a handlebars helper for the snippet
            // use the snippet name and snippet content for the helper
            if ( snips && snips.length ) {
                item.snippets = {};

                for (var j = 0, lens = snips.length; j < lens; j++ ) {
                    var s = {};
                    if ( snips[j].type ) {
                        if (snips[j].type === 'html' ) {
                            s.id = snips[j].name;
                            s.name = changeCase.titleCase(snips[j].name.replace(/-/ig, ' '));
                            template = handlebars.compile(snips[j].content);
                            s.content = beautifyHtml(template(), beautifyOptions);

                            item.snippets[s.id] = s;
                        }

                        if (snips[j].type === 'markdown' ) {
                            item.snippets[snips[j].name].notes = markdown.render(snips[j].content);
                        }

                        registerItemHelper(s);
                    }
                }
            }
        }
        catch (e) { }

        try {
            if (item.notes && (item.notes.indexOf('.md') > -1) ) {
                notes = fs.readFileSync(path.join(currDir, item.notes), 'utf-8');
                item.notes = markdown.render(notes);

            } else {
                notes = fs.readFileSync(currDir + '/' + items[i] + '.md', 'utf8');
                item.notes = markdown.render(notes);
            }
        }
        catch (e) {
            item.notes = '';
        }

        data[dir][item.id.replace(/-/g, '')] = item;
    }

};

var printDebug = function(data, name) {
    name = name || 'debug';

    var filename = data.name || data.patternName || name;
    fs.outputJsonSync('./debug/' + filename + '.json', data);
};

/**
 * [exports description]
 * @param  {[type]}   opts     [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
module.exports = function(opts, callback) {
    // var Pattern = pb.Pattern;
    // var PatternCategory = pb.Category;
    // var assembler = new PA();
    var logmsg;
    var patternManager = new PatternMgr('/patterns');
    var patternSite = {};

    var patternDir = opts.base;
    data = {};

    patternSite.data = {};
    patternSite.header = fs.readFileSync('./source/_styleguide_files/partials/header.html', 'utf8');
    patternSite.footer = fs.readFileSync('./source/_styleguide_files/partials/footer.html', 'utf8');
    patternSite.patterns = [];
    patternSite.partials = {};
    patternSite.data.link = {};

    // iterate over each pattern directory
    // for (var i = 0, len = opts.patterns.length; i < len; i++) {
    //     parse(opts.patterns[i]);
    // }
    diveSync(patternDir, function (err, file) {
        // log errors
        if (err) {
            gutil.log(gutil.colors.red(err));
            return;
        }

        var abspath = file;
        var relPath = path.relative(patternDir, file);
        var subdir = path.dirname(relPath);
        var filename = path.basename(file);
        var extRegex = new RegExp(/\.(md|json)$/i);
        var startsRegex = new RegExp('/^(_|\.)');
        var partialname = '';
        var sub = subdir.substring(subdir.indexOf('-') + 1);
        var folderIndex = sub.indexOf(path.sep);
        var cleanSub = sub.substring(0, folderIndex);

        if (startsRegex.test(filename) || extRegex.test(filename)) {
            return;
        }

        var patternOptions = {
            linkBase: '/patterns',
            relPath: relPath,
            subdir: subdir,
        };

        // TODO: if there is a pattern state, I need to check that here
        // setPatternState(mypattern, the configuration file that was downloaded)
        // and here I need to look at that configuration and determine if there
        // is an entry for the current pattern that indicates that the current
        // pattern is in active development e.g., is not finished
        try {
            var jsonFilename = gutil.replaceExtension(abspath, '.json');
            patternOptions.data = fs.readJSONSync(jsonFilename);
        }
        catch (_error) {}

        var mypattern = new Pattern(filename, patternOptions);

        mypattern.template = fs.readFileSync(abspath, 'utf8');

        var pc = new PatternCrawler(mypattern, patternSite);

        pc.parseLineage();

        pc.parseVariations();

        if (cleanSub !== '') {
            partialname = cleanSub + '-' + mypattern.patternName;
        }
        else {
            partialname = mypattern.patternGroup + '-' + mypattern.patternName;
        }

        patternSite.partials[partialname] = mypattern.template;

        // TODO: make pattern manager export a
        patternManager.pattern(mypattern);
        patternSite.data.link[mypattern.key] = mypattern.patternLink;

        patternSite.patterns = patternManager.getAllPatterns();

        printDebug(patternSite);

    });

    var entityEncoder = new he();
    var renderer = new Renderer();

    patternSite.patterns.forEach(function(pattern, index, patterns) {
        if (pattern.data) {
            pattern.data.link = extend({}, patternSite.data.link);

            pattern.patternPartial = renderer.render(pattern.template, pattern.data, pattern.patternPartials, patternSite.partials);
        }
        else {
            pattern.patternPartial = renderer.render(pattern.template, patternSite.data, pattern.patternPartials, patternSite.partials);
        }

        var patternFooter = renderer.render(patternSite.footer, pattern);

        // write the compiled template to public patterns directory
        fs.outputFileSync('./public/' + pattern.patternLink, patternSite.header + pattern.patternPartial + patternFooter);

        // write the handlebars file too
        fs.outputFileSync('./public/' + pattern.patternLink.replace('.html', '.hbs'), entityEncoder.encode(pattern.template));

        // write the encoded version too (for <pre> content)
        fs.outputFileSync('./public/' + pattern.patternLink.replace('.html', '.escaped.html'), entityEncoder.encode(pattern.patternPartial));

    });

    // export the patterns if necessary
    // TODO: write pattern exporter file and import and use here
    // var patternExporter = new PE();


    if (data.length === 0) { return; }
    // create and write the JSON file
    fs.outputJson(opts.dest, JSON.stringify(data), function(err) {
        if (err) {
            gutil.log(gutil.colors.red(err));
        } else {
            callback && callback();
        }
    });
};


