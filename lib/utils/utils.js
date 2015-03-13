'use strict';

// node
var fs          = require('node-fs-extra');
var path        = require('path');

// node_modules
var changeCase  = require('change-case');
var matter      = require('gray-matter');

// internal libs
var Handlebars  = require('../helpers/helpers').Handlebars;

// export this module
var Utils = module.exports = exports = {};

/**
 * Type Check Utils
 */
Utils.isBoolean = function (obj) {
    var undef = void 0;
    var type = typeof obj;

    return obj !== undef && type === 'boolean' || type === 'Boolean';
};

Utils.isNumber = function (obj) {
    var undef = void 0;

    return obj !== undef && obj !== null && (typeof obj === 'number' || obj instanceof Number);
};

Utils.isObject = function (obj) {
    var undef = void 0;

    return obj !== null && obj !== undef && typeof obj === 'object';
};

Utils.isRegExp = function (obj) {
    var undef = void 0;

    return obj !== undef && obj !== null && (obj instanceof RegExp);
};

Utils.isFunction = function (obj) {
    return typeof obj === 'function';
};

Utils.result = function (value) {
    if (Utils.isFunction(value)) {
        return value();
    }
    else {
        return value;
    }
};

Utils.detectType = function (value) {
    switch (typeof value) {
    case 'string':
        return 'str';
    case 'number':
        return 'num';
    case 'object':
        return 'obj';
    default:
        return 'other';
    }
};
/**
 * String Utils
 */
Utils.safeString = function (str) {
    return new Handlebars.SafeString(str);
};

var toString = function (val) {
    if (val === null) {
        return '';
    }
    else {
        return val.toString();
    }
};
Utils.toString = Object.prototype.toString;

Utils.lowerCase = function (str) {
    str = toString(str);
    return changeCase.lowerCase(str);
};

Utils.titleCase = function (str) {
    str = toString(str);
    return changeCase.titleCase(str);
};

Utils.upperCase = function (str) {
    str = toString(str);
    return changeCase.upperCase(str);
};

Utils.upperCaseFirst = function (str) {
    str = toString(str);
    return changeCase.upperCaseFirst(str);
};

Utils.spaceCase = function (str) {
    str = toString(str);
    return str.replace(/-/ig, ' ');
};

Utils.dashCase = function (str) {
    str = toString(str);
    return changeCase.paramCase(str);
};

Utils.trim = function (str) {
    var trim = /\S/.test('\xA0') ? /^[\s\xA0]+|[\s\xA0]+$/g : /^\s+|\s+$/g;
    return str.toString().replace(trim, '');
};

Utils.trimWhitespace = function (str) {
    return str.replace(/^s+/g, '').replace(/\s+$/g, '');
};

Utils.escapeString = function (str, except) {
    return str.replace(/([\.$?*|{}\(\)\[\]\\\/\+\^])/g, function (ch) {
        if (except && except.indexOf(ch) !== -1) {
          return ch;
        }
        return '\\' + ch;
    });
};

Utils.escapeExpression = function (str) {
    return Handlebars.Utils.escapeExpression(str);
};

Utils.readOptionalJson = function (filepath) {
    var data = {};
    try {
        data =  fs.readJsonSync(filepath);
    }
    catch (_error) {}

    return data;
};

Utils.readJsonString = function (str) {
    return JSON.parse(str);
};

var parseYaml = function (str) {
    return matter(str);
};

Utils.readYaml = function (src) {
    var data = '';

    try {
        data = fs.readFileSync(src);
    }
    catch (_error) {
        data = src;
    }

    return data === '' ? data : parseYaml(data);
};

Utils.stringifyYaml = function (src) {
    return matter.stringify(src);
};

/**
 * Conditional Output
 */
Utils.getExt = function (str) {
    var extname = path.extname(str);

    if (extname) {
        str = extname;
    }

    if (str[0] === '.') {
        str = str.substring(1);
    }

    return str;
};


/**
 * Path Utils
 */
Utils.getBasename = function (filename) {
    return path.basename(filename, path.extname(filename));
};

Utils.getRelativePath = function (from, to) {
    var relativePath = path.relative(path.dirname(from), path.dirname(to));
    return Utils.urlNormalize(path.join(relativePath, path.basename(to)));
};

/**
 * Ensure that a URL path is returned, instead of a filesystem path.
 * @param  String filepath [description]
 * @return String filepath [description]
 */
Utils.urlNormalize = function (filepath) {
    return filepath.replace(/\\/g, '/');
};

/**
 * Convenience Utils
 */
Utils.detectIndentation = function (str) {
    var tabs = str.match(/^[\t]+/g) || [];
    var spaces = str.match(/^[ ]+/g)  || [];
    var dominant = (tabs.length >= spaces.length ? tabs : spaces);
    var indentation = void 0;

    var i = 0;
    var len = dominant.length;

    while (i < len) {
        if (!indentation || dominant[i].length < indentation.length) {
            indentation = dominant[i];
        }
        i++;
    }

    return indentation;
};

Utils.endsWith = function (str, search) {
    var result = str.indexOf(search, str.length - search.length);

    return result !== -1;
};

Utils.getMatches = function (string, regex, index) {
    // default to the first capture group
    index = index || (index = 1);
    var matches = [];
    var match = void 0;

    while (match = regex.exec(string)) {
        matches.push(match[index]);
    }

    return matches;
};

Utils.saveDebug = function (filename, src) {
    var srcType = Utils.detectType(src);

    console.log('---------------\n', filename);
    console.log('type: ', typeof src);
    console.log('srcType: ', srcType);
    console.log('\n-------------\n');

    filename = filename + '-' + Date.now() || Date.now();

    if (srcType === 'str') {
        try {
            var data;
            data = JSON.parse(src);
            return fs.outputJSONSync('./debug/' + filename + '.json', data);
        }
        catch (_error) {
            return fs.outputFileSync('./debug/' + filename + '.txt', src);
        }
    }
    else if (srcType === 'obj') {
        return fs.outputJSONSync('./debug/' + filename + '.json', src);
    }

};


