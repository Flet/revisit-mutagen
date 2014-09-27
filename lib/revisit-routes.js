var dataUriToBuffer = require('data-uri-to-buffer')

var plugin,
	options,
	revisitorSchema

module.exports = function(iplugin, ioptions) {
	plugin = iplugin
	options = ioptions

	revisitorSchema = require('./revisitor-schema.js')(options)

	return {
		build: buildRoutes
	}
}

// TODO: add support mutator to be an array of mutators. Just send the content through each one in order every time.

function buildRoutes(name, mutator) {
	var basePath = '/' + name

	// POST - run the content through the mutator and return a revisit.link compatible object
	plugin.route({
		method: 'POST',
		path: basePath + '/service',
		handler: function(request, reply) {
			var imgBuf = dataUriToBuffer(request.payload.content.data),
				imgType = imgBuf.type

			mutator(imgBuf, function(err, mutatedBuffer) {
				if (err) {
					reply(err).code(400)
				}

				reply({
					content: {
						data: 'data:' + imgType + 'base64,' + mutatedBuffer.toString('base64')
					},
					meta: request.payload.meta
				}).code(200)
			})
		},
		config: {
			validate: {
				payload: revisitorSchema
			},
			response: {
				schema: revisitorSchema
			}
		}
	})
}
