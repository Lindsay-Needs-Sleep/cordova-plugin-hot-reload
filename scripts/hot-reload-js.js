/**
 * Starts a server which serves the contents of platforms/android/app/src/main/assets/www excluding local plugins.
 *
 * local plugins are plugins installed from a local file (aka. in package.json, their entry begins with "file:"")
 * Local plugins have their files initially replicated into the /.hot_reload_js_files directory.
 * The local plugin dir (referenced in package.json) is then monitored for changes.
 * When any file in a local plugin is changed it is re-copied into the .hot_reload_js_files dir.
 * The plugins in .hot_reload_js_files dir are hosted in place of their unchanging counterpart in platforms/android/app/src/main/assets/www.
 *
 * Files that are copied into the .hot_reload_js_files dir may need to have certain operations applied to them to
 * replicate the changes they receive when being installed normally.
 * The only special operation that we explicitly handle currently are files marked as "js-module" in plugin.xml
 * js-module files have a line code add to the beginning and end of the file.
 *
 * To make use of this file just:
 * - navigate to, or request a file hosted by hot-reload using:
 *   - eg. http://192.168.1.107:8333/index.html
 *   - instead of file:///android_asset/www/index.html
 *
 * You can check the contents of .hot_reload_js_files for troubleshooting (it is in the project root by default)
 *
 * Usage:
 * `node ./scripts/hot-reload-js.js <platform> [<port default=8333>]` (currently only available for android)
 */
