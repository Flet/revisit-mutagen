var fs = require('fs'),
    path = require('path')

var jpgSamples = {},
    gifSamples = {},
    moreSampleBufs = {},
    plugin,
    options,
    jpgSampleBuf,
    gifSampleBuf,
    moreSamples

module.exports = function(iplugin, ioptions) {
    plugin = iplugin
    options = ioptions

    jpgSampleBuf = fs.readFileSync(options.sampleJpg || path.join(__dirname, '../sample.jpg'))
    gifSampleBuf = fs.readFileSync(options.sampleGif || path.join(__dirname, '../sample.gif'))

    moreSamples = options.moreSamples

    return {
        build: buildRoutes
    }
}

function buildRoutes (name, mutator) {
    var basePath = '/' + name

    // lets generate a jpeg sample
    mutator(jpgSampleBuf, function(err, newsample) {
        if(err) throw err;
        jpgSamples[name] = newsample
    })

    // lets generate a gif sample
    mutator(gifSampleBuf, function(err, newsample) {
        if(err) throw err;
        gifSamples[name] = newsample
    })

    plugin.route({
        method: 'GET',
        path: basePath + '/sample.jpg',
        handler: function(request, reply) {
            reply(jpgSamples[name]).type('image/jpeg')
        }
    })

    plugin.route({
        method: 'GET',
        path: basePath + '/sample.gif',
        handler: function(request, reply) {
            reply(gifSamples[name]).type('image/gif')
        }
    })

    plugin.route({
        method: 'GET',
        path: basePath + '/livesample.jpg',
        handler: function(request, reply) {
            mutator(jpgSampleBuf, function(err, newsample) {
                if(err) throw err;
                reply(newsample).type('image/jpeg')
            })
        }
    })

    plugin.route({
        method: 'GET',
        path: basePath + '/livesample.gif',
        handler: function(request, reply) {
            mutator(gifSampleBuf, function(err, newsample) {
                if(err) throw err;
                reply(newsample).type('image/gif')
            })
        }
    })

    //more samples will always be 'live'
    if (moreSamples) {
        moreSamples.forEach(function(sample) {
            moreSampleBufs[sample] = fs.readFileSync(sample)
            var ext = path.extname(sample)
            if (ext === 'jpg') ext = 'jpeg'
            ext = ext.slice(1)

            plugin.route({
                method: 'GET',
                path: basePath + '/' + path.basename(sample),
                handler: function(request, reply) {
                    mutator(moreSampleBufs[sample], function(err, newsample) {
                        if(err) throw err;
                        reply(newsample).type('image/' + ext)
                    })
                }
            })
        })
    }
}
