(function() {
    'use strict';

    var makePatternObject = function(subdir, filename, data) {
        this.filename = filename.substring(0, filename.indexOf('.'));
        this.subdir = subdir;
        this.name = (subdir.replace(/[\/\\]/g, '-') + '-' + this.filename).replace(/\\/g, '-');
        this.data = data || null;
        this.patternName = this.filename.substring(this.filename.indexOf('-') + 1); // ui display name
        this.patternLink = this.name + '/' + this.name + '.html';
        this.patternGroup = this.name.substring(0, this.name.indexOf('-'));
        this.patternSubGroup = subdir.substring(subdir.indexOf('/') + 1);
        this.flatPatternPath = subdir.replace(/\//g, '-');
        this.key = this.patternGroup + '-' + this.patternName;
        this.template = '';
        this.patternPartial = '';
        this.lineage = [];
        this.lineageIndex = [];
        this.lineageR = [];
        this.lineageRIndex = [];
    };

    var makePatternCategory = function (name) {
        this.name = name;
        this.navItems = [];
        this.patterns = [];
    };


    module.exports = {
        Pattern: makePatternObject,
        Category: makePatternCategory
    };


}());