var fs        = require('fs'),
	path      = require('path'),
	compilify = require('compilify');

var worker = fs.readFileSync(__dirname + "/node_modules/sass.js/dist/sass.worker.js", "utf8")
	.replace(/"/g, '\\"');

module.exports = compilify(function(file) {

	return generateTemplateModule(file);

}, {
	extensions: [".sasst", ".scsst"],
});

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
	
	return moduleString;
}