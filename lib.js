var fs        = require('fs'),
	path      = require('path'),
	through   = require('through2');

var worker;

module.exports = function(file) {
	return through(function(buf, enc, next) {
		
		var ext = path.extname(file),
			source = buf.toString('utf8');

		if (ext == ".sasst" || ext == ".scsst") {

			this.push(generateTemplateModule(source, ext == ".sasst"));
			next();
			
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

function generateTemplateModule(styleTemplateString, indent) {

	styleTemplateString = 
	'"' + styleTemplateString
		.replace(/"/g, '\\"')
		.replace(/\n/g, "\\n")
		.replace(/\$[\w\-\.]+/g, function(variable) {
			return '" + resolve(variables, ' + variable.replace(/\$/, '"').replace(/[\.]/g, '", "') + '") + "';
		}) + 
	'"';

	var moduleString = 
		'var sass = require("sass.js");' +
		resolve + 
		'module.exports = function(variables) {' +
			'return new Promise(function(_resolve) {' +
				'sass.compile(' + styleTemplateString + ', { indentedSyntax: ' + (indent?'true':'false') + '}, function(result) { _resolve(result.text) });' + 
			'});' +
		'};';
	
	return moduleString;
}