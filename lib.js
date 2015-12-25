var fs        = require('fs'),
	path      = require('path'),
	ncp       = require('ncp').ncp,
	mkdirp    = require('mkdirp'),

	extend    = require('extend'),
	through   = require('through2');

var initialized = false;

module.exports = function(file, options) {

	options = extend({}, {
		target:  ".",
		path:    ".",
		caching: true
	}, options);

	return through(function(buf, enc, next) {
		
		var ext  = path.extname(file),
			self, source;

		if (ext == ".sasst" || ext == ".scsst") {

			self   = this;
			source = buf.toString('utf8');

			if (initialized && options.caching) {

				initialized.then(function() {
					self.push(generateTemplateModule(source, ext == ".sasst"));
					next();
				});

				return;
			}

			var distPath = require.resolve("sass.js/dist/sass.js").replace(/\/sass\.js$/, "");

			options.path   += "/sass.js/dist";
			options.target += "/sass.js/dist";

			initialized = Promise.all([createModule(options.path), copy(distPath, options.target)]);

			initialized.then(function() {
				self.push(generateTemplateModule(source, ext == ".sasst"));
				next();
			});
			
		} else {

			this.push(buf);
			next();
		}
	});
};

function copy(source, target) {
	return new Promise(function(resolve, reject) {

		mkdirp(target, function(err) {

			if (err) {
				return reject(err);
			}
		
			ncp(source, target, function(err) {

				if (err) {
					return reject(err);
				}			

				resolve();
			});
		});
	});
}

function createModule(path) {

	var moduleString = 
		'var Sass = require("sass.js/dist/sass.js");' +
		'module.exports = new Sass("' + path + '/sass.worker.js");'
	;

	return new Promise(function(resolve, reject) {

		fs.writeFile(__dirname + "/_sass.js", moduleString, "utf8", function(err) {

			if (err) {
				return reject(err);
			}				

			resolve();
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
		'var sass = require("' + __dirname + '/_sass.js");' +
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