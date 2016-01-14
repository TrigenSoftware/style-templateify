var fs   = require('fs'), 
	path = require('path'),
	sass = require('node-sass'),
	through = require('through2');

function compileSass(source, indentedSyntax, sync) {
	return new Promise(function(resolve, reject) {

		source = source.split(/\{\{|\}\}/)
			.map(function(expr, i) {

				if (i % 2 == 0) {
					return expr;
				}

				return '#{"[var__=' + expr.replace(/"/g, '\\"') + '__var]"}';
			})
			.join("");

		if (sync) {

			var result = sass.renderSync({ data: source, indentedSyntax: indentedSyntax });

			resolve(generateTemplateModule(result.css.toString('utf8')));

		} else {

			sass.render({ data: source, indentedSyntax: indentedSyntax }, function(err, result) {

				if (err) {
					return reject(err);
				}

				resolve(generateTemplateModule(result.css.toString('utf8')));
			});
		}
	});
}

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

module.exports = function(file) {
	return through(function(buf, enc, next) {
		
		var ext = path.extname(file),
			source = buf.toString('utf8');

		if (ext == ".sasst" || ext == ".scsst") {

			var self = this;

			compileSass(source, ext == ".sasst")
			.then(function(module) {
				self.push(module);
				next();
			})
			.catch(function(err) {
				next(err);
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

module.exports.nodeHook = function() {

	require.extensions['.sasst'] = function(module, filename) { 
		compileSass(fs.readFileSync(filename, 'utf8'), true, true)
		.then(eval); 
	};

	require.extensions['.scsst'] = function(module, filename) { 
		compileSass(fs.readFileSync(filename, 'utf8'), false, true)
		.then(eval); 
	};

	require.extensions['.csst'] = function(module, filename) { 
		eval(generateTemplateModule(fs.readFileSync(filename, 'utf8'))); 
	};
};