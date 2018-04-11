![Travis build status](https://travis-ci.org/s-yadav/relative-to-alias.svg?branch=master)

A tiny cli tool (codemod) to replace relative paths to defined alias in your project.

You can use anything to define alias for your files/directory ([Aliasing modules](#aliasing-modules)) and then use this module to refactor your code to start using those alias instead of relative paths.


## Install
```
npm install -g relative-to-alias
```

## Usage
On your project root directory
```
relative-to-alias --src ./src --alias utils --alias-path ./src/util
```
Note: alias-path is relative to root-path argument. while src path is relative to the current directory.

```
Options:
--root-path, -r                     Root path of your project folder. Your
                                    imports / requires will be resolved based
                                    on this           [string] [default: "./"]
--src, -s                           Source folder or file in which you want to
                                    run the script         [string] [required]
--alias, -a                         Alias for a given path [string] [required]
--alias-path, --ap                  Path which you want to be replaced with
                                    alias                  [string] [required]
--extensions, -e                    File extensions which has to be parsed.
                                                  [string] [default: "js,jsx"]
--include-alias-path-directory, -i  If true it will replace path to alias for
                                    the alias path directory.
                                                    [boolean] [default: false]
--help                              Show help                        [boolean]
```

## Example
Consider this folder directory
```
|-- src
|   |-- util
|   |   |-- common.js
|   |-- index.js
|   |-- component
|   |   |-- header.js
|   |   |-- body.js
|   |   |-- util
|   |   |   |-- common.js
```


-- index.js
```js
import {debounce} from './util/common';
/***
 Other code
***/
```

-- header.js
```js
import {debounce} from '../util/common';
import {hideScrollbar} from './util/common'; //This will not change as its not on alias path

/***
 Other code
***/
```


-- body.js
```js
const {debounce} = require('../util/common');
/***
 Other code
***/
```

#### After compile
-- index.js
```js
import {debounce} from 'utils/common';
/***
 Other code
***/
```

-- header.js
```js
import {debounce} from 'utils/common';
import {hideScrollbar} from './util/common'; //This will not change as its not on alias path

/***
 Other code
***/
```


-- body.js
```js
const {debounce} = require('utils/common');
/***
 Other code
***/
```

## Aliasing modules
You can use one of the following to define alias for your files/directory in your application.
- [webpack](https://webpack.js.org/configuration/resolve/#resolve-alias) Webpack have inbuilt way to define alias for files/directory.
- [babel-plugin-module-resolver](https://github.com/tleunen/babel-plugin-module-resolver) If you want to define alias as babel transformer.
- [module-alias](https://github.com/ilearnio/module-alias) Define alias in your package.json
- [aliasify](https://github.com/benbria/aliasify) Rewrite require calls in browserify modules.

## Like this
[:star: this repo](https://github.com/s-yadav/relative-to-alias)

## Notes
- This is a codemod which will replace your source files, so make sure to either backup or commit uncommitted changes before running this tool.
