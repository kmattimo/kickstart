'use strict';

var Pattern = function(filename, options) {
    this.filename = filename.substring(0, filename.indexOf('.'));
    return this.init(options);
};

Pattern.prototype.init = function(options) {
    this.dir = options.subDir || options.linkBase || '';
    this.name = (this.dir.replace(/[\/\\]/g, '-') + '-' + this.filename).replace(/\\/g, '-');
    this.data = options.data || {};
    this.patternName = this.filename.substring(this.filename.indexOf('-') + 1);
    this.patternGroup = this.name.substring(0, this.name.indexOf('-'));
    this.patternSubgroup = this.dir.substring(this.dir.indexOf('/') + 1);
    this.patternLink = (options.linkBase || '') + this.name + '/' + this.name + '.html';
    this.flatPatternPath = this.dir.replace(/\//g, '-');
    this.key = this.patternGroup + '-' + this.patternName;
    this.template = '';
    this.patternPartial = '';
    this.patternPartials = [];
    this.lineage = [];
    this.lineageIndex = [];
    this.lineageReverse = []; // was lineageR
    this.lineageReverseIndex = []; // was lineageRIndex

    return this;
};


module.exports = Pattern;