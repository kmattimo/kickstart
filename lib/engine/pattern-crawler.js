'use strict';

var JOIN_CHAR = '\ue000';

var PatternCrawler = function (pattern, app) {
  this.pattern = pattern;
  this.app = app;
};

function processSnippet(snippet, type) {
  var linefeed = /\r\n/g.test(snippet) ? '\r\n' : '\n',
      lines = snippet.split(linefeed),
      ref = '',
      indent = (lines[0].match(/^\s*/) || [])[0],
      snippetContent = lines.slice(1, -1).join('');

  if (type === 'html') {
      // handle the HTML
      ref = snippetContent;
  } else if (type === 'markdown' ) {
      // handle the markdown
    ref = snippetContent;
  }

  ref = indent + ref;

  return snippet.replace(snippet, ref);
}

function formatSnippets(snippets) {
  var template = this.pattern.template;
  var linefeed = /\r\n/g.test(template) ? '\r\n' : '\n';
  var results = [];

  // handle content snippets
  Object.keys(snippets).forEach(function (key) {
    var snippet = snippets[key].join(linefeed),
        parts = key.split(JOIN_CHAR),
        type = parts[0],
        name = parts[1],
        attbs = parts[2];

    results.push({
      type: type,
      name: name,
      content: processSnippet(snippet, type)
    });
  });

  return results;

}


PatternCrawler.prototype.parseLineage = function() {
  var pattern = this.pattern;
  var app = this.app;

  // find any template references inside a pattern
  // e.g., {{> template-name }}
  var matches = pattern.template.match(/{{>([ ]+)?([A-Za-z0-9-]+)(?:\:[A-Za-z0-9-]+)?(?:(| )\(.*)?([ ]+)}}/g);

  if (matches === null) { return };

  // console.log('pattern\n-----------------\n', this.pattern);

  matches.forEach(function(match, index, matches) {
    var found = match.replace("{{> ", "").replace(" }}", "");

    // check to see if the pattern has already be found
    if (pattern.lineageIndex.indexOf(found) > -1) { return; }

    pattern.lineageIndex.push(found);

    app.patterns.forEach(function (ancestor, index, patterns) {
      var search = ancestor.patternGroup + "-" + ancestor.patternName;

      if (search !== found) { return; }

      var lineage = {
        "lineagePattern": found,
        "lineagePath": "../../patterns" + ancestor.patternLink
      };

      pattern.lineage.push(JSON.stringify(lineage));

      var patternLabel = pattern.patternGroup + "-" + pattern.patternName;

      if (ancestor.lineageRIndex.indexOf(patternLabel) > -1) { return; }

      ancestor.lineageRIndex.push(patternLabel);

      var lineageReverse = {
        "lineagePattern": patternLabel,
        "lineagePath": "../../patterns/" + pattern.patternLink
      };

      ancestor.lineageR.push(JSON.stringify(lineageReverse));
    });

  });
};

PatternCrawler.prototype.parseVariations = function() {
  var pattern = this.pattern;
  var regexStartSnippet = /<!--\s*snippet:(\w+)(?:\(([^\)]+)\))?\s*([^\s]+)?\s*(?:(.*))?\s*-->/;
  var regexEndSnippet = /<!--\s*endsnippet\s*-->/;
  var lines = pattern.template.replace(/\r\n/g, '\n').split(/\n/);
  var inprogress = false;
  var foundSnippets = {};
  var last;
  var removeBlockIndex = 0;

  lines.forEach(function (line) {
    var snippet = line.match(regexStartSnippet),
        endsnippet = regexEndSnippet.test(line);

    if (snippet) {
      inprogress = true;

      if (snippet[1] === 'remove') {
        snippet[3] = String(removeBlockIndex++);
      }

      if (snippet[4]) {
        foundSnippets[[snippet[1], snippet[3].trim(), snippet[4].trim()].join(JOIN_CHAR)] = last = [];
      }
      else {
        foundSnippets[[snippet[1], snippet[3].trim()].join(JOIN_CHAR)] = last = [];
      }
    }

    if (inprogress && endsnippet) {
      last.push(line);
      inprogress = false;
    }

    if (inprogress && last) {
      last.push(line);
    }
  });

  pattern.patternPartials = formatSnippets.call(this, foundSnippets);

};

module.exports = PatternCrawler;