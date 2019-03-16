#!/usr/bin/env node
//@flow
import yargs from 'yargs';
import path from 'path';
import glob from 'glob';

import {transformPath, getSourceGlob, excludeAliasPathFiles, getIgnoreGlobs} from './util';

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
  .option('include-alias-path-directory', {
    alias: 'i',
    describe: 'If true it will replace path to alias for the alias path directory.',
    type: 'boolean',
    default: false
  })
  .option('ignore', {
    describe: 'Exclude given glob paths for the parsing.',
    type: 'array',
    default: ['./**/node_modules/**'],
  })
  .required(['src', 'alias', 'alias-path']);

yargs.help();


const {rootPath, src, alias, aliasPath, extensions, includeAliasPathDirectory, ignore} = yargs.argv;

const aliasRelativeToRoot = path.relative(rootPath, aliasPath);

const srcGlob = getSourceGlob(src, extensions);


glob(srcGlob, { ignore: getIgnoreGlobs(srcGlob, ignore) }, (err, files) =>  {
  //changes files to relative to root path
  files = files.map((file) => {
    return path.relative(rootPath, file);
  });

  //exclude files inside the alias path directory based on includeAliasPathDirectory flag
  if (!includeAliasPathDirectory) {
    files = excludeAliasPathFiles(files, aliasRelativeToRoot);
  }

  files.forEach((file) => {
    transformPath(file, {
      alias,
      aliasRelativeToRoot
    });
  });
});
