var pegasus = require('pegasus'),
	uglifyJS = require('uglify-js'),
	util = pegasus.util;

var CONTENT_TYPES = [
		'text/javascript',
		'application/x-javascript',
		'application/javascript'
	],

	/**
	 * Pipe function factory.
	 * @param config {Object}
	 */
	uglifyjs = pegasus.createPipe({
		/**
		 * Initializer.
		 * @param config {Object}
		 */
		_initialize: function (config) {
			this._config = config;
		},

		/**
		 * Pipe function entrance.
		 * @param request {Object}
		 * @param response {Object}
		 */
		main: function (request, response) {
			var config = this._config,
				parser = uglifyJS.parser,
				uglify = uglifyJS.uglify,
				refined = false,
				ast;

			try {
				ast = parser.parse(response.body());
			} catch (err) {
				util.throwError('%s (line %s, col %s)', err.message, err.line, err.col);
			}

			if (config.mangle) {
				refined = true;
				ast = uglify.ast_mangle(ast, config.mangle);
			}

			if (config.squeeze) {
				refined = true;
				ast = uglify.ast_squeeze(ast, config.squeeze);
			}

			if (refined || config.gencode) {
				response
					.clear()
					.write(uglify.gen_code(ast, config.gencode));
			}

			this.next();
		},

		/**
		 * Check whether to process current request.
		 * @param request {Object}
		 * @param response {Object}
		 * @return {boolean}
		 */
		match: function (request, response) {
			return response.status() === 200 &&
				CONTENT_TYPES.indexOf(response.head('content-type')) !== -1;
		}
	});

module.exports = uglifyjs;