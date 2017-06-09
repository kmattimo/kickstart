'use strict';

module.exports = {

    '/': function(req, res) {
        var locals;

        locals = req.locals;
        locals.bodyClass = 'page-home show-background-2';

        res.render('home', locals);
    },

    '/index': function(req, res) {
        var locals;

        locals = req.locals;
        locals.bodyClass = 'page-index';

        res.render('index', locals);
    },

    '/about': function(req, res) {
        var locals;

        locals = req.locals;
        locals.bodyClass = 'page-about-landing';

        res.render('about-landing', locals);
    },

    '/capabilities': function(req, res) {
        var locals;

        locals = req.locals;
        locals.bodyClass = 'page-capabilities-landing';

        res.render('capabilities-landing', locals);
    },

    '/capabilities-detail': function(req, res) {
        var locals;

        locals = req.locals;
        locals.bodyClass = 'page-capabilities-detail';

        res.render('capabilities-detail', locals);
    },

    '/careers': function(req, res) {
        var locals;

        locals = req.locals;
        locals.bodyClass = 'page-careers-landing';

        res.render('careers-landing', locals);
    },

    '/careers-detail': function(req, res) {
        var locals;

        locals = req.locals;
        locals.bodyClass = 'page-careers-detail';

        res.render('careers-detail', locals);
    },

    '/careers-opportunities': function(req, res) {
        var locals;

        locals = req.locals;
        locals.bodyClass = 'page-careers-opportunities';

        res.render('careers-opportunities', locals);
    },

    '/careers-opportunity-detail': function(req, res) {
        var locals;

        locals = req.locals;
        locals.bodyClass = 'page-careers-opportunity-detail';

        res.render('careers-opportunity-detail', locals);
    },

    '/contact-us': function(req, res) {
        var locals;

        locals = req.locals;
        locals.bodyClass = 'page-contact-us';

        res.render('contact-us', locals);
    },

    '/general-content': function(req, res) {
        var locals;

        locals = req.locals;
        locals.bodyClass = 'page-general-content';

        res.render('general-content', locals);
    },

    '/insights': function(req, res) {
        var locals;

        locals = req.locals;
        locals.bodyClass = 'page-insights-landing';

        res.render('insights-landing', locals);
    },

    '/insights-detail': function(req, res) {
        var locals;

        locals = req.locals;
        locals.bodyClass = 'page-insights-detail';

        res.render('insights-detail', locals);
    },

    '/locations': function(req, res) {
        var locals;

        locals = req.locals;
        locals.bodyClass = 'page-locations-landing';

        res.render('locations-landing', locals);
    },

    '/locations-detail': function(req, res) {
        var locals;

        locals = req.locals;
        locals.bodyClass = 'page-locations-detail';

        res.render('locations-detail', locals);
    },

    '/news-rankings': function(req, res) {
        var locals;

        locals = req.locals;
        locals.bodyClass = 'page-news-ranking';

        res.render('news-rankings', locals);
    },

    '/people': function(req, res) {
        var locals;

        locals = req.locals;
        locals.bodyClass = 'page-people-landing';

        res.render('professionals-landing', locals);
    },

    '/people-detail': function(req, res) {
        var locals;

        locals = req.locals;
        locals.bodyClass = 'page-people-detail';

        res.render('people-detail', locals);
    },

    '/site-search': function(req, res) {
        var locals;

        locals = req.locals;
        locals.bodyClass = 'page-site-search';

        res.render('site-search-results', locals);
    },

    '/staff-application': function(req, res) {
        var locals;

        locals = req.locals;
        locals.bodyClass = 'page-staff-application';

        res.render('staff-application', locals);
    }

}