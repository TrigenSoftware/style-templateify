var fs        = require('fs'),
	path      = require('path'),

	extend    = require('extend'),
	through   = require('through2');

module.exports = function(file, options) {

	options = extend({}, {
		target: ".",
		path:   "."
	}, options);

	return through(function(buf, enc, next) {
		
		var ext    = path.extname(file),
			source = buf.toString('utf8'),
			self   = this;

		if (ext == ".sasst" || ext == ".scsst") {

			var workerSrc = require.resolve("sass.js/dist/sass.worker.js"),
				memSrc    = require.resolve("sass.js/dist/libsass.js.mem");

			copy(workerSrc,    options.target + "/sass.worker.js")
			.then(copy(memSrc, options.target + "/libsass.js.mem"))
			.then(function() {
				self.push(generateTemplateModule(source, ext == ".sasst"));
				next();
			});
			
		} else {

			this.push(source);
			next();
		}
	});
};

function copy(source, target) {
	return new Promise(function(resolve, reject) {

		fs.readFile(source, "utf8", function(err, file) {

			if (err) {
				return reject(err);
			}

			fs.writeFile(target, file, "utf8", function(err) {

				if (err) {
					return reject(err);
				}				

				resolve();
			});
		});
	});
}

function resolve(variables, prefix) {

	if (typeof variables == "undefined") {
		return "";
	}

	var variablesString = "";

	for (var key in variables) {

		var variable = variables[key];

		if (typeof variable == "object" && variable != null) {
			variablesString += resolve(variable, prefix + key + "-");
		} else {
			variablesString += "$" + prefix + key + ': ' + variable + ';\n'; 
		}
	}

	return variablesString;
}

function generateTemplateModule(styleTemplateString, indent) {

	styleTemplateString = 
	'"' + styleTemplateString
		.replace(/\\/g, "\\\\")
		.replace(/"/g, '\\"')
		.replace(/\n/g, "\\n") + 
	'"';

	var moduleString = 
		'var Sass = require("sass.js/dist/sass.js"), sass = new Sass();' +
		resolve + 
		'module.exports = function(variables) {' +
			'return new Promise(function(_resolve, _reject) {' +
				'sass.compile(resolve(variables, "") + ' + styleTemplateString + ', { indentedSyntax: ' + (indent?'true':'false') + '}, function(result) {' + 
					'if (result.text) {' + 
						'return _resolve(result.text);' + 
					'}' + 
					'_reject(result);' +
				'});' + 
			'});' +
		'};';
	
	return moduleString;
}