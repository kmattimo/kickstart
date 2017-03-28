var async = require('async');
var fs = require('fs');
var fsextra = require('fs-extra')
var request = require('request');
var requireDir = require('require-all');
var _ = require('lodash');

var routeData = requireDir({ dirname: __dirname + '/src/routes' });
var routes = _.cloneDeep(routeData);
var pagePaths = [];

for (var k in routes) {
    for (var p in routes[k]) pagePaths.push(p);
}

var outputDir = './site';
var rootUrl = "http://localhost:3030";


// Remove Directory With Old Files
fsextra.remove(outputDir + '/**/*.html', function(err) {
    if (err) return console.error(err)

    // Recreate Directory
    fsextra.mkdirs(outputDir, function(err) {
        if (err) return console.error(err)

        // Create parallel Tasks
        var tasks = pagePaths.map(function(page) {

            return function(callback) {

                // Send a GET request to URL
                request(rootUrl + page, function(error, response, body) {
                    if (page === '/') page = '/home';
                    var pageName = outputDir + page + '.html';

                    if (!error && response.statusCode == 200) {

                        // Write the html text to a file
                        fs.writeFile(pageName, body, function(err) {
                            if (err) throw err;

                            console.log('Saved: ' + page.replace('/', '') + '.html');

                            callback(null);
                        });
                    }
                })
            }
        });

        // Run tasks
        async.parallel(tasks, function() {
            console.log('Finished Saving All Pages');
        })
    });
})