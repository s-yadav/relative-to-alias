"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getSourceGlob = getSourceGlob;
exports.getIgnoreGlobs = getIgnoreGlobs;
exports.excludeAliasPathFiles = excludeAliasPathFiles;
exports.getTransformedCode = getTransformedCode;
exports.transformPath = transformPath;

var _parser = require("@babel/parser");

var _path = _interopRequireDefault(require("path"));

var _fs = _interopRequireDefault(require("fs"));

var _pathDirname = _interopRequireDefault(require("path-dirname"));

var _core = require("@babel/core");

var _generator = _interopRequireDefault(require("@babel/generator"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var babylonPlugins = ['jsx', 'doExpressions', 'objectRestSpread', 'decorators-legacy', 'classProperties', 'classPrivateProperties', 'classPrivateMethods', 'exportExtensions', 'asyncGenerators', 'functionBind', 'functionSent', 'dynamicImport', 'numericSeparator', 'optionalChaining', 'importMeta', 'bigInt', 'optionalCatchBinding', 'throwExpressions', ['pipelineOperator', {
  "proposal": "minimal"
}], 'nullishCoalescingOperator'];

function isNodeModule(path) {
  return path[0] !== '.';
}
/**
 * Convert src path to glob path
 */


function getSourceGlob(src, extensions) {
  var srcStat = _fs["default"].lstatSync(src);

  var srcGlob;

  if (srcStat.isDirectory()) {
    var srcWithEndingSlash = src.lastIndexOf('/') === src.length - 1 ? src : "".concat(src, "/");
    srcGlob = "".concat(srcWithEndingSlash, "**/*.{").concat(extensions, "}");
  } else if (srcStat.isFile()) {
    srcGlob = src;
  }

  return srcGlob;
}
/**
 * Fix exclude patterns based on source for https://github.com/isaacs/node-glob/issues/309,
*/


function getIgnoreGlobs(srcGlob, ignorePatterns) {
  var addDot = srcGlob.startsWith('./');
  return ignorePatterns.map(function (pattern) {
    if (addDot && !pattern.startsWith('./')) {
      return "./".concat(pattern);
    }

    return pattern;
  });
}
/**
 * Exlude files from the alias path folder as by
 * default they should not be transformed
 */


function excludeAliasPathFiles(files, aliasPath) {
  return files.filter(function (file) {
    return file.indexOf(aliasPath) !== 0;
  });
}
/**
 * Replace imports in code string to specified alias. This does the string replace
 * of specific import line so that other part of code is not affected by this mod
 */


function replaceImports(code, imports) {
  var newCode = '';
  var startIdx = 0;
  imports.forEach(function (importData) {
    var start = importData.start,
        end = importData.end,
        updatedImport = importData.updatedImport;
    newCode = newCode + code.substring(startIdx, start) + updatedImport;
    startIdx = end;
  });
  newCode = newCode + code.substring(startIdx, code.length);
  return newCode;
}
/**
 * Extract the import lines from the file which matches the alias
 */


function getImports(filePath, code, aliasOptions) {
  var alias = aliasOptions.alias,
      aliasRelativeToRoot = aliasOptions.aliasRelativeToRoot,
      language = aliasOptions.language;
  var ast = (0, _parser.parse)(code, {
    sourceType: 'module',
    plugins: [language].concat(babylonPlugins)
  });
  var imports = [];

  function addToImports(node, sourceNode) {
    var relativePath = sourceNode.value;
    var rawSource = sourceNode.raw || sourceNode.extra && sourceNode.extra.raw;
    var preferredQuotes = (rawSource || '')[0] === "'" ? 'single' : 'double';

    if (relativePath && !isNodeModule(relativePath)) {
      var absolutePathFromRoot = _path["default"].join((0, _pathDirname["default"])(filePath), relativePath);

      if (absolutePathFromRoot.indexOf(aliasRelativeToRoot) !== -1) {
        var aliasedPath = absolutePathFromRoot.replace(aliasRelativeToRoot, alias);
        sourceNode.value = aliasedPath; //remove leading and trailing comments from the node

        node.leadingComments = undefined;
        node.trailingComments = undefined;
        var start = node.start,
            end = node.end;
        var currentImportCode = code.substring(start, end);
        var updatedImport = (0, _generator["default"])(node, {
          jsescOption: {
            quotes: preferredQuotes
          }
        }, currentImportCode).code;
        imports.push({
          start: start,
          end: end,
          updatedImport: updatedImport
        });
      }
    }
  }

  var Visitors = {
    ImportDeclaration: function ImportDeclaration(astPath) {
      var node = astPath.node;
      var sourceNode = node.source;
      addToImports(node, sourceNode);
    },
    CallExpression: function CallExpression(astPath) {
      var node = astPath.node;

      if (node.callee.name === 'require') {
        var sourceNode = node.arguments[0];
        addToImports(node, sourceNode);
      }
    }
  };
  (0, _core.traverse)(ast, Visitors);
  return imports;
}

function getTransformedCode(filePath, code, aliasOptions) {
  var imports = getImports(filePath, code, aliasOptions);
  return imports.length ? replaceImports(code, imports) : null;
}

function transformPath(file, aliasOptions) {
  return new Promise(function (resolve, reject) {
    _fs["default"].readFile(file, 'utf8', function (err, code) {
      if (err) {
        console.error(err);
        reject(err);
        return;
      }

      var newCode = getTransformedCode(file, code, aliasOptions);

      if (newCode) {
        _fs["default"].writeFile(file, newCode, function (err) {
          if (err) {
            console.error(err);
            reject(err);
            return;
          }

          console.log("Transformed ".concat(file));
          resolve();
        });
      } else {
        resolve();
      }
    });
  });
}