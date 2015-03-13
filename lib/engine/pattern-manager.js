'use strict';

// node
var path    = require('path');
var fs      = require('node-fs-extra');

// object to export
var PatternManager = function () {
    this.options = {};
    this.patterns = [];
    this.app = {};
};

PatternManager.prototype.configure = function (options) {
    this.options = options;
};

// set method
// set a value for a specified property of the PatternManager
PatternManager.prototype.set = function (propName, value) {
    this[propName] = value;
    return this;
};

// pattern method
// add a pattern to the collection of patterns
PatternManager.prototype.pattern = function (pattern) {
    this.patterns.push(pattern);

    return this;
};

// setState method
// set the state of a speficied pattern
// TODO: Should this method be on the Pattern object?
PatternManager.prototype.setState = function (pattern, state) {
    this.patterns[pattern].patternState = state;
};

// getAllPatterns method
// get all the managed patterns
PatternManager.prototype.getAllPatterns = function () {
    return this.patterns;
};


// export the PatternManager object
module.exports = exports = PatternManager;