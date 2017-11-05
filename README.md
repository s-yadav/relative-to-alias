A tiny cli tool (codemod) to replace relative paths to given alias in your project. It does the opposite of [aliasify](https://github.com/benbria/aliasify), [module-alias](https://github.com/ilearnio/module-alias), or more specifically it works in conjunction to those modules. It makes sure that in your source code all relative paths (for which you have defined alias using those modules) should be replaced to alias.

#### When do you need this?
- On later point of time you decided to create a alias for a path. But in your project you have already used relative path in src files for that path. With this cli tool you can update those relative paths in src files to alias more reliably

- If any one used relative path instead of defined alias, you want to refactors them to alias

### Install
```
npm install -g relative-to-alias
```

### Usage
On your project root directory
```
node start.js --src ./src --alias utils --alias-path ./src/util
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

### Like this
[:star: this repo](https://github.com/s-yadav/relative-to-alias)
