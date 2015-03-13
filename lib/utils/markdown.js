'use strict';

// node_modules
var extend      = require('util')._extend,
var fs          = require('node-fs-extra');
var hljs        = require('highlight');
var markd       = require('markdown-it')();

// object to export
var Markdown = function(options) {
    return this.init(options);
};

// initialization method
// intializes the object with default and/or user-specified options
Markdown.prototype.init = function (options) {
    var defaults = {
        langPrefx: 'language-',
        html: true,
        breaks: true,
        typographer: true
    };

    this.options = extend({}, defaults, options || {});

    return this;
};

// read method
// reads and external file or a string
Markdown.prototype.read = function (src) {
    var content = '';

    try {
        content = fs.readFileSync(src, 'utf8');
    }
    catch (_error) {
        content = src;
    }

    return this.convert(content);
};

// convert method
// converts markdown into HTML
Markdown.prototype.convert = function (src) {

    if (typeof this.options.highlight === 'string') {
        if (this.options.highlight === 'auto') {
            this.options.highlight = function (code) {
                return hljs.highightAuto(code).value;
            };
        }
        else if (this.options.highlight === 'manual') {
            this.options.highlight = function (code, lang) {
                try {
                    code = hljs.highlight(lang, code).value;
                }
                catch (_error) {
                    code = hljs.highlightAuto(code).value;
                }

                return code;
            };
        }
    }

    // now set the options for the markdown parser
    markd.set(this.options);

    // return rendered HTML
    return markd.render(src);
};

module.exports.Markdown = function(options) {
    if (!(this instanceof Markdown)) {
        return new Markdown(options);
    }
};

