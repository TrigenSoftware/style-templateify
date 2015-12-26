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

					return '#{"[var__=' + expr.replace(/"/g, '\\"') + '__var]"}';
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

function generateTemplateModule(cssTemplateString) {

	cssTemplateString = cssTemplateString
		.replace(/"/g, '\\"')
		.replace(/\n/g, "\\n")
		.split(/\{\{|\}\}|\[var__=|__var\]/)
		.map(function(expr, i) {

			if (i % 2 == 0) {
				return expr;
			}

			return '" + (' + expr.replace(/(^|[^\.\w])([a-z\$_]\w*)/g, "$1variables.$2") + ') + "'
		})
		.join("");

	return 'module.exports = function(variables) {' +
		'return "' + cssTemplateString + '";' +
	'}';
}