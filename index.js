var Joi = require('joi'),
    dataUriToBuffer = require('data-uri-to-buffer');

var revisitorSchema = {
    content: Joi.string().max(2000000),
    meta: Joi.object().required()
};

exports.register = function (plugin, options, next) {

    if (Array.isArray(options)) {
        /* TODO: support an array of "long form" objects for convenience and
        future potential to pass mutator-specific options object.

        example:

        var foos = [{
            name: "trippyshift",
            mutator: require('trippyshift'),
            options: {
                shiftXMaxPercent: 0.2
            }
        }, {
            name: "butts",
            mutator: require('butts-gm')
        }];

        The mutator options object could be passed as the first argument to the
        mutator instead of the buffer:
            ...
            mutator(mutatorOptions, imgBuf, function (err, mutatedBuffer) {
            ...
        */
        throw new Error('Arrays are not yet supported... Patches welcome?');
    } else {

        /*
        options is expected to be an object with the key representing the base
        path and the value being the mutator function/module.require. Pass in one
        or many of these!

            var options = {
                "trippyshift": require('trippyshift'),
                "butts": require('butts-gm'),
                "mylittlemutant": function(buffer, callback) {
                    //awesome goes here
                    callback(null, someMutatedbuffer)
                }
            };

        The mutator should be a function that takes a buffer and a callback. It
        should then execute the callback with a buffer as the second argument
        or an error as the first argument.

        */

        Object.keys(options).forEach(function (key) {
            buildRevisitorRoutes(key, options[key]);
        });
    }


    function buildRevisitorRoutes(basePath, mutator) {
        // http://revisit.link/spec.html

        if (!basePath) throw new Error('No name specified!. Please give me a name!');
        if (!mutator) throw new Error('No mutator function passed for ' + basePath + '! Please pass in a mutator!');

        //  HEAD / where it can return a 200 response when we ping the server to see if it is up.
        plugin.route({
            method: 'HEAD',
            path: '/' + basePath + '/',
            handler: function (request, reply) {
                reply().code(200);
            }
        });

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