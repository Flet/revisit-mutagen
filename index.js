var Joi = require('joi'),
    dataUriToBuffer = require('data-uri-to-buffer');

// http://revisit.link/spec.html
var revisitorSchema = {
    content: Joi.string().max(2000000),
    meta: Joi.object().required()
};

exports.register = function (plugin, options, next) {

    if (Array.isArray(options)) {
        //TODO: support an array of "long form" objects and future potential to pass a mutator-specific options object.
        throw new Error('Arrays of endpoints are not yet supported... Patches welcome?');
    } else {

        Object.keys(options).forEach(function (key) {
            buildRevisitorRoutes(key, options[key]);
        });
    }

    function buildRevisitorRoutes(basePath, mutator) {

        if (!basePath) throw new Error('No name specified!. Please give me a name!');
        if (!mutator) throw new Error('No mutator function passed for ' + basePath + '! Please pass in a mutator!');

        //TODO: add support mutator to be an array of mutators. Just send the content through each one in order every time.


        // HEAD - return a 200 response when the hub pings the server to see if it is up.
        plugin.route({
            method: 'HEAD',
            path: '/' + basePath + '/',
            handler: function (request, reply) {
                reply().code(200);
            }
        });

        // POST - run the content through the mutator and return a revisit.link compatible object
        plugin.route({
            method: 'POST',
            path: '/' + basePath + "/service",
            handler: function (request, reply) {
                var imgBuf = dataUriToBuffer(request.payload.content),
                    imgType = imgBuf.type;

                mutator(imgBuf, function (err, mutatedBuffer) {
                    if (err) reply().code(500);

                    reply({
                        content: "data:" + imgType + ";base64," + mutatedBuffer.toString('base64'),
                        meta: {}
                    }).code(200);
                });
            },
            config: {
                validate: {
                    payload: revisitorSchema,
                },
                response: {
                    schema: revisitorSchema
                }
            }
        });
    }

    next();
};

exports.register.attributes = {
    pkg: require('./package.json'),
    multiple: true
};