(function () {
    'use strict';

    var fs = require('fs-extra');
    var path = require('path');
    var express = require('express');
    var et = require('elementtree');
    var watch = require('node-watch');

    var ASSET_DIR = {
        android: path.resolve(__dirname, '../platforms/android/app/src/main/assets/www/'),
        ios: path.resolve(__dirname, '../platforms/ios/TODO') // TODO add actual path
    };
    var COPIES_DIR = path.resolve(__dirname, '../.hot_reload_js_files');

    var _server;
    var _platform;
    var _port = 8333;
    var _opFiles = {}; // Files that need special operations
    var _plugins;

    // process the passed arguments and configure options
    if (process.argv.indexOf('android') > -1) {
        _platform = 'android';
    } else if (process.argv.indexOf('ios') > -1) {
        _platform = 'ios';
    } else {
        throw new Error('No valid platform found!  Expected "android" or "ios" as an argument');
    }
    if (process.argv.length >= 4) {
        _port = process.argv[3];
    }

    // Configure options
    ASSET_DIR = ASSET_DIR[_platform];

    // Get all local plugins
    getLocalPlugins();

    var plugin;
    for (var name in _plugins) {
        plugin = _plugins[name];

        // Store any js modules in the global
        getOpFiles(plugin);

        // Make a copy of all the plugin files for the server
        fs.copySync(
            plugin.path,
            path.resolve(COPIES_DIR, plugin.name),
            {
                overwrite: true,
                filter: function (filePath) {
                    // Exclude node_modules
                    return !filePath.startsWith(path.resolve(plugin.path, 'node_modules'));
                }
            }
        );

        var shouldWatchDir = true;
        for (var p in _plugins) {
            p = _plugins[p];
            // If this plugin is contained within an any other local plugin
            if (plugin.path !== p.path && plugin.path.startsWith(p.path)) {
                // We don't want to watch this dir since it will/already is watched
                shouldWatchDir = false;
                break;
            }
        }
        if (shouldWatchDir) {
            // And watch the original directory for changes
            watchDir(plugin.path);
        }
    }

    // We need to make sure our initial copies of files have
    // had their special operation performed on them
    for (var loc in _opFiles) {
        updateFileCopy(loc);
    }

    // Finally, start the server
    startServer();

    //* ****************************************************************************************
    //* ************************************** Functions ***************************************
    //* ****************************************************************************************

    function getLocalPlugins () {
        // Reset the global plugins
        _plugins = {};

        // Read the package
        var entries = fs.readJSONSync(path.resolve(__dirname, '../package.json')).dependencies;

        // Go through all the plugins
        var loc;
        for (var name in entries) {
            loc = entries[name];
            // Is it a local plugin?
            if (loc.startsWith('file:')) {
                // Add it
                _plugins[name] = {
                    name: name,
                    path: path.resolve(__dirname, '..', loc.substring(5))};
            }
        }
    }

    /**
     * Parses through a plugin's plugin.xml file to find files that need
     * special operations applied.
     *
     * @param {object} plugin - Represents a plugin
     * @property {string} name
     * @property {string} loc
     */
    function getOpFiles (plugin) {
        var data, etree;

        etree = fs.readFileSync(path.resolve(plugin.path, 'plugin.xml')).toString();
        etree = et.parse(etree);

        /** js-module hanlding **/

        // Find all global modules
        data = etree.findall('js-module') || [];
        // Find and add all platform specific modules
        etree = etree.find('platform/[@name="' + _platform + '"]');
        etree = etree ? etree.find('js-module') : null;
        if (etree && etree.length > 0) {
            data.push(etree);
        }
        // Add the js-modules to _opFiles
        var loc;
        for (var e in data) {
            e = data[e];
            loc = path.resolve(plugin.path, e.attrib.src);
            _opFiles[loc] = {
                relPath: e.attrib.src,
                name: e.attrib.name,
                type: 'js-module'
            };
        }
    }

    /**
     * Copies/converts the file so it will work with the cordova framework.
     *
     * @param {String} filePath
     */
    function updateFileCopy (filePath) {
        var plugin = getPluginByFile(filePath);

        // Read the file
        var fileData = fs.readFileSync(filePath, 'utf-8');

        // Does the file need a special operation?
        var file;
        if (_opFiles[filePath]) {
            file = _opFiles[filePath];

            switch (file.type) {
            case 'js-module':
                if (file.relPath.match(/.*\.json$/)) {
                    fileData = 'module.exports = ' + fileData;
                }
                fileData = 'cordova.define("' + plugin.name + '.' + file.name + '", function(require, exports, module) { \n' + fileData + '\n});\n';
                break;
            }
        }

        // Write the file back out
        fs.writeFileSync(path.resolve(COPIES_DIR, plugin.name, path.relative(plugin.path, filePath)), fileData, 'utf-8');
    }

    /**
     * Removes the corresponding file copy.
     *
     * @param {String} filePath
     */
    function removeFileCopy (filePath) {
        var plugin = getPluginByFile(filePath);

        // Write the file back out
        fs.unlinkSync(path.resolve(COPIES_DIR, plugin.name, path.relative(plugin.path, filePath)));
    }

    /**
     * Recursively looks for the plugin with the deepest directory that matches the filePath.
     * This strategy works for nested plugins.  It will prefer to match with the deepest nested
     * plugin, rather than the parent.
     *
     * @param {string} filePath - the file to find it's plugin's folder
     * @param {string} originalPath - for internal use only
     */
    function getPluginByFile (filePath, originalPath) {
        originalPath = originalPath || filePath;
        // If there is nowhere left to go up in the path basically
        if (path.dirname(filePath) === filePath) {
            throw new Error('Could not find a local plugin that contains this file path: ' + originalPath);
        }
        for (var p in _plugins) {
            p = _plugins[p];
            // Does the plugin path match the file path exactly?
            if (path.relative(p.path, filePath) === '') {
                return p;
            }
        }
        return getPluginByFile(path.dirname(filePath), originalPath);
    }

    function watchDir (dir) {
        watch(dir, { recursive: true }, function (eventType, filename) {
            if (eventType === 'update') {
                console.log(new Date().toLocaleString() + ': Change detected at: ' + filename);
                updateFileCopy(filename);
            }
            if (eventType === 'remove') {
                console.log(new Date().toLocaleString() + ': Delete detected at: ' + filename);
                removeFileCopy(filename);
            }
        });
    }

    function startServer () {
        _server = express();

        var key, entries, entry;

        // Note: All asset files are only refreshed when the plugin is removed and re-added
        // Add all asset files to static server (expect plugins folder)
        entries = fs.readdirSync(ASSET_DIR);
        // Loop through all entries
        for (key in entries) {
            entry = entries[key];
            // If not the plugins folder
            if (entry !== 'plugins') {
                // Add it to the server
                _server.use('/' + entry, express.static(path.resolve(ASSET_DIR, entry)));
            }
        }

        // Add all the asset and local plugins
        entries = fs.readdirSync(path.resolve(ASSET_DIR, 'plugins'));
        var isLocal;
        for (key in entries) {
            entry = entries[key];
            // Special handling for local plugins
            isLocal = false;
            for (var p in _plugins) {
                p = _plugins[p];
                if (entry === p.name) {
                    isLocal = true;
                    _server.use('/plugins/' + entry, express.static(path.resolve(COPIES_DIR, p.name)));
                }
            }
            // Else, if not local
            if (!isLocal) {
                // Add regular asset plugin
                _server.use('/plugins/' + entry, express.static(path.resolve(ASSET_DIR, 'plugins', entry)));
            }
        }

        // Start the server
        _server.listen(_port, function () {
            console.log('Server listening on port ', _port);
        });
    }

})();
