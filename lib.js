var path = require('path'),
	sass = require('node-sass'),
	through = require('through2');

module.exports = function(file) {
	return through(function(buf, enc, next) {

		var ext = path.extname(file),
			source = buf.toString('utf8');

		if (ext == ".sast") {

			source = source.replace(/(\$[\w\-\.]+)/g, '${"$1"}');

			sass.render({ data: source }, function(err, result) {
				this.push(generateTemplateModule(result.css.toString('utf8')));
				next();
			});

		} else 
		if (ext == ".cst") {

			this.push(generateTemplateModule(source));
			next();
		}
	});
};

function resolve(variables) {

	var result, path = arguments;
	[].shift.call(path);

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

function generateTemplateModule(cssTemplateString) {

	cssTemplateString = cssTemplateString.replace(/\$[\w\-\.]+/g, function(variable) {
		return '" + resolve(variables, ' + variable.replace(/\$/, '"').replace(/[\.]/g, '", "') + '") + "';
	});

	var res = resolve + '\nmodule.exports = function(variables) {\n\treturn "' + cssTemplateString + '";\n};';
	console.log(res);
	return res;
}