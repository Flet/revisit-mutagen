var Joi = require('joi'),
    dataUriToBuffer = require('data-uri-to-buffer'),
    fs = require('fs'),
    path = require('path');

// http://revisit.link/spec.html
var jpgSamples = {},
    gifSamples = {},
    moreSampleBufs = {};

exports.register = function(plugin, options, next) {

    var revisitorSchema = {
        content: {
            data: Joi.string().max(options.maxDataSize || 2000000)
        },
        meta: Joi.object()
    };

    var sampleGif = options.sampleGif || __dirname + '/sample.gif',
        sampleJpg = options.sampleJpg || __dirname + '/sample.jpg';

    var jpgSampleBuf = fs.readFileSync(sampleJpg),
        gifSampleBuf = fs.readFileSync(sampleGif),
        glitches = options.glitches,
        moreSamples = options.moreSamples;

    if (!glitches) {
        throw new Error('no options.glitches were passed!');
    }

    if (Array.isArray(glitches)) {
        //TODO: support an array of 'long form' objects and future potential to pass a mutator-specific glitches object.
        throw new Error('Arrays of endpoints are not yet supported... Patches welcome?');
    } else {


        // HEAD - return a 200 response when the hub pings the server to see if it is up.
        plugin.route({
            method: 'HEAD',
            path: '/{anything?}',
            handler: function(request, reply) {
                reply().code(200);
            }
        });

        Object.keys(glitches).forEach(function(key) {
            buildRevisitorRoutes(key, glitches[key]);
        });
    }

    function buildRevisitorRoutes(name, mutator) {

        // lets generate a jpeg sample
        mutator(jpgSampleBuf, function(err, newsample) {
            jpgSamples[name] = newsample;
        });

        // lets generate a gif sample
        mutator(gifSampleBuf, function(err, newsample) {
            gifSamples[name] = newsample;
        });

        var basePath = '/' + name;

        if (!basePath) throw new Error('No name specified!. Please give me a name!');
        if (!mutator) throw new Error('No mutator function passed for ' + basePath + '! Please pass in a mutator!');

        //TODO: add support mutator to be an array of mutators. Just send the content through each one in order every time.

        plugin.route({
            method: 'GET',
            path: basePath + '/sample.jpg',
            handler: function(request, reply) {
                reply(jpgSamples[name]).type('image/jpeg');
            }
        });

        plugin.route({
            method: 'GET',
            path: basePath + '/sample.gif',
            handler: function(request, reply) {
                reply(gifSamples[name]).type('image/gif');
            }
        });

        plugin.route({
            method: 'GET',
            path: basePath + '/livesample.jpg',
            handler: function(request, reply) {
                mutator(jpgSampleBuf, function(err, newsample) {
                    reply(newsample).type('image/jpeg');
                });
            }
        });

        plugin.route({
            method: 'GET',
            path: basePath + '/livesample.gif',
            handler: function(request, reply) {
                mutator(gifSampleBuf, function(err, newsample) {
                    reply(newsample).type('image/gif');
                });
            }
        });

        //more samples will always be 'live'
        if (moreSamples) {
            moreSamples.forEach(function(sample) {
                moreSampleBufs[sample] = fs.readFileSync(sample);
                var ext = path.extname(sample);
                if (ext === 'jpg') ext = 'jpeg';
                ext = ext.slice(1);

                plugin.route({
                    method: 'GET',
                    path: basePath + '/' + path.basename(sample),
                    handler: function(request, reply) {
                        mutator(moreSampleBufs[sample], function(err, newsample) {
                            reply(newsample).type('image/' + ext);
                        });
                    }
                });
            });
        }

        // POST - run the content through the mutator and return a revisit.link compatible object
        plugin.route({
            method: 'POST',
            path: basePath + '/service',
            handler: function(request, reply) {
                var imgBuf = dataUriToBuffer(request.payload.content.data),
                    imgType = imgBuf.type;

                mutator(imgBuf, function(err, mutatedBuffer) {
                    if (err) {
                        reply(err).code(400);
                    }

                    reply({
                        content: {
                            data: 'data:' + imgType + ';base64,' + mutatedBuffer.toString('base64'),
                        },
                        meta: request.payload.meta
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