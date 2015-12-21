var path = require('path'),
	sass = require('node-sass'),
	through = require('through2');

module.exports = function(file) {
	return through(function(buf, enc, next) {
		
		var ext = path.extname(file),
			source = buf.toString('utf8');

		if (ext == ".sasst" || ext == ".scsst") {

			source = source.replace(/(\$[\w\-\.]+)/g, '#{"$1"}');

			var self = this;

			sass.render({ data: source, indentedSyntax: ext == ".sasst" }, function(err, result) {
				self.push(generateTemplateModule(result.css.toString('utf8')));
				next();
			});

		} else 
		if (ext == ".csst") {

			this.push(generateTemplateModule(source));
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

function generateTemplateModule(cssTemplateString) {

	cssTemplateString = cssTemplateString
		.replace(/"/g, '\\"')
		.replace(/\n/g, "\\n")
		.replace(/\$[\w\-\.]+/g, function(variable) {
			return '" + resolve(variables, ' + variable.replace(/\$/, '"').replace(/[\.]/g, '", "') + '") + "';
		});

	return resolve + '\nmodule.exports = function(variables) {\n\treturn "' + cssTemplateString + '";\n};';
}