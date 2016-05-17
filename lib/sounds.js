( function( module ) {
	var bank = {};
	module.exports.play = function(filename) {
		var path = require('path');
		var filepath = path.resolve(filename);
		var audio = null;
		if (filepath in bank) {
			audio = bank[filepath];
		}	else {
			audio = new Audio(filepath);
			bank[filepath] = audio;
		}
		audio.play();
		return true;
	}
} ) (module);

