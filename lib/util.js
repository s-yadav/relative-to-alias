'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.transformPath = transformPath;

var _babylon = require('babylon');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _pathDirname = require('path-dirname');

var _pathDirname2 = _interopRequireDefault(_pathDirname);

var _babelCore = require('babel-core');

var _babelGenerator = require('babel-generator');

var _babelGenerator2 = _interopRequireDefault(_babelGenerator);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var babylonPlugins = ['jsx', 'flow', 'typescript', 'doExpressions', 'objectRestSpread', 'decorators', 'classProperties', 'classPrivateProperties', 'classPrivateMethods', 'exportExtensions', 'asyncGenerators', 'functionBind', 'functionSent', 'dynamicImport', 'numericSeparator', 'optionalChaining', 'importMeta', 'bigInt', 'optionalCatchBinding', 'throwExpressions', 'pipelineOperator', 'nullishCoalescingOperator'];


function isNodeModule(path) {
  return path[0] !== '.';
}

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

function getImports(filePath, code, aliasInfo) {

  var ast = (0, _babylon.parse)(code, {
    sourceType: 'module',
    plugins: babylonPlugins
  });

  var alias = aliasInfo.alias,
      aliasRelativeToRoot = aliasInfo.aliasRelativeToRoot;


  var imports = [];

  function addToImports(node, sourceNode) {
    var relativePath = sourceNode.value;
    var rawSource = sourceNode.raw || sourceNode.extra && sourceNode.extra.raw;
    var preferredQuotes = (rawSource || '')[0] === "'" ? 'single' : 'double';
    if (!isNodeModule(relativePath)) {
      var absolutePathFromRoot = _path2.default.join((0, _pathDirname2.default)(filePath), relativePath);
      if (absolutePathFromRoot.indexOf(aliasRelativeToRoot) !== -1) {
        var aliasedPath = absolutePathFromRoot.replace(aliasRelativeToRoot, alias);
        sourceNode.value = aliasedPath;

        var start = node.start,
            end = node.end;

        var currentImportCode = code.substring(start, end);
        var updatedImport = (0, _babelGenerator2.default)(node, { quotes: preferredQuotes }, currentImportCode).code;

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

  (0, _babelCore.traverse)(ast, Visitors);

  return imports;
}

function transformPath(file, aliasInfo) {
  return new Promise(function (resolve, reject) {
    _fs2.default.readFile(file, 'utf8', function (err, code) {
      if (err) {
        console.error(err);
        reject(err);
        return;
      }

      var imports = getImports(file, code, aliasInfo);

      if (imports.length) {

        var newCode = replaceImports(code, imports);

        _fs2.default.writeFile(file, newCode, function (err) {
          if (err) {
            console.error(err);
            reject(err);
            return;
          }

          console.log('Transformed ' + file);
          resolve();
        });
      } else {
        resolve();
      }
    });
  });
}