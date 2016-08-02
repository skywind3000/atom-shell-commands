( function( window, atom, require, module, undefined ) {
	'use strict';

	// Imports
	var atomutils = require('atom');
	var atommsgpanel = {
		MessagePanelView: null,
		PlainMessageView: null,
		LineMessageView: null
	}

	// Instance
	var commands = {
		subscriptions: new atomutils.CompositeDisposable(),
		panel: null,
		config: require( './config' ),
		childs: [],
		quickfix: {
			index: -1,
			error: []
		}
	}

	commands.activate = function( state ) {
		
		// Define and update a command list from the user config
		var registeredAtomCommands = [];

		atom.config.observe( 'atom-shell-commands', {}, function( value ) {

			// Dispose old commands
			registeredAtomCommands.forEach( function( disposable ) {

				// Remove it from subscriptions and...
				commands.subscriptions.remove( disposable );

				// ... dispose it manually
				disposable.dispose();
			} );

			registeredAtomCommands = [];

			if (value != null && value != undefined && 
				value.commands != null && value.commands != undefined) {
				// Register new commands
				value.commands.forEach( function( command ) {

					// Create an atom command for each entry
					var commandName = 'atom-shell-commands:' + command.name;
					var commandSelector = command.selector || 'atom-workspace';
					var atomCommand = atom.commands.add( commandSelector, commandName, function() {
						execute( command.command, command.arguments, command.options, command.matchs );
					} )

					// Create a menu entry for each command
					var menuEntry = atom.menu.add( [ {
						label : 'Packages',
						submenu: [ {
							label: 'Atom Shell Commands',
							submenu: [
								{
									label: command.name,
									command: commandName
								}
							]
						} ]
					} ] );
					
					// Register it in the subscriptions;
					registeredAtomCommands.push( atomCommand );
					registeredAtomCommands.push( menuEntry );

					commands.subscriptions.add( atomCommand );
					commands.subscriptions.add( menuEntry );
					
					var options = command.options || {};
					var keymap = options.keymap || '';
					
					if (keymap) {
						const specifies = { 'atom-workspace': {} };
						specifies['atom-workspace'][keymap] = commandName;
						var keyname = 'atom-shell-commands-keymap:' + command.name;
						var entry = atom.keymaps.add(keyname, specifies);
						
						registeredAtomCommands.push(entry);
						commands.subscriptions.add(entry);
					}
				} );
			}
			
		} );
		
		var where = 'atom-workspace';
		var prefix = 'atom-shell-commands-config:';
		var subscriptions = commands.subscriptions;
		
		subscriptions.add(atom.commands.add(where, prefix + 'toggle', function() {
			toggle();
		}));
		
		subscriptions.add(atom.commands.add(where, prefix + 'stop', function() {
			childStop();
		}));
		
		subscriptions.add(atom.commands.add(where, prefix + 'kill', function() {
			childKill();
		}));
		
		subscriptions.add(atom.commands.add(where, prefix + 'error-first', function() {
			quickfixActive(0);
		}));
		
		subscriptions.add(atom.commands.add(where, prefix + 'error-last', function() {
			quickfixActive(commands.quickfix.error.length - 1);
		}));
		
		subscriptions.add(atom.commands.add(where, prefix + 'error-next', function() {
			if (commands.quickfix.index < commands.quickfix.error.length - 1) {
				quickfixActive(commands.quickfix.index + 1);
			}
		}));
		
		subscriptions.add(atom.commands.add(where, prefix + 'error-prev', function() {
			if (commands.quickfix.index > 0) {
				quickfixActive(commands.quickfix.index - 1);
			}
		}));
	}

	commands.deactivate = function() {
		if (commands.childs) {
			var pids = Object.keys(commands.childs);
			pids.forEach(function(pid) {
				var child = commands.childs[pid];
				delete commands.childs[pid];
				child.kill('SIGKILL');
			});
		}
		
		commands.subscriptions.dispose();
		
		if (commands.panel) {
			commands.panel.remove();
			commands.panel = null;
		}
		
		if (commands.quickfix) {
			commands.quickfix.error = [];
			commands.quickfix.index = -1;
		}
	}

	commands.serialize = function() {
		return {};
	}
	
	function toggle() {
		messageInit();
		if (commands.panel && commands.panel.panel && commands.panel.panel.isVisible()) {
			messageHide();
		} else {
			messageShow();
		}
	}
	
	function childStop() {
		var pids = Object.keys(commands.childs);
		pids.forEach(function(pid) {
			var child = commands.childs[pid];
			child.kill();
		});
	}
	
	function childKill() {
		var pids = Object.keys(commands.childs);
		pids.forEach(function(pid) {
			var child = commands.childs[pid];
			child.kill('SIGKILL');
			delete commands.childs[pid];
		});
	}
	
	function messageInit() {
		if (!commands.panel) {
			var module = require ('atom-message-panel');
			atommsgpanel.MessagePanelView = module.MessagePanelView;
			atommsgpanel.LineMessageView = module.LineMessageView;
			atommsgpanel.PlainMessageView = module.PlainMessageView;
			
			commands.panel = new atommsgpanel.MessagePanelView({
				title: 'Atom Shell Commands',
				rawTitle: false,
				autoScroll: true,
				maxHeight: "130px"
			});
		}
	}
	
	function messageShow() {
		messageInit();
		if (commands.panel) {
			commands.panel.attach();
		}
	}
	
	function messageHide() {
		messageInit();
		if (commands.panel) {
			commands.panel.close();
		}
	}
	
	function messageClear() {
		messageInit();
		if (commands.panel) {
			commands.panel.clear();
		}
	}
	
	function messagePlain(message, style) {
		if (!commands.panel) {
			messageInit();
		}
		if (commands.panel) {
			var text = new atommsgpanel.PlainMessageView({
				raw: false,
				message: message,
				className: style
			});
			var position = commands.panel.body[0].scrollHeight;
			commands.panel.add(text);
			text.atompos = position - text.outerHeight();
			return text;
		}
		return null;
	}
	
	function messageLine(file, line, column, message, style, preview) {
		if (!commands.panel) {
			messageInit();
		}
		if (commands.panel) {
			var text = new atommsgpanel.LineMessageView({
				file: file, 
				line: line,
				column: column, 
				message: message,
				className: style,
				preview: preview
			});
			text.position.text(message)
			text.contents.text('');
			text.position.addClass(style);
			text.position.removeClass('text-subtle');
			//text.position.removeClass('inline-block');
			var position = commands.panel.body[0].scrollHeight;
			commands.panel.add(text);
			text.atompos = position - text.outerHeight();
			return text;
		}
		return null;
	}
	
	function updateScroll() {
		messageInit();
		if (commands.panel) {
			commands.panel.updateScroll();
		}
	}
	
	function updateTitle(title) {
		messageInit();
		if (!commands.panel) return;
		if (!title) {
			commands.panel.setTitle('Atom Shell Commands');
		}	else {
			commands.panel.setTitle('Atom Shell Commands: ' + title);
		}
	}
	
	function quickfixReset() {
		if (commands.quickfix) {
			var quickfix = commands.quickfix;
			quickfix.index = -1;
			for (var i = 0; i < quickfix.error.length; i++) {
				var x = quickfix.error[i];
				quickfix.error[i] = null;
				x.view = null;
				x.filename = null;
				x.style1 = null;
				x.style2 = null;
				x = null;
			}
			quickfix.error = [];
		}
	}
	
	function quickfixPush(view, filename, line, column, position, style) {
		var obj = {
			view: view,
			filename: filename,
			line: line,
			column: column,
			position: position,
			style: style,
		}
		if (commands.quickfix) {
			commands.quickfix.error.push(obj);
		}
	}
	
	function quickfixActive(index) {
		if (commands.panel == null) return -1;
		if (commands.panel.body == null) return -2;
		var quickfix = commands.quickfix;
		if (quickfix.index >= 0 && quickfix.index < quickfix.error.length) {
			var error = quickfix.error[quickfix.index];
			var view = error.view;
			if (view) {
				view.removeClass("selected");
			}
			quickfix.index = -1;
		}
		if (index < 0 || index >= quickfix.error.length) return -3;
		var error = quickfix.error[index];
		commands.panel.body.scrollTop(error.position);
		if (error.view) {
			error.view.addClass("selected");
		}
		quickfix.index = index;
		if (error.view) {
			error.view.goToLine();
		}	
		return 0;
	}
	
	// Execute an OS command
	function execute( command, args, options, matchs ) {
		var mode = options.mode || '';

		mode = (mode == '' && options.silent)? 'silent' : mode;
		mode = (mode == 'window' || mode == 'open')? 'terminal' : mode;
		mode = (mode != 'terminal' && mode != 'silent')? '' : mode;

		if (mode != 'terminal') {
			messageClear();
			quickfixReset();
		}

		if (mode == '') {
			messageShow();
		}

		var env = getEnv();
		if (env == null) {
			env = {
				FilePath: '',
				FileName: '',
				FileDir: '',
				FileExt: '',
				FileNameNoExt: '',
				ProjectDir: '',
				ProjectRel: ''				
			}
		}
		
		var command = replace( command || '', env );
		var args = replace( args || [], env );
		var options = replace( options || {}, env );
		var matchs = matchs || [];
		var cwd = options.cwd || '';
		
		if (options.save == true) {
			var editor = atom.workspace.getActiveTextEditor();
			if (editor) {
				try {
					editor.save();
				}
				catch (e) {
				}
			}
		}
		
		// make a copy of args to avoid modify config
		var argv = []
		for (var i = 0; i < args.length; i++) {
			// empty string in config.cson may turn into undefined
			argv.push((args[i] != null && args[i] != undefined)? args[i] : '');
		}

		// Announcing launch
		var echo = JSON.stringify([command].concat(argv));
		var text = "> " + command + ' ' + JSON.stringify( argv ) + ' cwd="' + cwd + '"';

		if (mode != 'terminal') {
			messagePlain(echo, 'echo');
		}
		
		var XRegExp = require('xregexp');
		var path = require('path');
		
		for (var i = 0; i < matchs.length; i++) {
			matchs[i] = XRegExp.XRegExp(matchs[i]);
		}
		
		function output(text, style) {
			for (var i = 0; i < matchs.length; i++) {
				var result = XRegExp.XRegExp.exec(text, matchs[i]);
				if (result == null) continue;
				if (!result.file) continue;
				var file = result.file;
				var line = parseInt(result.line || '1') || 1;
				var col = parseInt(result.col || '1') || 1;
				if (style == 'stdout') style = 'stdout-match';
				else if (style == 'stderr') style = 'stderr-match';
				if (!path.isAbsolute(file)) {
					file = path.join(cwd, file);
				}
				var text = messageLine(file, line, col, text, style);
				updateScroll();
				if (text) {
					var position = text.atompos;
					if (position < 0) position = 0;
					quickfixPush(text, file, line, col, position, style);
				}
				return;
			}
			messagePlain(text, style);
			updateScroll();
		}
		
		// sounds
		var sounds = require('./sounds');
		
		// record time
		var millisec = (new Date()).getTime();	
		const spawn = require('child_process').spawn;
		const terminal = require('./terminal');

		if (mode == "terminal") {
			terminal.open_terminal( command, argv, options );
			//messagePlain("open new terminal to launch", "echo");
			return;
		}
		
		// Run the spawn, we pass argv to make a shallow copy of the array because spawn will modify it.
		var proc = spawn( command, argv, options );
		
		var stdout_cache = '';
		var stderr_cache = '';
		
		commands.childs[proc.pid] = proc;

		// Update console panel on data
		proc.stdout.on( 'data', function( data ) {
			stdout_cache += data;
			while (true) {
				var index = stdout_cache.indexOf('\n');
				if (index < 0) break;
				var text = stdout_cache.substring(0, index + 1);
				stdout_cache = stdout_cache.substring(index + 1);
				output(text, 'stdout');
			}
		} );

		// Update console panel on error data
		proc.stderr.on( 'data', function( data ) {
			stderr_cache += data;
			while (true) {
				var index = stderr_cache.indexOf('\n');
				if (index < 0) break;
				var text = stderr_cache.substring(0, index + 1);
				stderr_cache = stderr_cache.substring(index + 1);
				output(text, 'stderr');
			}
		} );

		proc.stdout.on( 'close', function( code, signal ) {
			// console.info('command closed', code, signal);
			if (stdout_cache.length > 0) {
				output(stdout_cache, 'stdout');
				stdout_cache = '';
			}
		} );

		proc.stderr.on( 'close', function( code, signal ) {
			if (stderr_cache.length > 0) {
				output(stderr_cache, 'stderr');
				stderr_cache = '';
			}
		} );
		
		// Register code for error
		proc.on('error', function(msg) {
			output(msg, 'error');
		});
		
		// Register code for termination
		proc.on('close', function(code) {
			var current = (new Date()).getTime();
			var delta = (current - millisec) * 0.001;
			var style = 'echo';
			if (code == null || code == undefined) {
				output('[Finished in ' + delta.toFixed(2) + ' seconds]', style);				
			}	else {
				if (code == 0) {
					output('[Finished in ' + delta.toFixed(2) + ' seconds]', style);
				}	else {
					output('[Finished in ' + delta.toFixed(2) + ' seconds, with code ' + code.toString() + ']', style);
				}
			}
			
			if (proc.pid in commands.childs) {
				delete commands.childs[proc.pid];
			}			
			
			if (options.sound != undefined && options.sound != null && options.sound != '') {
				sounds.play(options.sound);
			}

		});
	}

	// Generate Environment variables
	function getEnv() {
		var editor = atom.workspace.getActiveTextEditor();
		if (editor == undefined || editor == null)
			return null;
		if (editor.getPath == undefined || editor.getPath == null)
			return null;
			
		var filepath = editor.getPath();

		if (filepath == undefined || filepath == null) {
			return null;
		}
		
		var path = require('path');
		var filename = path.basename(filepath);
		var filedir = path.dirname(filepath);
		
		var info = path.parse(filepath);
		var extname = info.ext;
		var mainname = info.name;
		var paths = atom.project.relativizePath(filepath);
		if (extname == undefined || extname == null) extname = "";	
		var selected = editor.getSelectedText() || "";
		var position = editor.getCursorBufferPosition() || null;
		var curcol = (position)? position.column : 0;
		var currow = (position)? position.row : 0;
		var linetext = "";
		var curword = "";

		if (position) {
			var range = [[currow, 0], [currow, 1E10]];
			linetext = editor.getTextInBufferRange(range) || '';
			curword = editor.getWordUnderCursor();
		}

		var env = {
			FilePath: filepath,
			FileName: filename,
			FileDir: filedir,
			FileExt: extname,
			FileNameNoExt: mainname,
			ProjectDir: (paths[0])? paths[0] : "",
			ProjectRel: paths[1],
			CurRow: currow,
			CurCol: curcol,
			CurSelected: selected,
			CurLineText: linetext,
			CurWord: curword
		};
		
		return env;
	}

	// Replace members with env variables.
	function replace( input, vars ) {
		// Dispatch input type
		if ( !input ) {
			return;
		} else if ( typeof input == 'string' ) {
			return replaceString( input, vars );
		} else if ( Array.isArray( input ) ) {
			return replaceArray( input, vars );
		} else if ( typeof input == 'object' ) {
			return replaceObject( input, vars );
		} else {
			return input;
		}
	}

	// replace a string with vars.
	function replaceString( input, vars ) {
		var keys = Object.keys(vars);
		keys.forEach( function(key) {
			var word = '{' + key + '}';
			var value = vars[key];
			input = input.split(word).join(value);
		});
		return input;
	}

	// Replace array string elements with variables
	function replaceArray( input, vars ) {
		var output = new Array(input.length);	
		for ( var i = 0; i < input.length; i++ ) {
			output[ i ] = replace( input[ i ], vars );
		}
		return output;
	}

	// Replaces oboject string members with variables
	function replaceObject( input, vars ) {
		var output = {};
		var keys = Object.keys( input );
		keys.forEach( function( key ) {
			output[ key ] = replace( input[ key ], vars );
		} );
		return output;
	}

	// TODO: Register active processes for killing;

	// Publishing a reference
	module.exports = commands;

} )( window, atom, require, module );


