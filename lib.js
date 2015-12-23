var fs        = require('fs'),
	path      = require('path'),
	through   = require('through2');

var worker;

module.exports = function(file) {
	return through(function(buf, enc, next) {
		
		var ext = path.extname(file),
			source = buf.toString('utf8');

		if (ext == ".sasst" || ext == ".scsst" || ext == ".csst") {

			generateTemplateModule(file).then(function(result) {
				this.push(result);
				next();
			});
			
		} else {

			this.push(source);
			next();
		}
	});
};


function resolve(variables) {

	var result, path = [].slice.call(arguments, 1);

	for (var key in path) {

		if (typeof variables == "undefined") {
			return undefined;
		}
	
		key = path[key];
		result = variables[key];
		variables = result;
	} 

	return result;
}

function generateTemplateModule(styleTemplateString, ext) {
	return new Promise(function(resolve) {

		function generate() {

			styleTemplateString = 
			'"' + styleTemplateString
				.replace(/"/g, '\\"')
				.replace(/\n/g, "\\n")
				.replace(/\$[\w\-\.]+/g, function(variable) {
					return '" + resolve(variables, ' + variable.replace(/\$/, '"').replace(/[\.]/g, '", "') + '") + "';
				}) + 
			'"';

			var moduleString = 
				'var Sass = require("sass.js");' +
				'if (!global.__sassWorkerUrl) {' +
					'global.__sassWorkerUrl = URL.createObjectURL(new Blob(["' + worker + '"]));' +
					'Sass.setWorkerUrl(global.__sassWorkerUrl);' +
				'}' +
				'var sass = new Sass();' +  
				resolve + 
				'module.exports = function(variables) {' +
					'return new Promise(function(resolve) {' +
						'sass.compile(' + styleTemplateString + ', function(result) { resolve(result.text) });' + 
					'});' +
				'};';
			
			resolve(moduleString);
		}

		if (typeof worker == "undefined") {

			fs.readFile(require.resolve("sass.js/dist/sass.worker.js"), "utf8", function(err, file) {
				worker = file.replace(/"/g, '\\"');
				generate();
			});

		} else {
			generate();
		}
	});
}