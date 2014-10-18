var fs = require('fs'),
    path = require('path'),
    dataUriToBuffer = require('data-uri-to-buffer')

var jpgSamples = {},
    gifSamples = {},
    moreSampleBufs = {},
    plugin,
    options,
    jpgSampleBuf,
    gifSampleBuf,
    moreSamples

module.exports = function (iplugin, ioptions) {
    plugin = iplugin
    options = ioptions

    jpgSampleBuf = fs.readFileSync(options.sampleJpg || path.join(__dirname, '../sample.jpg'))
    gifSampleBuf = fs.readFileSync(options.sampleGif || path.join(__dirname, '../sample.gif'))

    moreSamples = options.moreSamples

    return {
        build: buildRoutes
    }
}


function buildRoutes(name, mutator, mutatorOptions) {

    function generateSample(samplebuf, imgType, cb) {
        // lets generate a sample

        if (mutatorOptions.rawPayload) {
            //create a raw payload to send to mutator

            var newpayload = {
                content: {
                    data: 'data:image/' + imgType + ';base64,' + samplebuf.toString('base64')
                },
                meta: {}
            }

            mutator(newpayload, function (err, replyPayload) {
                if (err) return cb(err)
                try {
                    var imgBuf = dataUriToBuffer(replyPayload.content.data)
                    return cb(null, imgBuf)
                } catch (error) {
                    return cb(err)
                }

            })

        } else {
            mutator(samplebuf, function (err, sample) {
                if (err) return cb(err)
                return cb(null, sample)
            })
        }
    }

    var basePath = '/' + name

    // lets generate a jpeg sample
    if (mutatorOptions.staticSampleJpg) {
        jpgSamples[name] = fs.readFileSync(mutatorOptions.staticSampleJpg)
    } else {
        generateSample(jpgSampleBuf, 'jpeg', function (err, newsample) {
            if (err) throw err;
            jpgSamples[name] = newsample
        })
    }

    // lets generate a gif sample
    if (mutatorOptions.staticSampleGif) {
        gifSamples[name] = fs.readFileSync(mutatorOptions.staticSampleGif)
    } else {
        generateSample(gifSampleBuf, 'gif', function (err, newsample) {
            if (err) throw err;
            gifSamples[name] = newsample
        })
    }


    plugin.route({
        method: 'GET',
        path: basePath + '/sample.jpg',
        handler: function (request, reply) {
            reply(jpgSamples[name]).type('image/jpeg')
        }
    })

    plugin.route({
        method: 'GET',
        path: basePath + '/sample.gif',
        handler: function (request, reply) {
            reply(gifSamples[name]).type('image/gif')
        }
    })

    plugin.route({
        method: 'GET',
        path: basePath + '/livesample.jpg',
        handler: function (request, reply) {
            generateSample(jpgSampleBuf, 'jpeg', function (err, newsample) {
                if (err) throw err;
                reply(newsample).type('image/jpeg')
            })
        }
    })

    plugin.route({
        method: 'GET',
        path: basePath + '/livesample.gif',
        handler: function (request, reply) {
            generateSample(gifSampleBuf, 'gif', function (err, newsample) {
                if (err) throw err;
                reply(newsample).type('image/gif')
            })
        }
    })

    //more samples will always be 'live'
    if (moreSamples) {
        moreSamples.forEach(function (sample) {
            moreSampleBufs[sample] = fs.readFileSync(sample)
            var ext = path.extname(sample)
            ext = ext.slice(1)
            if (ext === 'jpg') ext = 'jpeg'

            plugin.route({
                method: 'GET',
                path: basePath + '/' + path.basename(sample),
                handler: function (request, reply) {
                    generateSample(moreSampleBufs[sample], ext, function (err, newsample) {
                        if (err) throw err;
                        reply(newsample).type('image/' + ext)
                    })
                }
            })
        })
    }
}
