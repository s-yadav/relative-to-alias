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


function isNodeModule(path: string) {
  return path[0] !== '.';
}


/**
 * Convert src path to glob path
 */
function getSourceGlob(src: string, extensions: string) {
  const srcStat = fs.lstatSync(src);

  let srcGlob;

  if (srcStat.isDirectory()) {
    const srcWithEndingSlash = src.lastIndexOf('/') === src.length - 1 ? src : `${src}/`;
    srcGlob = `${srcWithEndingSlash}**/*.{${extensions}}`;
  } else if (srcStat.isFile()) {
    srcGlob = src;
  }

  return srcGlob;
}


/**
 * Exlude files from the alias path folder as by
 * default they should not be transformed
 */
function excludeAliasPathFiles(files:Array<string>, aliasPath: string) {
  return files.filter((file) => {
    return file.indexOf(aliasPath) !== 0;
  })
}

/**
 * Replace imports in code string to specified alias. This does the string replace
 * of specific import line so that other part of code is not affected by this mod
 */
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


/**
 * Extract the import lines from the file which matches the alias
 */
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

        //remove leading and trailing comments from the node
        node.leadingComments = undefined;
        node.trailingComments = undefined;

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



function getTransformedCode(filePath: string, code: string, aliasInfo: aliasInfo) {
    const imports = getImports(filePath, code, aliasInfo);

    return imports.length ? replaceImports(code, imports) : null;
}




function transformPath(file: string, aliasInfo: aliasInfo) {
  return new Promise((resolve, reject) => {
    fs.readFile(file, 'utf8', (err, code) => {
      if (err) {
        console.error(err);
        reject(err);
        return;
      }

      const newCode = getTransformedCode(file, code, aliasInfo);

      if (newCode) {
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

export {getTransformedCode, transformPath, getSourceGlob, excludeAliasPathFiles};
