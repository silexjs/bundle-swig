var pa = require('path');
var fs = require('fs');

var Templating = function(kernel) {
	var self = this;
	this.kernel = kernel;
	this.swig = require('swig');
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
						var bundle = { dir: self.kernel.rootDir+'/app' };
					}
					var file = bundle.dir+'/Resources/views/'+(toView[2]===''?'':toView[2]+'/')+toView[3];
					if(fs.existsSync(file) === false) {
						throw new Error('SILEX.SWIG: The view "'+toArray.join(':')+'"  does not exist. ('+file+')');
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
	kernel: null,
	swig: null,
	
	renderView: function(view, parameters) {
		var parameters = parameters || {};
		return this.swig.renderFile(view, parameters);
	},
	renderViewResponse: function(view, parameters, request, response) {
		if(response.getHeader('content-type') === undefined) {
			response.setHeader('content-type', 'text/html');
		}
		response.content += this.renderView(view, parameters);
		response.hasResponse = true;
	},
	
	setFilter: function(filterName, callback) {
		return this.swig.setFilter(filterName, callback);
	},
};


module.exports = Templating;
