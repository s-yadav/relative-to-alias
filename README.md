A tiny cli tool (codemod) to replace relative paths to given alias in your project. It does the opposite of [aliasify](https://github.com/benbria/aliasify), [module-alias](https://github.com/ilearnio/module-alias), or more specifically it works in conjunction to those modules. It makes sure that in your source code all relative paths (for which you have defined alias using those modules) should be replaced to alias.

#### When do you need this?
You have defined alias on your webpack or babelrc and you want to refactor your code to start using those alias instead of relative paths.


### Install
```
npm install -g relative-to-alias
```

### Usage
On your project root directory
```
relative-to-alias --src ./src --alias utils --alias-path ./src/util
```
Note: alias-path is relative to root-path argument. while src path is relative to the current directory.

```
Options:
  --root-path, -r                   Root path of your project folder. Your
                                    imports / requires will be resolved based on
                                    this                [string] [default: "./"]
  --src, -s                         Source folder or file in which you want to
                                    run the script           [string] [required]
  --alias, -a                       Alias for a given path   [string] [required]
  --alias-path, --ap                Path which you want to be replaced with
                                    alias                    [string] [required]
  --extensions, -e                  File extensions which has to be parsed.
                                                    [string] [default: "js,jsx"]
  --leave-alias-path-directory, -l  If true it will not replace path to alias
                                    for the alias path directory.
                                                      [boolean] [default: false]
  --help                            Show help                          [boolean]
```

### Example
Consider this folder directory
|-- src
|   |-- util
|   |   |-- common.js
|   |-- index.js
|   |-- component
|   |   |-- header.js
|   |   |-- body.js
|   |   |-- util
|   |   |   |-- common.js



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

### Like this
[:star: this repo](https://github.com/s-yadav/relative-to-alias)
