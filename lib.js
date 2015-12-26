var path = require('path'),
	sass = require('node-sass'),
	through = require('through2');

module.exports = function(file) {
	return through(function(buf, enc, next) {
		
		var ext = path.extname(file),
			source = buf.toString('utf8');

		if (ext == ".sasst" || ext == ".scsst") {

			source = source.replace(/(\$[\w\-\.]+)/g, '#{"$1"}');
			source = source.split(/\{\{|\}\}/)
				.map(function(expr, i) {

					if (i % 2 == 0) {
						return expr;
					}

					return '#{"{{' + expr.replace(/"/g, '\\"') + '}}"}';
				})
				.join("");

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

function definition(variables) {

	if (typeof variables == "undefined") {
		return "";
	}

	var variablesString = "";

	for (var key in variables) {

		var variable = variables[key];

		variablesString += "," + key + '=variables["' + key + '"]\n'; 
	}

	return "var " + variablesString.replace(",", "") + ";";
}

function generateTemplateModule(cssTemplateString) {

	cssTemplateString = cssTemplateString
		.replace(/"/g, '\\"')
		.replace(/\n/g, "\\n")
		.split(/\{\{|\}\}/)
		.map(function(expr, i) {

			if (i % 2 == 0) {
				return expr;
			}

			return '" + (' + expr + ') + "'
		})
		.join("");

	return definition +

		'function template(variables) {' +
			'eval(definition(variables));' + 
			'return "' + cssTemplateString + '";' +
		'}' +

		'module.exports = function(variables) {' +
			'try {' +
				'return template(variables);' +
			'} catch(e) {' +
				'return "";' +
			'}' +
		'};';
}