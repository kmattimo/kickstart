var path = require('path');

var sitecorePrefix = 'Website/Assets';

//Notice: Since the only thing being compiled is sass->css, both src and dest folders point to /src
// source directories
var srcDir = path.join(sitecorePrefix, 'src');
var srcAssetsDir = path.join(srcDir, '/public');

// destination directories
var destDir = path.join(sitecorePrefix, 'src');
var destAssetsDir = path.join(destDir, '/public');

// modules
var imageminMozjpeg = require('imagemin-mozjpeg');

module.exports = {

    dev: true, // gutil.env.dev
    sitecorePrefix: sitecorePrefix,

    logging: {
        logErrors: true,
        writeToFile: false,
        verbose: true
    },

//NOTE: always use forward slashes in paths to maintain cross-platform compatibility
    src: {
        docs: srcDir + '/docs/**/*.{md,markdown}',
        pages: srcDir + '/templates/**/*.{hbs,html}',
        includes: srcDir + '/templates/partials/**/*.{hbs,html}',
        data: srcAssetsDir + '/data/**/*.{json,yaml,yml}',
        scripts: srcAssetsDir + '/js/**/*.{js,jsx}',
        // customScripts: srcAssetsDir + '/js/custom/**/*.{js,jsx}',
        styles: srcAssetsDir + '/scss/**/*.{sass,scss}',
        // images: srcAssetsDir + '/images/**/*.{gif,jpg,jpeg,png,svg,tiff}',
        fonts: srcAssetsDir + '/fonts/**/*',
        // moveFiles: [srcAssetsDir + '/js/modernizr.js']
    },

    dest: {
        base: destDir,
        assets: destAssetsDir,
        // scripts: destAssetsDir + '/js',
        // customScripts: destAssetsDir + '/js/custom',
        styles: destAssetsDir + '/css',
        images: destAssetsDir + '/images',
        // cssImages: './public' + '/images',
        fonts: destAssetsDir + '/fonts',
        // moveFiles: [destAssetsDir + '/js']
    },

    sass: {
        autoprefixer: {
            // you could use ['last 2 version'] instead of listing out browser specifics
            browsers: [
                'ie >= 9',
                'ie_mob >= 9',
                'ff >= 30',
                'chrome >= 32',
                'safari >= 6',
                'opera >= 23',
                'ios >= 6',
                'android 2.3',
                'android >= 4.3',
                'bb >= 10'
            ]
        },
        settings: {
            indentedSyntax: false, // true enables .sass indented syntax
            imagesPath: 'public/images' // used by the image-url helper
        }
    },

    browserSync: {
        server: {
            baseDir: [destDir, 'styleguide'],
            routes: {
                '/styleguide': 'styleguide'
            }
        },
        startPath: 'home.html',
        snippetOptions: {
            ignorePaths: ['styleguide', 'styleguide/*.html']
        },
        browsers: ['google chrome'],
        notify: true,
        logPrefix: 'SERVER'
    }
};