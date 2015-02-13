var pa = require('path');
var fs = require('fs');
var mime = require('mime-types');

var Templating = function(kernel, config) {
	var self = this;
	this.kernel = kernel;
	this.config = config;
	this.swig = require('swig');
	var cache = this.config.get('framework.templating.cache');
	if((cache === 'true' || cache === true)
	|| (cache !== 'true' && cache !== true && this.kernel.debug === true)) {
		this.swig.setDefaults({ cache: {
			get: function(key) { return self.kernel.cache.get('SilexSwigBundle.templating.'+key); },
			set: function(key, value) { return self.kernel.cache.set('SilexSwigBundle.templating.'+key, value); },
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
						var bundle = self.kernel.getBundle(toView[1]);
						if(bundle === null) {
							throw new Error('SILEX.SWIG: The bundle "'+toView[1]+'" of the view requested does not exist. ('+to+')');
						}
					} else {
						var bundle = { dir: self.kernel.dir.app };
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
	kernel: null,
	config: null,
	swig: null,
	
	renderView: function(view, parameters) {
		var parameters = parameters || {};
		return this.swig.renderFile(view, parameters);
	},
	sendView: function(view, parameters, request, response) {
		if(response.getHeader('content-type') === undefined) {
			var contentType = mime.contentType(view.replace(/\.twig$/i, ''));
			if(contentType === false) {
				contentType = 'text/plain';
			}
			response.setHeader('content-type', contentType);
		}
		response.content += this.renderView(view, parameters);
		response.hasResponse = true;
	},
	sendHtml: function(html, parameters, request, response) {
		response.setHeader('content-type', 'text/html');
		response.content += this.swig.render(html, { locals: parameters });
		response.hasResponse = true;
	},
	sendJson: function(json, beautify, request, response) {
		response.setHeader('content-type', 'application/json');
		response.content += JSON.stringify(json, null, (beautify===false?null:(beautify===true?'\t':beautify)));
		response.hasResponse = true;
	},
	
	setFilter: function(filterName, callback) {
		return this.swig.setFilter(filterName, callback);
	},
	setTag: function(name, parse, compile, ends, blockLevel) {
		return this.swig.setTag(name, parse, compile, ends, blockLevel);
	},
};


module.exports = Templating;
