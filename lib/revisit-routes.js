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

function buildRoutes(name, mutator, mutatorOptions) {
	var basePath = '/' + name

	// POST - run the content through the mutator and return a revisit.link compatible object
	plugin.route({
		method: 'POST',
		path: basePath + '/service',
		handler: mutatorOptions.rawPayload ? postHandlerRawPayload : postHandler,
		config: {
			validate: {
				payload: revisitorSchema
			},
			response: {
				schema: revisitorSchema
			}
		}
	})

	function postHandler(request, reply) {
		var imgBuf = dataUriToBuffer(request.payload.content.data),
			imgType = imgBuf.type

		mutator(imgBuf, function(err, mutatedBuffer) {
			if (err) {
				return reply(err).code(400)
			}

			var resp = {
				content: {
					data: 'data:' + imgType + ';base64,' + mutatedBuffer.toString('base64')
				},
				meta: request.payload.meta
			}

			reply(resp).code(200)
		})
	}

	function postHandlerRawPayload(request, reply) {
		var rawPayload = request.payload

		mutator(rawPayload, function(err, rawPayloadReply) {
			if (err) {
				return reply(err).code(400)
			}

			reply(rawPayloadReply).code(200)
		})
	}
}
