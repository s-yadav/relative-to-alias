'use strict';

var _yargs = require('yargs');

var _yargs2 = _interopRequireDefault(_yargs);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

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
}).option('leave-alias-path-directory', {
  alias: 'l',
  describe: 'If true it will not replace path to alias for the alias path directory.',
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
    leaveAliasPathDirectory = _yargs$argv.leaveAliasPathDirectory;


var aliasRelativeToRoot = _path2.default.relative(rootPath, aliasPath);
var srcRelativeToRoot = _path2.default.relative(rootPath, src);

var srcStat = _fs2.default.lstatSync(src);

var srcGlob = void 0;

if (srcStat.isDirectory()) {
  var srcWithEndingSlash = src.lastIndexOf('/') === src.length - 1 ? src : src + '/';
  srcGlob = srcWithEndingSlash + '**/*.{' + extensions + '}';
} else if (srcStat.isFile()) {
  srcGlob = src;
}

(0, _glob2.default)(srcGlob, {}, function (er, files) {
  //changes files to relative to root path
  files = files.map(function (file) {
    return _path2.default.relative(rootPath, file);
  });

  //exclude files inside the alias path directory if option is defined
  if (leaveAliasPathDirectory) {
    files = files.filter(function (file) {
      return file.indexOf(aliasRelativeToRoot) !== 0;
    });
  }

  files.forEach(function (file) {
    (0, _util.transformPath)(file, {
      alias: alias,
      aliasRelativeToRoot: aliasRelativeToRoot
    });
  });
});