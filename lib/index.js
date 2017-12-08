#!/usr/bin/env node
'use strict';

var _yargs = require('yargs');

var _yargs2 = _interopRequireDefault(_yargs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _glob = require('glob');

var _glob2 = _interopRequireDefault(_glob);

var _util = require('./util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//define options
_yargs2.default.option('root-path', {
  alias: 'r',
  type: 'string',
  describe: 'Root path of your project folder. Your imports / requires will be resolved based on this',
  default: './'
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
  default: 'js,jsx'
}).option('include-alias-path-directory', {
  alias: 'i',
  describe: 'If true it will replace path to alias for the alias path directory.',
  type: 'boolean',
  default: false
}).required(['src', 'alias', 'alias-path']);

_yargs2.default.help();

var _yargs$argv = _yargs2.default.argv,
    rootPath = _yargs$argv.rootPath,
    src = _yargs$argv.src,
    alias = _yargs$argv.alias,
    aliasPath = _yargs$argv.aliasPath,
    extensions = _yargs$argv.extensions,
    includeAliasPathDirectory = _yargs$argv.includeAliasPathDirectory;


var aliasRelativeToRoot = _path2.default.relative(rootPath, aliasPath);

var srcGlob = (0, _util.getSourceGlob)(src, extensions);

(0, _glob2.default)(srcGlob, {}, function (er, files) {
  //changes files to relative to root path
  files = files.map(function (file) {
    return _path2.default.relative(rootPath, file);
  });

  //exclude files inside the alias path directory based on includeAliasPathDirectory flag
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