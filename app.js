'use strict';

var fs = require('fs');
var fp = require('path');
var express = require('express');
var exphbs = require('express-handlebars');
var routescan = require('express-routescan');
var requireDir = require('require-all');
var _ = require('lodash');

var app,
    data,
    helpers;

app = express();

function relative(path) {
    return fp.join(__dirname, path);
}

/*****************************************
  Load files
*****************************************/

data = requireDir({ dirname: relative('/src/data') });
helpers = requireDir({ dirname: relative('/src/helpers') });

/*****************************************
  Setup Handlebars as templating engine
*****************************************/

app.engine('hbs', exphbs(({
    extname: '.hbs',
    layoutsDir: relative('/src/templates/layouts'),
    partialsDir: relative('/src/templates/partials'),
    helpers: helpers,
    defaultLayout: relative('/src/templates/layouts/default-layout')
})));
app.set('view engine', 'hbs');
app.set('views', relative('/src/templates/pages'));


/*****************************************
  Setup Middleware
*****************************************/

// Serve static Fies
app.use('/public', express.static('dist/public'));

// Common template data across pages
app.use(function(req, res, next) {
    req.locals = _.cloneDeep(data);
    next();
});

/*****************************************
  Setup Routes
*****************************************/

routescan(app, { directory: relative('/src/routes') });

/*****************************************
  Startup Server
*****************************************/

app.listen(3000, function() {
    console.log('------------------------------------------');
    console.log('Template Server Running on localhost:3000');
    console.log('------------------------------------------');
});