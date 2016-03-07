( function( window, atom, require, module, undefined ) {
	'use strict';

	// Imports
	var atomutils = require('atom');
	var spawn = require('win-spawn');
	var atommsgpanel = require ('atom-message-panel');
	var XRegExp = require('xregexp');

	// Instance
	var commands = {
		subscriptions: new atomutils.CompositeDisposable(),
		panel: null,
		config: require( './config' )
	}

	commands.activate = function( state ) {
		
		// create MessagePanelView
		if (!commands.panel) {
			commands.panel = new atommsgpanel.MessagePanelView({
				title: '<span class="icon-diff-added"></span> Atom Shell Commands',
				rawTitle: true
			});
		}
		
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
					var atomCommand = atom.commands.add( command.selector, commandName, function() {
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
					
					var options = command.options || {};
					var keymap = options.keymap || '';

					// Register it in the subscriptions;
					registeredAtomCommands.push( atomCommand );
					registeredAtomCommands.push( menuEntry );

					commands.subscriptions.add( atomCommand );
					commands.subscriptions.add( menuEntry );
				} );
			}
		} );
	}

	commands.deactivate = function() {
		if (commands.panel) {
			commands.panel.remove();
			commands.panel = null;
		}
		commands.subscriptions.dispose();
	}

	commands.serialize = function() {
		return {};
	}
	
	function messageShow() {
		if (commands.panel) {
			commands.panel.attach();
		}
	}
	
	function messageHide() {
		if (commands.panel) {
			commands.panel.close();
		}
	}
	
	function messageClear() {
		if (commands.panel) {
			commands.panel.clear();
		}
	}
	
	function messagePlain(raw, message, style) {
		if (commands.panel) {
			var text = new atommsgpanel.PlainMessageView({
				raw: raw,
				message: message,
				className: style
			});
			commands.panel.add(text);
		}
	}
	
	function messageLine(file, line, column, message, style, preview) {
		if (commands.panel) {
			var text = new atommsgpanel.LineMessageView({
				file: file, 
				line: line,
				column: column, 
				message: message,
				className: style,
				preview: preview
			});
			text.position.text(message);
			text.contents.text('');
			commands.panel.add(text);
		}
	}
	
	// Execute an OS command
	function execute( command, args, options, matchs ) {
		
		messageClear();
		messageShow();
		
		// Cancel the close console listener
		if (commands.closeConsoleDisposable) {
			commands.closeConsoleDisposable.dispose();
			commands.subscriptions.remove(commands.closeConsoleDisposable);
		}

		var env = getEnv();
		if (env == null) {
			console.log("no filename");
			messagePlain(false, "Active filename not defined. saved first ?", "echo");
			return;
		}
		
		var command = replace( command || '', env );
		var args = replace( args || [], env );
		var options = replace( options || {}, env );
		var matchs = matchs || [];
		
		if (options.save == true) {
			var editor = atom.workspace.getActiveTextEditor();
			if (editor) {
				editor.save();
			}
		}

		// Announcing launch
		var text = "> " + command + ' ' + JSON.stringify( args ) + ' ' + JSON.stringify( options );
		messagePlain(false, text, 'echo');
		
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
				messageLine(file, line, col, text, style);
				return;
			}
			messagePlain(false, text, style);
		}
		
		// record time
		var millisec = (new Date()).getTime();
		
		// Run the spawn, we pass args.slice() to make a shallow copy of the array because spawn will modify it.
		var proc = spawn( command, args.slice(), options );
		
		var stdout_cache = '';
		var stderr_cache = '';

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
			if (stderr_cache.length > 0) {
				output(stderr_cache, 'stderr');
				stderr_cache = '';
			}
			var current = (new Date()).getTime();
			var delta = (current - millisec) * 0.001;
			output('[Finished in ' + delta.toFixed(2) + ' seconds]', 'stdout');
		} );

		// Register code for termination
		proc.stderr.on( 'close', function( code, signal ) {
			if (stderr_cache.length > 0) {
				output(stderr_cache, 'stderr');
				stderr_cache = '';
			}
			// Register an action for panel destruction
			commands.closeConsoleDisposable = atom.commands.add( 'atom-workspace', 'core:cancel', function() {
				messageHide();
				commands.closeConsoleDisposable.dispose();
				commands.subscriptions.remove( commands.closeConsoleDisposable );
			} )

			commands.subscriptions.add( commands.closeConsoleDisposable );
		} );
	}

	// Generate Environment variables
	function getEnv() {
		var editor = atom.workspace.getActiveTextEditor();
		if (editor == undefined || editor == null)
			return null;
		if (editor.getPath == undefined || editor.getPath == null)
			return null;
			
		var filepath = atom.workspace.getActiveTextEditor().getPath();

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
		
		var env = {
			FilePath: filepath,
			FileName: filename,
			FileDir: filedir,
			FileExt: extname,
			FileNameNoExt: mainname,
			ProjectDir: paths[0],
			ProjectRel: paths[1]
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
			input = input.replace(word, value);
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


