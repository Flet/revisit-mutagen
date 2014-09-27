var Joi = require('joi')

function schemaGen(options) {
	// http://revisit.link/spec.html

	var schema = {
		content: {
			data: Joi.string().max(options.maxDataSize || 2000000)
		},
		meta: Joi.object()
	}


	return schema
}

module.exports = schemaGen
