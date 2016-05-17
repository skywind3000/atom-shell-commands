( function( module ) {
	module.exports = {
		commands: {
			type: 'array',
			default: [],
			items: {
				type: 'object',
				properties: {
					name: {
						type: 'string',
						title: 'Name of the command'
					},
					selector: {
						type: 'string',
						title: 'Atom selector',
						default: 'atom-workspace'
					},
					command: {
						type: 'string',
						title: 'Command to be executer'
					},
					arguments: {
						type: 'array',
						title: 'Extra arguments for the command',
						default: [],
						items: {
							type: 'string',
						}
					},
					options: {
						type: 'object',
						title: 'Command modifier options, like run dir (cwd)',
						properties: {
							cwd: {
								type: 'string',
								default: '{FileDir}'
							},
							env: {
								type: 'object',
								default: {}
							},
							save: {
								type: 'boolean',
								default: false
							},
							silent: {
								type: 'boolean',
								default: false
							},
							keymap: {
								type: 'string',
								default: ''
							},
							sound: {
								type: 'string',
								default: ''
							}
						},
						default : {}
					},
					matchs: {
						type: 'array',
						title: 'XRegExp expression for file, line, col',
						default: [],
						items: {
							type: 'string'
						}
					}
				},
				title: 'Command configuration'
			},
			title: 'Array of commands',
			description: 'Objects have the following properties: name, selector, command, arguments, options'
		}
	}
} )( module );
