var pa = require('path');
var fs = require('fs');

var Templating = function(kernel) {
	var self = this;
	this.kernel = kernel;
	this.swig = require('swig');
	this.swig.setDefaults({
		loader: {
			resolve: function(to, from) {
				var toArray = to.split(':');
				if(toArray.length === 3) {
					if(toArray[0] !== '') {
						var bundle = self.kernel.getBundle(toArray[0]);
						if(bundle === null) {
							throw new Error('SILEX.SWIG: The bundle "'+toArray[0]+'" of the view requested does not exist. ('+toArray.join(':')+')');
						}
					} else {
						var bundle = { dir: self.kernel.rootDir+'/app' };
					}
					var file = bundle.dir+'/Resources/views/'+(toArray[1]===''?'':toArray[1]+'/')+toArray[2];
					if(fs.existsSync(file) === false) {
						throw new Error('SILEX.SWIG: The view "'+toArray.join(':')+'"  does not exist. ('+file+')');
					}
					to = file;
				} else if(toArray.length !== 0) {
					throw new Error('SILEX.SWIG: The file path does not comply with the following format: "BUNDLE:DIR:VIEW" or "BUNDLE::VIEW". ('+toSilex.join(':')+')');
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
		var parameters = parameters || [];
		return this.swig.renderFile(view, parameters);
	},
	renderViewResponse: function(view, parameters, request, response) {
		if(response.getHeader('content-type') === undefined) {
			response.setHeader('content-type', 'text/html');
		}
		response.content += this.swig.renderFile(view, parameters);
		response.hasResponse = true;
	},
};


module.exports = Templating;
