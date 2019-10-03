#!/usr/bin/env node
"use strict";

var _yargs = _interopRequireDefault(require("yargs"));

var _path = _interopRequireDefault(require("path"));

var _glob = _interopRequireDefault(require("glob"));

var _util = require("./util");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

//define options
_yargs["default"].option('root-path', {
  alias: 'r',
  type: 'string',
  describe: 'Root path of your project folder. Your imports / requires will be resolved based on this',
  "default": './'
}).option('src', {
  alias: 's',
  describe: 'Source folder or file in which you want to run the script',
  type: 'string'
}).option('alias', {
  alias: 'a',
  describe: 'Alias for a given path',
  type: 'string'
}).option('alias-path', {
  alias: 'ap',
  describe: 'Path which you want to be replaced with alias',
  type: 'string'
}).option('extensions', {
  alias: 'e',
  describe: 'File extensions which has to be parsed.',
  type: 'string',
  "default": 'js,jsx'
}).option('include-alias-path-directory', {
  alias: 'i',
  describe: 'If true it will replace path to alias for the alias path directory.',
  type: 'boolean',
  "default": false
}).option('ignore', {
  describe: 'Exclude given glob paths for the parsing.',
  type: 'array',
  "default": ['./**/node_modules/**']
}).required(['src', 'alias', 'alias-path']);

_yargs["default"].help();

var _yargs$argv = _yargs["default"].argv,
    rootPath = _yargs$argv.rootPath,
    src = _yargs$argv.src,
    alias = _yargs$argv.alias,
    aliasPath = _yargs$argv.aliasPath,
    extensions = _yargs$argv.extensions,
    includeAliasPathDirectory = _yargs$argv.includeAliasPathDirectory,
    ignore = _yargs$argv.ignore;

var aliasRelativeToRoot = _path["default"].relative(rootPath, aliasPath);

var srcGlob = (0, _util.getSourceGlob)(src, extensions);
(0, _glob["default"])(srcGlob, {
  ignore: (0, _util.getIgnoreGlobs)(srcGlob, ignore)
}, function (err, files) {
  //changes files to relative to root path
  files = files.map(function (file) {
    return _path["default"].relative(rootPath, file);
  }); //exclude files inside the alias path directory based on includeAliasPathDirectory flag

  if (!includeAliasPathDirectory) {
    files = (0, _util.excludeAliasPathFiles)(files, aliasRelativeToRoot);
  }

  files.forEach(function (file) {
    (0, _util.transformPath)(file, {
      alias: alias,
      aliasRelativeToRoot: aliasRelativeToRoot
    });
  });
});