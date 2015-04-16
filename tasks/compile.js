'use strict';

var fs          = require('fs-extra'),
    gutil       = require('gulp-util'),
    path        = require('path'),
    handlebars  = require('handlebars'),
    through     = require('through2');

var data;

/**
 * [registerPartials description]
 * @return {[type]} [description]
 */
var registerPartials = function() {

    var partials = fs.readdirSync('src/toolkit/styleguide/partials'),
        html;

    // turn html files into handlebars partials
    // count down for this one
    for (var i = partials.length - 1; i >= 0; i--) {
        html = fs.readFileSync('src/toolkit/styleguide/partials/' + partials[i], 'utf-8');

        handlebars.registerPartial(partials[i].replace(/.html/, ''), html);
    }
};

/**
 * This where we build the files needed for the presentation of the styleguide
 * @param  {string}   file     [description]
 * @param  {string}   encoding [description]
 * @param  {Function} callback [description]
 * @return {null}            [description]
 */
var buildKickstart = function (file, encoding, callback) {

    // add to data object
    data.kickstart = true;

    // convert the file.contents from a buffer to a string
    // then pass the string to handlebars to compile
    // then get the resulting compiled source by using the data object
    // which contains all the data and partial references that are needed to
    // to fully generate the resulting html
    var source = file.contents.toString(),
        template = handlebars.compile(source),
        html = template(data);

    // create a new Buffer from the resulting compiled html (because we're using through)
    // and assign the buffered content to the file.contents property
    file.contents = new Buffer(html);

    // push the file onto the through file stack
    this.push(file);

    callback && callback();
};

/**
 * [buildToolkit description]
 * @param  {[type]}   file     [description]
 * @param  {[type]}   encoding [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
var buildToolkit = function (file, encoding, callback) {

    // add to data object
    // indicate we aren't building kickstart
    data.kickstart = false;
    var fileDirs = path.dirname(file.path).split(path.sep);

    var patternType = fileDirs[fileDirs.length - 1];

    // what type of pattern are we building, page or template
    // we need to know because we are going to include the 'type' name in
    // the file name that we output to the file system
    // var patternType = file.path.indexOf('template') > -1 ? 'templates' : 'pages'

    var baseKey = path.basename(file.path, '.html').replace(/-/g, '');
    var patterns = data[patternType][baseKey].patterns;
    var comments, source, template, html;

    for (var i = 0, len = patterns.length; i < len; i++) {
        comments = {
            start: '\n\n<!-- Start ' + patterns[i].name + ' template -->\n\n',
            end: '\n\n<!-- /End ' + patterns[i].name + ' template -->\n\n'
        };

        source = '{{> intro}}' +
                comments.start + patterns[i].content + comments.end +
                '{{> outro}}';

        template = handlebars.compile(source),
        html = template(data);

        // buffer file
        file.contents = new Buffer(html);

        console.log('basekey', baseKey);
        console.log('pattern type', patternType.replace('s',''));
        console.log('file path', file.path.replace(baseKey, patternType.replace('s', '') + "-" + patterns[i].id));

        // update the file path with the pattern type name plus a dash plus the key
        // remove any pluralization from the pattern type value
        //file.path = file.path.replace(baseKey, patternType.replace('s', '') + "-" + patterns[i].id);
        file.path = path.dirname(file.path) + "/" + patternType + "-" + baseKey + "-" + patterns[i].id + ".html";

        this.push(file);

    }

    callback && callback();

};

/**
 * [exports description]
 * @type {Object}
 */
module.exports = function (opts) {
    try {
        data = fs.readJSONSync(opts.data);
    }
    catch (error) {
        throw new Error('An error occurred during the compilation step', error);
    }

    registerPartials();

    return through.obj( (opts.template) ? buildToolkit : buildKickstart );
};
