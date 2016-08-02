( function( module ) {
	var os = require('os');
	var path = require('path');
	var spawn = require('child_process').spawn;
	var dirname = __dirname;
	var vendor = path.resolve(dirname, '../vendor');
	var osname = os.type();
	var win32 = os.type() == 'Windows_NT';
	var cmd = 'cmd.exe';
	var gnome_terminal = undefined;
	var xterm = undefined;
	
	function search_bin(name, locations) {
		var process = require('process');
		var path = require('path');
		var fs = require('fs');
		var os = require('os');
		var win32 = os.type() == 'Windows_NT';
		if (process.env.PATH) {
			var PATH = process.env.PATH;
			if (win32) {
				PATH = PATH.split(';');
			}	else {
				PATH = PATH.split(':');
			}
			for (var i = 0; i < PATH.length; i++) {
				var filepath = path.join(PATH[i], name);
				try {
					fs.accessSync(filepath, fs.F_OK);
					return win32? filepath.split('/').join('\\') : filepath;
				}
				catch (e) {
				}
			}
		}
		if (locations) {
			for (var i = 0; i < locations.length; i++) {
				var filepath = path.join(locations[i], name);
				try {
					fs.accessSync(filepath, fs.F_OK);
					return win32? filepath.split('/').join('\\') : filepath;
				}
				catch (e) {
				}
			}
		}
		return undefined;
	}

	if (win32) {
		var loc = ['C:/Windows/System32', 'C:/Windows/SysWOW64'];
		loc.push('C:/WinNT/System32');
		loc.push('C:/WinNT/SysWOW64');
		cmd = search_bin('cmd.exe', loc);
		cmd = cmd.split('/').join('\\');
	}
	else if (osname == 'Linux') {
		gnome_terminal = search_bin('gnome-terminal', ['/bin', '/usr/bin']);
		xterm = search_bin('xterm', ['/bin', '/usr/bin']);
	}

	module.exports.open_windows = function(command, argv, options) {
		var argument = ['/C', 'start', cmd, '/C'];
		argument.push(path.join(vendor, "launch.cmd"));
		argument.push(command);
		argument = argument.concat(argv);
		options.detached = true;
		options.stdout = 'ignore';
		options.stderr = 'ignore';
		options.shell = false;
		command = cmd;
		if (false) {
			command = 'cmd.exe';
			argument = ['/C', 'start', cmd, '/C', 'echo', 'fuck'];
		}
		var proc = spawn(command, argument, options);
	}

	module.exports.open_linux_gnome = function(command, argv, options) {
	}

	module.exports.open_linux_xterm = function(command, argv, options) {
	}

	module.exports.open_darwin_terminal = function(command, argv, options) {
	}

	module.exports.open_terminal = function(command, argv, options) {
		options.detached = true;
		options.stdout = 'ignore';
		options.stderr = 'ignore';
		options.shell = false;
		if (osname == 'Windows_NT') {
			this.open_windows(command, argv, options);
		}
		else if (osname == 'Linux') {
			var terminal = 'xterm';
			
		}
	}

	module.exports.test = function(a, b) {
		return a + b;
	}
} ) (module);




