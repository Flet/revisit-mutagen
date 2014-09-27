exports.register = function(plugin, options, next) {

    var sampleRoutes = require('./lib/sample-routes.js')(plugin, options),
        revisitRoutes = require('./lib/revisit-routes.js')(plugin, options)

    var glitches = options.glitches

    if (!glitches) throw new Error('no options.glitches were passed!')

    if (Array.isArray(glitches)) throw new Error('Arrays of endpoints are not yet supported... Patches welcome?')

    // HEAD - return a 200 response when the hub pings the server to see if it is up.
    plugin.route({
        method: 'HEAD',
        path: '/{anything?}',
        handler: function(request, reply) {
            reply().code(200)
        }
    })

    Object.keys(glitches).forEach(function(name) {

        // a bit of validation
        if (!name) throw new Error('No name specified!. Please give me a name!')
        if (!glitches[name] || typeof glitches[name] !== 'function')
            throw new Error('No mutator function passed for ' + name + '! Please pass in a mutator!')
        sampleRoutes.build(name, glitches[name])
        revisitRoutes.build(name, glitches[name])
    })

    next()
}

exports.register.attributes = {
    pkg: require('./package.json'),
    multiple: true
}
