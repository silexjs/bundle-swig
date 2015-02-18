var pa = require('path');
var fs = require('fs');
var mime = require('mime-types');

var Templating = function(kernel, config) {
	this.swig = require('swig');
	var cache = config.get('framework.templating.cache');
	if(cache !== undefined) { cache = Boolean(cache); }
	if(cache === true || (cache === undefined && kernel.debug === false)) {
		this.swig.setDefaults({ cache: {
			get: function(key) { return kernel.cache.get('SilexSwigBundle.templating.'+key); },
			set: function(key, value) { return kernel.cache.set('SilexSwigBundle.templating.'+key, value); },
		} });
	} else {
		this.swig.setDefaults({ cache: false });
	}
	
	this.swig.setDefaults({
		loader: {
			resolve: function(to, from) {
				var toView = to.match(/^(.*)\:(.*)\:(.+)$/i);
				if(toView !== null) {
					if(toView[1] !== '') {
						var bundle = kernel.getBundle(toView[1]);
						if(bundle === null) {
							throw new Error('SILEX.SWIG: The bundle "'+toView[1]+'" of the view requested does not exist. ('+to+')');
						}
					} else {
						var bundle = { dir: kernel.dir.app };
					}
					var file = bundle.dir+'/Resources/views/'+(toView[2]===''?'':toView[2]+'/')+toView[3];
					if(fs.existsSync(file) === false) {
						throw new Error('SILEX.SWIG: The view "'+to+'" does not exist. ('+file+')');
					}
					to = file;
				}
				if(from !== undefined) {
					return pa.resolve(pa.dirname(from), to);
				} else {
					return pa.resolve(to)
				}
			},
			load: function(filePath) {
				if(fs.existsSync(filePath) === false) {
					throw new Error('SILEX.SWIG: Failed to load the view "'+pa.basename(filePath)+'". ("'+filePath+'")');
				} else {
					return ''+fs.readFileSync(filePath);
				}
			},
		},
	});
};
Templating.prototype = {
	name: 'swig',
	swig: null,
	
	renderView: function(view, parameters) {
		var parameters = parameters || {};
		return this.swig.renderFile(view, parameters);
	},
	_send: function(content, contentType, status, request, response) {
		response.setContentType(contentType);
		response.content += content;
		response.statusCode = status || 200;
		response.hasResponse = true;
	},
	sendView: function(view, parameters, status, request, response) {
		if(response.getHeader('content-type') === undefined) {
			var contentType = mime.contentType(view.replace(/\.twig$/i, ''));
			if(contentType === false) {
				contentType = 'text/plain';
			}
			response.setHeader('content-type', contentType);
		}
		this._send(this.renderView(view, parameters), contentType, status, request, response);
	},
	sendText: function(text, status, request, response) {
		this._send(text, 'text/plain', status, request, response);
	},
	sendHtml: function(html, parameters, status, request, response) {
		this._send(this.swig.render(html, { locals: parameters || {} }), 'text/html', status, request, response);
	},
	sendJson: function(json, beautify, status, request, response) {
		this._send(JSON.stringify(json, null, (beautify===false?null:(beautify===true?'\t':beautify))), 'application/json', status, request, response);
	},
	
	setFilter: function(filterName, callback) {
		return this.swig.setFilter(filterName, callback);
	},
	setTag: function(name, parse, compile, ends, blockLevel) {
		return this.swig.setTag(name, parse, compile, ends, blockLevel);
	},
};


module.exports = Templating;
