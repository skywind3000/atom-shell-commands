## 1.4.0 - 2016/5/17
* New: `sound` option to play a sound file (wav/mp3/ogg) after command finished

## 1.3.15 - 2016/4/18
* New: `silent` option to hide output panel by  [@damncabbage](https://github.com/damncabbage).
* Fixed: toggle command issue, by [@damncabbage](https://github.com/damncabbage) again.

## 1.3.14 - 2016/4/5
* Fixed: catch spawn error on a no exist command

## 1.3.13 - 2016/4/3
* Fixed: spawn failed in windows when command name contains space (eg. 'C:/program files (x86)/xxx')
* Remove 'win-spawn' module which is really out-of-date and use 'child_process.spawn' directly 

## 1.3.10 - 2016/4/1
* Adjust the style of bottom output panel, make it more neat now.

## 1.3.0 - 2016/3/30
* New '{CurWord}' macro to get the current word under cursor which can be  passed to external manual or dictionary.
* New quickfix mode in bottom output panel with direct command and hotkey to jump from one error to another without touching your mouse.

## 1.2.0 - 2016/3/17
* Reduce loading time from 140ms to 2ms by using delay initializing and other optimizes.
* Update document.

## 1.1.19 - 2016/3/13
* Fixed exception when save=true in a untitled file.
* Fixed {ProjectDir} becomes "null" when a file isn't in any project.
* Update document.

## 1.1.11 - 2016/3/9
* New 'stop' command in menu to stop child processes

## 1.1.10 - New Relase
* New white-space:pre in the style of the bottom panel to avoid space issue.
* New document about error match.
* Simplify some module.

## 1.1.0 - Child Process Management
* Child processes can be stop now.
* Add child process return value prompt.
* Fixed empty parameter item issue in config file.

## 1.0.0 - More Stable
* Add keymap option in the config file.
* Add {CurRow} {CurCol} {CurSelected} {CurTextLine} macros.
* Rewrote some module.
* Fixed numerous issues in some corners.

## 0.8.0 - More Powerful
* Add atom-message-panel to replace old <div> panel. Bottom panel can resize now.
* Add save option to indicate if you need save the file before execution.
* Add XRegExp to match error output.
* Add {ProjectDir} {ProjectRel} macros.
* Update package description.
* Fixed issues when editing a noname file (new file).
* Implement caches to split new lines from stdout/stdin.
* Fixed issues in windows.


## 0.5.0 - More Useful
* Support {FileName} {FileExt} {FileNameNoExt} {FilePath} in macros.
* Support options.env to setup system environment.
* Display how long has the command been executed.
* Fixed string replace issue in empty strings.

## 0.1.0 - First Release
* Rewrite atom-user-commands and fixed from atom-user-commands.
* Make first release
