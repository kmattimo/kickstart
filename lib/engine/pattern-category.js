'use strict';

var PatternCategory = function (name) {
    this.name = name || '';
    this.navItems = [];
    this.patterns = [];

    return this.init();
};

PatternCategory.prototype.init = function () {

    return this;
};

PatternCategory.prototype.addPattern = function (pattern) {
    this.patterns.push(pattern);
};

PatternCategory.prototype.addNavItem = function (navItem) {
    this.navItems.push(navItem);
};


module.exports = PatternCategory;