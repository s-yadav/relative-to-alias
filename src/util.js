//@flow
import {parse} from '@babel/parser';
import path from 'path';
import fs from 'fs';
import pathDirname from 'path-dirname';
import {traverse} from '@babel/core';
import generate from '@babel/generator';

type aliasOptions = {alias: string, aliasRelativeToRoot: string, language: string};

/**
 * Source: https://babeljs.io/docs/en/babel-parser
 */
const babylonPlugins = [
 'jsx',
 'doExpressions',
 'objectRestSpread',
 'decorators-legacy',
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
 ['pipelineOperator', { "proposal": "minimal" }],
 'nullishCoalescingOperator',
 'exportDefaultFrom',
 'exportNamespaceFrom',
 'logicalAssignment',
 'partialApplication'
];


function isNodeModule(path: string) {
  return path[0] !== '.';
}


/**
 * Convert src path to glob path
 */
export function getSourceGlob(src: string, extensions: string) {
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
 * Fix exclude patterns based on source for https://github.com/isaacs/node-glob/issues/309,
*/
export function getIgnoreGlobs(srcGlob: string, ignorePatterns: Array<string> ) {
  const addDot = srcGlob.startsWith('./');
  return ignorePatterns.map((pattern) => {
    if (addDot && !pattern.startsWith('./')) {
      return `./${pattern}`;
    }

    return pattern;
  })
}

/**
 * Exlude files from the alias path folder as by
 * default they should not be transformed
 */
export function excludeAliasPathFiles(files:Array<string>, aliasPath: string) {
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
function getImports(filePath: string, code: string, aliasOptions: aliasOptions) {

  const {alias, aliasRelativeToRoot, language} = aliasOptions;

  const ast = parse(code, {
    sourceType: 'module',
    plugins: [language, ...babylonPlugins]
  });


  const imports = [];

  function addToImports(node, sourceNode) {
    const relativePath = sourceNode.value;
    const rawSource = sourceNode.raw || (sourceNode.extra && sourceNode.extra.raw);
    const preferredQuotes = (rawSource || '')[0] === "'" ? 'single' : 'double';

    if (relativePath && !isNodeModule(relativePath)) {
      const absolutePathFromRoot = path.join(pathDirname(filePath), relativePath);
      if (absolutePathFromRoot.indexOf(aliasRelativeToRoot) === 0) {
        let aliasedPath = absolutePathFromRoot.replace(aliasRelativeToRoot, alias);
        if (alias === '' && aliasedPath.startsWith('/')) {
          aliasedPath = aliasedPath.slice(1);
        }

        sourceNode.value = aliasedPath;

        //remove leading and trailing comments from the node
        node.leadingComments = undefined;
        node.trailingComments = undefined;

        const {start, end} = node;
        const currentImportCode = code.substring(start, end);
        const updatedImport = generate(node, {jsescOption :{quotes: preferredQuotes}}, currentImportCode).code;

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



export function getTransformedCode(filePath: string, code: string, aliasOptions: aliasOptions) {
  const imports = getImports(filePath, code, aliasOptions);
  return imports.length ? replaceImports(code, imports) : null;
}



export function transformPath(file: string, aliasOptions: aliasOptions) {
  return new Promise((resolve, reject) => {
    fs.readFile(file, 'utf8', (err, code) => {
      if (err) {
        console.error(err);
        reject(err);
        return;
      }

      const newCode = getTransformedCode(file, code, aliasOptions);

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
