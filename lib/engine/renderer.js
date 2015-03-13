'use strict';

var utils = require('../utils/utils');
var Handlebars = require('../helpers/helpers').Handlebars;


(function() {

    var cache = {};

    var renderer = function() {

        function render(tpl, data, variations, partials) {
            data = data || {};

            var template = cache[tpl];
            var partial;

            if (!template) {
                if (variations) {
                    for (var i = variations.length - 1; i >= 0; i--) {
                        try {
                            partial = Handlebars.compile(variations[i].content);
                            Handlebars.registerPartial(variations[i].name, partial());
                        }
                        catch (_error) {}

                    };
                }

                if (partials) {
                    for (var i = partials.length - 1; i >= 0; i--) {
                        try {
                            partial = Handlebars.compile(partials[i]);
                            Handlebars.registerPartial(partial);
                        }
                        catch (_error) {}
                    };
                }

                template = Handlebars.compile(tpl);

                cache[tpl] = template;
            }

            // utils.saveDebug('render-tpl', compiled(data));
            // utils.saveDebug('render-data', data);
            // utils.saveDebug('render-partials', partials);

            return template(data);
        }

        return {
            render: render
        };
    };

    module.exports = renderer;

}());