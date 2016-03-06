# atom-shell-commands package

Customize shell commands for atom. Similar to 'Shell Commands' in TextMate, 'User Tool' in EditPlus/UltraEdit, 'External Tool' in GEdit and 'Run Commands' in NotePad++. 

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

Install
-------
    apm install atom-shell-commands

Setup
-----

Configure commands on your config file like this:
```cson
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
        options:
          cwd: "{FileDir}"
      }
    ]
```
This will create the atom command "atom-shell-commands:compile" that you can now bind to an keymap or launch from the command palette. It also generates an entry in the Atom Shell Commands menu under packages. The command, arguments and options values accepts the variables below:

| Macros           | Description |
|------------------|-------------|
| {FilePath}       | File name of current document with full path. |
| {FileName}       | File name of current document without path. |
| {FileDir}        | Full path of current document without the file name |
| {FileExt}        | File extension of current document |
| {FileNameNoExt}  | File name of current document without path and extension |
| {ProjectDir}     | Current project directory |
| {ProjectRel}     | File name relativize to current project directory |

The 'options' field can be:

| Options | Description |
|---------|-------------|
| cwd | Working directory of the command |
| env | Key/value based system environment setting |

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
        command: "{FileNameWithoutExt}"
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
          "{FileNameWithoutExt}"
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

Bottom panel control
--------------------
- *"atom-shell-commands-config: up"*  to increase the size of bottom panel.
- *"atom-shell-commands-config: down"*  to decrease the size of bottom panel.
- *"atom-shell-commands-config: clear"*  to clear the text of bottom panel.
- *"atom-shell-commands-config: hide"*  to hide the bottom panel.

Each command can be binded to a keymap or launched from the command palette. Drag-to-resize is still developing in progress.

Misc
----
atom-shell-commands has been tested in windows, mac os and ubuntu. You can use 'open' in mac os or '/usr/bin/gnome-terminal' in ubuntu to open a new window and execute your executable.

TO-DO
-----
- Resizable bottom panel (current version require execute atom-shell-commands-config:up / down in command palette)
- Click filename in output panel will open the file.



Reference
---------
atom-shell-commands is based on [https://github.com/DPISA/atom-user-commands](https://github.com/DPISA/atom-user-commands "atom-user-commands") with more features and bug fixes.

