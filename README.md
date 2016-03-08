# atom-shell-commands package

Customize shell commands for atom. Similar to 'Run Commands' in NotePad++, 'User Tool' in EditPlus/UltraEdit, 'External Tool' in GEdit and 'Shell Commands' in TextMate. 

Preface
-------
This package enables you to setup shell commands as atom commands. Shell output will be captured and display in the atom's bottom panel.If you create a command named 'gcc-build', you will find 'atom-shell-commands:gcc-build' in the atom command palette, and then use your keymaps config file to setup a shotcut for it.

I was a window user and switched to Atom from EditPlus/Notepad++. Previously I wrote a script in EditPlus to compile-run my C/C++ programs and execute Makefiles with customizable compile flags and run options. Atom has numerous community packages and I have tried some. Most of them are really great in certain extent but still cannot fully satisfy my need. Therefore I decided to reference their packages and make my own.

Feature
-------

- Customize shell command to invoke compiler or other tools with active document/project.
- Customize arguments, working directory and system environment of the command.
- Automatic create atom command for each shell command.
- User Keymap config can makes shortcut to each shell command.
- Shell output (stdout/stderr) can be captured in the bottom panel.
- Click the filename in the output bottom panel will open it.
- Regular expression to match filename and line number in the error output could be set.  

Install
-------
    apm install atom-shell-commands

Setup
-----

Configure commands on your config file (File->Open Your Config, or ~/.atom/config.cson) like this, add 'atom-shell-commands' in your user config file:
```cson
  "atom-shell-commands":
    commands: [
      {
        name: "compile"
        command: "d:/dev/mingw/bin/gcc"
        arguments: [
          "{FileName}"
          "-o"
          "{FileNameNoExt}.exe"
        ]
        options:
          cwd: "{FileDir}"
          keymap: 'ctrl-2'
      }
    ]
```
This will create the atom command "atom-shell-commands:compile" that you can now launch from the command palette or use the binding keymap 'ctrl-2'. It also generates an entry in the Atom Shell Commands menu under packages. The `command`, `arguments` and `options` values accepts the variables below:

| Macros           | Description |
|------------------|-------------|
| {FilePath}       | File name of current document with full path. |
| {FileName}       | File name of current document without path. |
| {FileDir}        | Full path of current document without the file name |
| {FileExt}        | File extension of current document |
| {FileNameNoExt}  | File name of current document without path and extension |
| {ProjectDir}     | Current project directory |
| {ProjectRel}     | File name relativize to current project directory |
| {CurRow}         | Current row(line number) where the cursor is located |
| {CurCol}         | Current column index where the cursor is located |
| {CurSelected}    | Selected text |
| {CurLineText}    | Current line text |

You can setup as many commands as you like to build with your project makefile, or compile a single source file directly, or just invoke grep in the current directory. A certain command is represented by the fileds below:

| Field | Mode | Description |
|-------|----|---------|
| name | required | The name of the target. Viewed in the menu | 
| selector | optional | atom selector, default is 'atom-workspace' |
| command | required | The executable command |
| auguments | optional | An array of arguments for the command |
| matchs | optional | regular expression to match file name in output |
| options | optional | additional options to config dir, environment, keymap etc |

The `options` field is an key/value object contains:

| Options | Mode | Description |
|---------|------|-------|
| cwd | optional | Working directory of the command |
| env | optional | Key/value based system environment setting |
| save | optional | True or false(default) to save the current file before execute |
| keymap | optional | A keymap string as defined by Atom. Pressing this key combination will trigger the target. Examples: ctrl-alt-k or cmd-U. |

Examples
--------

Compiling with command 'gcc'

![](https://github.com/skywind3000/atom-shell-commands/blob/master/images/command_compile.png?raw=true)

Running with command 'execute'

![](https://github.com/skywind3000/atom-shell-commands/blob/master/images/command_execute.png?raw=true)

command 'execute' config:
```cson
      {
        name: "execute"
        selector: "atom-workspace"
        command: "{FileNameNoExt}"
        options:
          cwd: "{FileDir}"
      }
```

Running in a new window

![](https://github.com/skywind3000/atom-shell-commands/blob/master/images/command_runinwindow.png?raw=true)

command 'runinwindow' config:
```cson
      {
        name: "runinwindow"
        selector: "atom-workspace"
        command: "cmd"
        arguments: [
          "/C"
          "start"
          "d:/software/atom/launch.cmd"
          "{FileNameNoExt}"
        ]
        options:
          cwd: "{FileDir}"
      }
```

you need to write a batch file in windows to open a new window, here is source of launch.cmd:
```
@echo off
%1
pause
exit
```

Error Matching
--------------

Error matching lets you specify a single regular expression or a list of regular expressions, which capture the output of your build command and open the correct file, row and column of the error. For instance:

```
ztest_hello.cpp: In function 'int main()':
ztest_hello.cpp:7:10: error: expected initializer before 'int'
```

Would be matched with the expression: `^(?<file>[\\/0-9a-zA-Z\\._\\\\:]+):(?<line>\\d+):(?<col>\\d+):`. After the build has failed, click on the error output line, the file would be opened and the cursor would be placed at row 7, column 10.

Note the syntax for match groups. This is from the [XRegExp](http://xregexp.com/) package
and has the syntax for named groups: `(?<name> RE )` where `name` would be the name of the group
matched by the regular expression `RE`.

The following named groups can be matched from the output:
  * `file` - **[required]** the file to open. May be relative `cwd` or absolute. `(?<file> RE)`.
  * `line` - *[optional]* the line the error resides on. `(?<line> RE)`.
  * `col` - *[optional]* the column the error resides on. `(?<col> RE)`.

Since the regular expressions are written in a JSON file, backslashes must be escaped.

The `file` should be an absolute path, or relative the `cwd` specified. If no `cwd` has been specified, default value '/' will be used.

Example user config file which is using error matching:

```cson
*:
  "atom-shell-commands":
    commands: [
      {
        name: "compile"
        selector: "atom-workspace"
        command: "d:/dev/mingw/bin/gcc"
        arguments: [
          "{FileName}"
          "-o"
          "{FileNameNoExt}.exe"
        ]
        matchs: [
          "^(?<file>[\\/0-9a-zA-Z\\._\\\\:]+):(?<line>\\d+):(?<col>\\d+):"
          "^(?<file>[\\/0-9a-zA-Z\\._\\\\:]+):(?<line>\\d+):"
          "^(?<file>[\\/0-9a-zA-Z\\._\\\\:]+)\\s*\\((?<line>\\d+)\\)\\s*:*:"
        ]
        options:
          cwd: "{FileDir}"
          keymap: 'ctrl-2'
          save: true
      }
    ]
```

This will match the `file`, `line` and `col` in both clang/gcc or msvc error output.

Misc
----
atom-shell-commands has been tested in windows, mac os and ubuntu. You can use 'open' in mac os or '/usr/bin/gnome-terminal' in ubuntu to open a new window and execute your executable.

TO-DO
-----
- Commands could be setup in a new GUI window, not only in user config.



Reference
---------

- [https://github.com/DPISA/atom-user-commands](https://github.com/DPISA/atom-user-commands "atom-user-commands") (based on it).
- [https://github.com/joefitzgerald/go-plus](https://github.com/joefitzgerald/go-plus) (referenced).
- [https://github.com/noseglid/atom-build](https://github.com/noseglid/atom-build) (referenced).
- [https://github.com/ksxatompackages/cmd-exec](https://github.com/ksxatompackages/cmd-exec) (referenced).

