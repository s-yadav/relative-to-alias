import {getSourceGlob, excludeAliasPathFiles, getIgnoreGlobs} from '../src/util';
import { expect } from 'chai';

describe('Test getSourceGlob', () => {
  it('should return directory glob path when directory is passed', () => {
    expect(getSourceGlob('./', 'js,jsx')).to.equal('./**/*.{js,jsx}');
    expect(getSourceGlob('./src', 'js,jsx')).to.equal('./src/**/*.{js,jsx}');
  });

  it('should return file path when file path is passed', () => {
    expect(getSourceGlob('./src/index.js', 'js,jsx')).to.equal('./src/index.js');
  });
});


describe('Test excludeAliasPathFiles', () => {
  const files = [
    'src/component/modal.js',
    'src/utils/common.js',
    'src/reducers/reducer.js',
    'src/actions/actions.js'
  ]

  it('should filter out alias directory files', () => {
    expect(excludeAliasPathFiles(files, 'src/utils')).to.deep.equal([
      'src/component/modal.js',
      'src/reducers/reducer.js',
      'src/actions/actions.js'
    ]);
  });
});

describe('Test getIgnoreGlobs', () => {
  it('adds ./ before the ignore pattern if the source glob pattern start with ./', () => {
    const ignoreGlobs = ['node_modules/**/*', '.git/**/*'];

    expect(getIgnoreGlobs('/src', ignoreGlobs)).to.deep.equal(['node_modules/**/*', '.git/**/*']);

    expect(getIgnoreGlobs('./', ignoreGlobs)).to.deep.equal(['./node_modules/**/*', './.git/**/*']);
  });

  it('does not add an extra ./ before the ignore pattern if it already starts with ./', () => {
    const ignoreGlobs = ['./node_modules/**/*', './.git/**/*'];
    expect(getIgnoreGlobs('./', ignoreGlobs)).to.deep.equal(['./node_modules/**/*', './.git/**/*']);
  })
});
