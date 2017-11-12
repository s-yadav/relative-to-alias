//@flow
import yargs from 'yargs';
import fs from 'fs';
import path from 'path';
import glob from 'glob';

import {transformPath} from './util';

//define options
yargs
  .option('root-path', {
    alias: 'r',
    type: 'string',
    describe: 'Root path of your project folder. Your imports / requires will be resolved based on this',
    default: './'
  })
  .option('src', {
    alias: 's',
    describe: 'Source folder or file in which you want to run the script',
    type: 'string'
  })
  .option('alias', {
    alias: 'a',
    describe: 'Alias for a given path',
    type: 'string'
  })
  .option('alias-path', {
    alias: 'ap',
    describe: 'Path which you want to be replaced with alias',
    type: 'string'
  })
  .option('extensions', {
    alias: 'e',
    describe: 'File extensions which has to be parsed.',
    type: 'string',
    default: 'js,jsx'
  })
  .option('leave-alias-path-directory', {
    alias: 'l',
    describe: 'If true it will not replace path to alias for the alias path directory.',
    type: 'boolean',
    default: false
  })
  .required(['src', 'alias', 'alias-path']);

  yargs.help();

const {rootPath, src, alias, aliasPath, extensions, leaveAliasPathDirectory} = yargs.argv;

const aliasRelativeToRoot = path.relative(rootPath, aliasPath);

const srcStat = fs.lstatSync(src);

let srcGlob;

if (srcStat.isDirectory()) {
  const srcWithEndingSlash = src.lastIndexOf('/') === src.length - 1 ? src : `${src}/`;
  srcGlob = `${srcWithEndingSlash}**/*.{${extensions}}`;
} else if (srcStat.isFile()) {
  srcGlob = src;
}

glob(srcGlob, {}, (er, files) =>  {
  //changes files to relative to root path
  files = files.map((file) => {
    return path.relative(rootPath, file);
  });

  //exclude files inside the alias path directory if option is defined
  if (leaveAliasPathDirectory) {
    files = files.filter((file) => {
      return file.indexOf(aliasRelativeToRoot) !== 0;
    })
  }

  files.forEach((file) => {
    transformPath(file, {
      alias,
      aliasRelativeToRoot
    });
  });
});
