import Through from 'through2';
import Path    from 'path';
import Fs      from 'fs'; 
import Sass    from 'node-sass';

function compileSass(data, indentedSyntax, sync) {

	data = data.split(/\{\{|\}\}/)
		.map((expr, i) => {

			if (i % 2 == 0) {
				return expr.replace(/^(\s*)(\%)/, '$1#{"$2"}');
			}

			return `#{"[var__=${expr.replace(/"/g, '\\"')}__var]"}`;
		})
		.join("");

	if (sync) {

		var result = Sass.renderSync({ data, indentedSyntax });

		return generateTemplateModule(result.css.toString('utf8'));

	} else {

		return new Promise((resolve, reject) => {

			Sass.render({ data, indentedSyntax }, (err, result) => {

				if (err) {
					return reject(err);
				}

				resolve(generateTemplateModule(result.css.toString('utf8')));
			});
		});
	}
}

function generateTemplateModule(cssTemplateString) {

	cssTemplateString = cssTemplateString
		.replace(/"/g, '\\"')
		.replace(/\n/g, "\\n")
		.split(/\{\{|\}\}|\[var__=|__var\]/)
		.map((expr, i) => {

			if (i % 2 == 0) {
				return expr;
			}

			return `" + (${expr.replace(/(^|[^\.\w])([a-z\$_]\w*)/g, "$1variables.$2")}) + "`;
		})
		.join("");

	return `module.exports = function(variables) {
		return "${cssTemplateString}";
	}`;
}

module.exports =
function StyleTemplateify(file) {
	return Through(function(buf, enc, next) {
		
		var ext  = Path.extname(file),
			data = buf.toString('utf8');

		if (ext == ".sasst" || ext == ".scsst") {

			compileSass(data, ext == ".sasst")
			.then((module) => {
				this.push(module);
				next();
			})
			.catch(function(err) {
				next(err);
			});

		} else 
		if (ext == ".csst") {

			this.push(generateTemplateModule(data));
			next();
			
		} else {

			this.push(data);
			next();
		}
	});
}

module.exports.install = 
function install() {

	require.extensions['.sasst'] = (module, filename) => { 
		eval(compileSass(Fs.readFileSync(filename, 'utf8'), true, true));
	};

	require.extensions['.scsst'] = (module, filename) => { 
		eval(compileSass(Fs.readFileSync(filename, 'utf8'), false, true)); 
	};

	require.extensions['.csst'] = (module, filename) => { 
		eval(generateTemplateModule(Fs.readFileSync(filename, 'utf8'))); 
	};
}