//@flow
import {parse} from 'babylon';
import path from 'path';
import fs from 'fs';
import pathDirname from 'path-dirname';
import {traverse} from 'babel-core';
import generate from 'babel-generator';

type aliasInfo = {alias: string, aliasRelativeToRoot: string};

const babylonPlugins = [
 'jsx',
 'flow',
 'typescript',
 'doExpressions',
 'objectRestSpread',
 'decorators',
 'classProperties',
 'classPrivateProperties',
 'classPrivateMethods',
 'exportExtensions',
 'asyncGenerators',
 'functionBind',
 'functionSent',
 'dynamicImport',
 'numericSeparator',
 'optionalChaining',
 'importMeta',
 'bigInt',
 'optionalCatchBinding',
 'throwExpressions',
 'pipelineOperator',
 'nullishCoalescingOperator'
];

//@flow
function isNodeModule(path: string) {
  return path[0] !== '.';
}

function replaceImports (code: string, imports: Array<Object>) {
  let newCode = '';
  let startIdx = 0;
  imports.forEach((importData) => {
    const {start, end, updatedImport} = importData;
    newCode = newCode + code.substring(startIdx, start) + updatedImport;
    startIdx = end;
  });
  newCode = newCode + code.substring(startIdx, code.length);
  return newCode;
}

function getImports(filePath: string, code: string, aliasInfo: aliasInfo) {

  const ast = parse(code, {
    sourceType: 'module',
    plugins: babylonPlugins
  });

  const {alias, aliasRelativeToRoot} = aliasInfo;

  const imports = [];

  function addToImports(node, sourceNode) {
    const relativePath = sourceNode.value;
    const rawSource = sourceNode.raw || (sourceNode.extra && sourceNode.extra.raw);
    const preferredQuotes = (rawSource || '')[0] === "'" ? 'single' : 'double';
    if (!isNodeModule(relativePath)) {
      const absolutePathFromRoot = path.join(pathDirname(filePath), relativePath);
      if (absolutePathFromRoot.indexOf(aliasRelativeToRoot) !== -1) {
        const aliasedPath = absolutePathFromRoot.replace(aliasRelativeToRoot, alias);
        sourceNode.value = aliasedPath;

        const {start, end} = node;
        const currentImportCode = code.substring(start, end);
        const updatedImport = generate(node, {quotes: preferredQuotes}, currentImportCode).code;

        imports.push({
          start,
          end,
          updatedImport: updatedImport
        })
      }
    }
  }

  const Visitors = {
    ImportDeclaration(astPath) {
      const {node} = astPath;
      const sourceNode = node.source;
      addToImports(node, sourceNode);
    },
    CallExpression(astPath) {
      const {node} = astPath;
      if (node.callee.name === 'require') {
        const sourceNode = node.arguments[0];
        addToImports(node, sourceNode);
      }
    }
  }

  traverse(ast, Visitors);

  return imports;
}


export function transformPath(file: string, aliasInfo: aliasInfo) {
  return new Promise((resolve, reject) => {
    fs.readFile(file, 'utf8', (err, code) => {
      if (err) {
        console.error(err);
        reject(err);
        return;
      }

      const imports = getImports(file, code, aliasInfo);

      if (imports.length) {

        const newCode = replaceImports(code, imports);

        fs.writeFile(file, newCode, (err) => {
          if(err) {
            console.error(err);
            reject(err);
            return;
          }

          console.log(`Transformed ${file}`);
          resolve();
        });
      } else {
        resolve();
      }
    });
  })
}
